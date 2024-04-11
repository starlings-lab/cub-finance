import { AlchemyProvider, Contract } from "ethers";
import {
  DebtPosition,
  Market,
  Protocol,
  Token,
  TokenAmount,
  UserDebtDetails,
} from "../type/type";
import { Address } from "abitype";
import {
  POOL_ABI,
  POOL_ADDRESS_PROVIDER_ABI,
  UI_POOL_DATA_PROVIDER_V3_ABI,
} from "../contracts/aaveV3";
import { request, gql } from "graphql-request";
import { MESSARI_GRAPHQL_URL } from "../constants";
import { getTokenMetadata } from "./tokenService";
import { calculateAPYFromAPR } from "../utils";

export class BaseAaveService {
  private protocol: Protocol;
  private poolAddressProvider: Address;
  private uiPoolDataProvider: Address;
  private provider: AlchemyProvider;
  private poolDataProviderContract: Contract;
  private poolAddressProviderContract: Contract;

  constructor(
    protocol: Protocol,
    poolAddressProvider: Address,
    uiPoolDataProvider: Address
  ) {
    this.protocol = protocol;
    this.poolAddressProvider = poolAddressProvider;
    this.uiPoolDataProvider = uiPoolDataProvider;

    this.provider = new AlchemyProvider(
      1, // MAINNET
      process.env.ALCHEMY_API_KEY_ETH_MAINNET
    );

    this.poolDataProviderContract = new Contract(
      uiPoolDataProvider,
      UI_POOL_DATA_PROVIDER_V3_ABI,
      this.provider
    );

    this.poolAddressProviderContract = new Contract(
      poolAddressProvider,
      POOL_ADDRESS_PROVIDER_ABI,
      this.provider
    );
  }

  public async getUserDebtDetails(
    userAddress: Address
  ): Promise<UserDebtDetails> {
    const markets: Market[] = [];
    const debtPositions: DebtPosition[] = [];
    let weightedMaxLTV = 0;

    const userReservesMap = await this.getUserReservesMap(userAddress);
    const userReserves = Array.from(userReservesMap.values());
    // console.log(`User[${userAddress}] reserves: `, userReserves);

    const debtTokenPromises = userReserves
      .filter((r: any) => r.scaledVariableDebt > 0 || r.principalStableDebt > 0)
      .map((r: any) => getTokenMetadata(r.underlyingAsset.toLowerCase()));
    const debtTokens: Token[] = await Promise.all(debtTokenPromises);

    // console.log("Debt tokens: ", debtTokens);
    if (debtTokens.length > 0) {
      const collateralTokenPromises = userReserves
        .filter(
          (r: any) =>
            r.usageAsCollateralEnabledOnUser === true &&
            r.scaledATokenBalance > 0
        )
        .map((r: any) => {
          // console.log("Collateral token: ", r.underlyingAsset);
          return getTokenMetadata(r.underlyingAsset.toLowerCase()).then(
            (token) => {
              // console.log("Collateral token metadata: ", token);
              return token;
            }
          );
        });

      const collateralTokens: Token[] = await Promise.all(
        collateralTokenPromises
      );
      // console.log("Collateral tokens: ", collateralTokens);

      // Get reserve data
      const { reservesMap, baseCurrencyData } = await this.getReservesData();

      // Get user's combined account data
      const userAccountData = await this.getUserAccountData(userAddress);
      console.log("User account data: ", userAccountData);

      const debts: TokenAmount[] = debtTokens.map((debtToken) => {
        const debtUserReserve = userReservesMap.get(debtToken.address);
        return {
          token: debtToken,
          amount: debtUserReserve.scaledVariableDebt,
          amountInUSD: calculateDebtAmountInBaseCurrency(
            debtUserReserve.scaledVariableDebt,
            reservesMap.get(debtToken.address),
            baseCurrencyData.marketReferenceCurrencyUnit
          ),
        };
      });

      const collaterals: TokenAmount[] = collateralTokens.map(
        (collateralToken) => {
          const collateralUserReserve = userReservesMap.get(
            collateralToken.address
          );
          return {
            token: collateralToken,
            amount: collateralUserReserve.scaledATokenBalance,
            amountInUSD: calculateCollateralAmountInBaseCurrency(
              collateralUserReserve.scaledATokenBalance,
              reservesMap.get(collateralToken.address),
              baseCurrencyData.marketReferenceCurrencyUnit
            ),
          };
        }
      );

      // Add an aggregated debt position for user with total collateral and debt
      const totalCollateralAmountInUSD = collaterals.reduce(
        (acc, curr) => acc + curr.amountInUSD,
        0
      );
      const totalDebtAmountInUSD = debts.reduce(
        (acc, curr) => acc + curr.amountInUSD,
        0
      );
      debtPositions.push({
        debt: debts,
        collateral: collaterals,
        LTV: totalDebtAmountInUSD / totalCollateralAmountInUSD,
      });

      // Add a debt position per debt token when user has multiple debts
      if (debtTokens.length > 1) {
        console.log(
          `User has multiple debts (${debtTokens.length}), need to create debt position for each token`
        );
        debts.forEach((debt) => {
          debtPositions.push({
            debt: [debt],
            collateral: collaterals,
            LTV: debt.amountInUSD / totalCollateralAmountInUSD,
          });
        });
      }

      // Add a market for each debt & collateral token
      const underlyingAssets = new Set<Token>([
        ...debtTokens,
        ...collateralTokens,
      ]);

      const marketPromises = Array.from(underlyingAssets).map(
        (underlyingAssetToken: Token) => {
          const tokenReserve = reservesMap.get(underlyingAssetToken.address);
          return this.calculateTrailingDayBorrowingAndLendingAPYs(
            tokenReserve.aTokenAddress
          ).then(({ trailingDayBorrowingAPY, trailingDayLendingAPY }) => {
            return {
              underlyingAsset: underlyingAssetToken,
              maxLTV: Number(tokenReserve.baseLTVasCollateral) / 10000,
              trailing30DaysLendingAPY: trailingDayBorrowingAPY,
              trailing30DaysBorrowingAPY: trailingDayLendingAPY,
            };
          });
        }
      );
      markets.push(...(await Promise.all(marketPromises)));
      weightedMaxLTV = Number(userAccountData.ltv) / 10000;
    }

    return {
      protocol: this.protocol,
      userAddress,
      markets,
      debtPositions,
      weightedMaxLTV,
    };
  }

