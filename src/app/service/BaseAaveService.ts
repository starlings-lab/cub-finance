import { AlchemyProvider, Contract } from "ethers";
import { DebtPosition, Token } from "../type/type";
import { Address } from "abitype";
import {
  AAVE_ORACLE_ABI,
  POOL_ABI,
  POOL_ADDRESS_PROVIDER_ABI,
  UI_POOL_DATA_PROVIDER_V3_ABI,
} from "../contracts/aaveV3";
import { request, gql } from "graphql-request";
import { MESSARI_GRAPHQL_URL } from "../constants";
import { getTokenMetadata } from "./tokenService";
import { e } from "mathjs";

export class BaseAaveService {
  private poolAddressProvider: Address;
  private uiPoolDataProvider: Address;
  private provider: AlchemyProvider;
  private poolDataProviderContract: Contract;
  private poolAddressProviderContract: Contract;

  constructor(poolAddressProvider: Address, uiPoolDataProvider: Address) {
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

  public async getUserDebtPositions(
    userAddress: Address
  ): Promise<DebtPosition[]> {
    const debtPositions: DebtPosition[] = [];
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
      const reservesMap = await this.getReservesData();

      // Get user's combined account data
      const userAccountData = await this.getUserAccountData(userAddress);
      // console.log("User account data: ", userAccountData);

      // Add an aggregated debt position for user with total collateral and debt
      debtPositions.push({
        collateralTokens: collateralTokens,
        debtToken: debtTokens[0],
        collateralAmount: userAccountData.totalCollateralBase,
        debtAmount: userAccountData.totalDebtBase,
        LTV: 0,
      });

      if (debtTokens.length > 1) {
        console.log(
          `User has multiple debts (${debtTokens.length}), need to create debt position for each token`
        );
        // Add a position per debt token when user has multiple debts
        for (let i = 0; i < debtTokens.length; i++) {
          const debtToken = debtTokens[i];
          console.log(
            "Debt Reserve data: ",
            reservesMap.get(debtToken.address)
          );

          debtPositions.push({
            collateralTokens: collateralTokens,
            debtToken,
            collateralAmount: userAccountData.totalCollateralBase,
            debtAmount: this.calculateDebtAmount(
              userReservesMap.get(debtToken.address).scaledVariableDebt,
              reservesMap.get(debtToken.address)
            ),
            LTV: 0,
          });
        }
      }
    }

    return debtPositions;
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

  public async getInterestRates(marketAddress: Address): Promise<any[]> {
    const query = gql`
    query {
      marketHourlySnapshots(
        where: { market: "${marketAddress}" }
        orderBy: blockNumber
        orderDirection: desc
      ) {
        rates {
          rate
          side
          type
        }
        blockNumber
        timestamp
      }
    }
  `;
    try {
      const queryResult: any = await request(MESSARI_GRAPHQL_URL, query);
      console.log(
        "Query result count: ",
        queryResult.marketHourlySnapshots.length
      );
      // const debtPositionTableRows = parseQueryResult(queryResult);
      // return debtPositionTableRows;
      return [queryResult];
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

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

  private async getReservesData(): Promise<Map<string, any>> {
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

    return reservesMap;
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

  private calculateDebtAmount(
    scaledVariableDebt: bigint,
    assetReserveData: any
  ): bigint {
    // Ref: https://docs.aave.com/developers/guides/rates-guide#variable-borrow-balances
    // Variable borrow balance =
    // VariableDebtToken.balanceOf(user) = VariableDebtToken.scaledBalanceOf(user) * Pool.getReserveData(underlyingTokenAddress).variableBorrowIndex
    const borrowAmountInBaseCurrency =
      (scaledVariableDebt *
        assetReserveData.variableBorrowIndex *
        assetReserveData.priceInMarketReferenceCurrency) /
      (BigInt(10 ** 27) * BigInt(10 ** Number(assetReserveData.decimals))); // borrow index uses ray decimals, see https://docs.aave.com/developers/v/2.0/glossary
    return borrowAmountInBaseCurrency;
  }
}

function calculateCollateralAmount(
  scaledATokenBalance: bigint,
  assetReserveData: any
): bigint {
  // Ref: https://docs.aave.com/developers/guides/rates-guide#supply-balances
  // Supply balance =
  // AToken.balanceOf(user) = AToken.scaledBalanceOf(user) * Pool.getReserveData(underlyingTokenAddress).liquidityIndex
  // console.log("Scaled AToken balance: ", scaledATokenBalance);

  const supplyAmount =
    (scaledATokenBalance * assetReserveData.liquidityIndex) / BigInt(10 ** 27); // Liquidity index uses ray decimals, see https://docs.aave.com/developers/v/2.0/glossary
  // console.log("Supply amount: ", supplyAmount);
  return supplyAmount;
}