  /**
   * Calculates trailing day interest rate for a given market.
   * Default trailing days count is 30.
   * @param marketAddress Address of and aave market (aToken address of an asset)
   * @returns
   * @remarks Trailing day interest rate is calculated by fetching hourly snapshots of the market
   * and calculating the average rate for the trailing days.
   */
  public async calculateTrailingDayBorrowingAndLendingAPYs(
    marketAddress: Address,
    trailingDaysCount = 30
  ): Promise<{
    trailingDayBorrowingAPY: number;
    trailingDayLendingAPY: number;
  }> {
    const query = gql`
    query {
      marketHourlySnapshots(
        where: { market: "${marketAddress}" }
        orderBy: blockNumber
        orderDirection: desc
        first: ${24 * trailingDaysCount}
      ) {
        rates(where: {type: VARIABLE}) {
          rate
          side
          type
        }
        blockNumber
      }
    }
  `;
    try {
      const queryResult: any = await request(MESSARI_GRAPHQL_URL, query);
      // console.log(
      //   "Query result count: ",
      //   queryResult.marketHourlySnapshots.length
      // );

      let cumulativeBorrowRate = 0;
      let cumulativeLendRate = 0;
      for (let i = 0; i < queryResult.marketHourlySnapshots.length; i++) {
        const snapshot = queryResult.marketHourlySnapshots[i];
        const rateMapBySide = new Map<string, number>();
        snapshot.rates.forEach((rate: any) => {
          rateMapBySide.set(rate.side, parseFloat(rate.rate) / 100);
        });
        const borrowerRate = rateMapBySide.get("BORROWER") || 0;
        cumulativeBorrowRate += borrowerRate;
        const lenderRate = rateMapBySide.get("LENDER") || 0;
        cumulativeLendRate += lenderRate;
      }

      const trailingDayBorrowRate =
        cumulativeBorrowRate / queryResult.marketHourlySnapshots.length;
      const trailingDayLendRate =
        cumulativeLendRate / queryResult.marketHourlySnapshots.length;

      // console.log(
      //   `Cumulative borrow rate: ${cumulativeBorrowRate}, Cumulative lend rate: ${cumulativeLendRate}`
      // );
      // console.log(
      //   `Trailing day borrow rate: ${trailingDayBorrowRate}, Trailing day lend rate: ${trailingDayLendRate}`
      // );
      const trailingDayBorrowingAPY = calculateAPYFromAPR(
        trailingDayBorrowRate
      );
      const trailingDayLendingAPY = calculateAPYFromAPR(trailingDayLendRate);
      return { trailingDayBorrowingAPY, trailingDayLendingAPY };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async getUserAccountData(userAddress: Address) {
    const poolAddress = await this.poolAddressProviderContract.getPool();
    // console.log("Pool address: ", poolAddress);
    const poolContract = new Contract(poolAddress, POOL_ABI, this.provider);
    const userData = await poolContract.getUserAccountData(userAddress);
    // console.log("User data: ", userData);

    // details: https://docs.aave.com/developers/core-contracts/pool#getuseraccountdata
    return {
      totalCollateralBase: userData.totalCollateralBase, // in base currency = USD
      totalDebtBase: userData.totalDebtBase,
      availableBorrowsBase: userData.availableBorrowsBase,
      currentLiquidationThreshold: userData.currentLiquidationThreshold,
      ltv: userData.ltv,
      healthFactor: userData.healthFactor,
    };
  }

  // Ref: https://docs.aave.com/developers/periphery-contracts/uipooldataproviderv3#userreservedata
  private async getUserReservesMap(
    userAddress: Address
  ): Promise<Map<string, any>> {
    const [userReservesRaw] =
      await this.poolDataProviderContract.getUserReservesData(
        this.poolAddressProvider,
        userAddress
      );
    const userReservesMap = new Map<string, any>();
    userReservesRaw.map((userReserveRaw: any) => {
      userReservesMap.set(userReserveRaw.underlyingAsset.toLowerCase(), {
        underlyingAsset: userReserveRaw.underlyingAsset.toLowerCase(),
        scaledATokenBalance: userReserveRaw.scaledATokenBalance,
        usageAsCollateralEnabledOnUser:
          userReserveRaw.usageAsCollateralEnabledOnUser,
        stableBorrowRate: userReserveRaw.stableBorrowRate,
        scaledVariableDebt: userReserveRaw.scaledVariableDebt,
        principalStableDebt: userReserveRaw.principalStableDebt,
        stableBorrowLastUpdateTimestamp:
          userReserveRaw.stableBorrowLastUpdateTimestamp,
      });
    });

    return userReservesMap;
  }

  // Ref: https://docs.aave.com/developers/periphery-contracts/uipooldataproviderv3#aggregatedreservedata
  private async getReservesData(): Promise<any> {
    const { 0: reservesRaw, 1: poolBaseCurrencyRaw } =
      await this.poolDataProviderContract.getReservesData(
        this.poolAddressProvider
      );

    const reservesMap = new Map<string, any>();
    reservesRaw.map((reserveRaw: any) => {
      reservesMap.set(reserveRaw.underlyingAsset.toLowerCase(), {
        underlyingAsset: reserveRaw.underlyingAsset.toLowerCase(),
        name: reserveRaw.name,
        symbol: reserveRaw.symbol,
        decimals: reserveRaw.decimals,
        baseLTVasCollateral: reserveRaw.baseLTVasCollateral,
        reserveLiquidationThreshold: reserveRaw.reserveLiquidationThreshold,
        reserveLiquidationBonus: reserveRaw.reserveLiquidationBonus,
        reserveFactor: reserveRaw.reserveFactor,
        usageAsCollateralEnabled: reserveRaw.usageAsCollateralEnabled,
        borrowingEnabled: reserveRaw.borrowingEnabled,
        stableBorrowRateEnabled: reserveRaw.stableBorrowRateEnabled,
        isActive: reserveRaw.isActive,
        isFrozen: reserveRaw.isFrozen,
        liquidityIndex: reserveRaw.liquidityIndex,
        variableBorrowIndex: reserveRaw.variableBorrowIndex,
        liquidityRate: reserveRaw.liquidityRate,
        variableBorrowRate: reserveRaw.variableBorrowRate,
        stableBorrowRate: reserveRaw.stableBorrowRate,
        lastUpdateTimestamp: reserveRaw.lastUpdateTimestamp,
        aTokenAddress: reserveRaw.aTokenAddress,
        stableDebtTokenAddress: reserveRaw.stableDebtTokenAddress,
        variableDebtTokenAddress: reserveRaw.variableDebtTokenAddress,
        interestRateStrategyAddress: reserveRaw.interestRateStrategyAddress,
        availableLiquidity: reserveRaw.availableLiquidity,
        totalPrincipalStableDebt: reserveRaw.totalPrincipalStableDebt,
        averageStableRate: reserveRaw.averageStableRate,
        stableDebtLastUpdateTimestamp: reserveRaw.stableDebtLastUpdateTimestamp,
        totalScaledVariableDebt: reserveRaw.totalScaledVariableDebt,
        priceInMarketReferenceCurrency:
          reserveRaw.priceInMarketReferenceCurrency,
        priceOracle: reserveRaw.priceOracle,
        variableRateSlope1: reserveRaw.variableRateSlope1,
        variableRateSlope2: reserveRaw.variableRateSlope2,
        stableRateSlope1: reserveRaw.stableRateSlope1,
        stableRateSlope2: reserveRaw.stableRateSlope2,
        baseStableBorrowRate: reserveRaw.baseStableBorrowRate,
        baseVariableBorrowRate: reserveRaw.baseVariableBorrowRate,
        optimalUsageRatio: reserveRaw.optimalUsageRatio,
        // new fields
        isPaused: reserveRaw.isPaused,
        debtCeiling: reserveRaw.debtCeiling,
        eModeCategoryId: reserveRaw.eModeCategoryId,
        borrowCap: reserveRaw.borrowCap,
        supplyCap: reserveRaw.supplyCap,
        eModeLtv: reserveRaw.eModeLtv,
        eModeLiquidationThreshold: reserveRaw.eModeLiquidationThreshold,
        eModeLiquidationBonus: reserveRaw.eModeLiquidationBonus,
        eModePriceSource: reserveRaw.eModePriceSource,
        eModeLabel: reserveRaw.eModeLabel,
        borrowableInIsolation: reserveRaw.borrowableInIsolation,
        accruedToTreasury: reserveRaw.accruedToTreasury,
        unbacked: reserveRaw.unbacked,
        isolationModeTotalDebt: reserveRaw.isolationModeTotalDebt,
        debtCeilingDecimals: reserveRaw.debtCeilingDecimals,
        isSiloedBorrowing: reserveRaw.isSiloedBorrowing,
        flashLoanEnabled: reserveRaw.flashLoanEnabled,
      });
    });
    // console.log("Reserves data: ", reservesMap);
    // console.log("Pool base currency: ", poolBaseCurrencyRaw);

    // See https://docs.aave.com/developers/periphery-contracts/uipooldataproviderv3#basecurrencyinfo
    const baseCurrencyData = {
      marketReferenceCurrencyUnit:
        poolBaseCurrencyRaw.marketReferenceCurrencyUnit,
      marketReferenceCurrencyPriceInUsd:
        poolBaseCurrencyRaw.marketReferenceCurrencyPriceInUsd,
      networkBaseTokenPriceInUsd:
        poolBaseCurrencyRaw.networkBaseTokenPriceInUsd,
      networkBaseTokenPriceDecimals:
        poolBaseCurrencyRaw.networkBaseTokenPriceDecimals,
    };

    return { reservesMap, baseCurrencyData };
  }

  // private async getAssetPrice(
  //   assetAddress: Address
  // ): Promise<{ price: bigint; currencyUnit: bigint }> {
  //   // get asset price which is in base currency & its unit
  //   const pricePromise = this.aaveOracleContract.getAssetPrice(assetAddress);
  //   const currencyUnitPromise = this.aaveOracleContract.BASE_CURRENCY_UNIT();

  //   return Promise.all([pricePromise, currencyUnitPromise]).then((values) => {
  //     console.log("Currency unit: ", values[0]);
  //     console.log("Asset price: ", values[1]);

  //     return { price: values[0], currencyUnit: values[1] };
  //   });
  // }
}

function calculateDebtAmountInBaseCurrency(
  scaledVariableDebt: bigint,
  assetReserveData: any,
  baseCurrencyUnit: bigint
): number {
  // Ref: https://docs.aave.com/developers/guides/rates-guide#variable-borrow-balances
  // Variable borrow balance =
  // VariableDebtToken.balanceOf(user) = VariableDebtToken.scaledBalanceOf(user) * Pool.getReserveData(underlyingTokenAddress).variableBorrowIndex
  const borrowAmountInBaseCurrency =
    (scaledVariableDebt *
      assetReserveData.variableBorrowIndex *
      assetReserveData.priceInMarketReferenceCurrency) /
    (BigInt(10 ** 27) * BigInt(10 ** Number(assetReserveData.decimals))); // borrow index uses ray decimals, see https://docs.aave.com/developers/v/2.0/glossary

  // Multiply and divide by 10000 to maintain 4 decimal places precision
  // TODO: need to get base currency unit(10 ** 8) from contract
  return (
    Number((borrowAmountInBaseCurrency * BigInt(10000)) / baseCurrencyUnit) /
    10000
  );
}

function calculateCollateralAmountInBaseCurrency(
  scaledATokenBalance: bigint,
  assetReserveData: any,
  baseCurrencyUnit: bigint
): number {
  // Ref: https://docs.aave.com/developers/guides/rates-guide#supply-balances
  // Supply balance =
  // AToken.balanceOf(user) = AToken.scaledBalanceOf(user) * Pool.getReserveData(underlyingTokenAddress).liquidityIndex
  // console.log("Scaled AToken balance: ", scaledATokenBalance);

  const supplyAmount =
    (scaledATokenBalance * assetReserveData.liquidityIndex) / BigInt(10 ** 27); // Liquidity index uses ray decimals, see https://docs.aave.com/developers/v/2.0/glossary
  // console.log("Supply amount: ", supplyAmount);

  const supplyAmountInBaseCurrency =
    (supplyAmount * assetReserveData.priceInMarketReferenceCurrency) /
    BigInt(10 ** Number(assetReserveData.decimals));

  // Multiply and divide by 10000 to maintain 4 decimal places precision
  // TODO: need to get base currency unit(10 ** 8) from contract
  return (
    Number((supplyAmountInBaseCurrency * BigInt(10000)) / baseCurrencyUnit) /
    10000
  );
}
