import { AlchemyProvider, Contract } from "ethers";
import {
  CompoundV3DebtPosition,
  DebtPosition,
  Market,
  MorphoBlueDebtPosition,
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount,
  UserDebtDetails
} from "../type/type";
import { Address } from "abitype";
import {
  POOL_ABI,
  POOL_ADDRESS_PROVIDER_ABI,
  UI_POOL_DATA_PROVIDER_V3_ABI
} from "../contracts/aaveV3";
import { getTokenMetadata } from "./tokenService";

interface AaveMarket extends Market {
  priceInMarketReferenceCurrency: number;
}

interface BaseCurrencyInfo {
  marketReferenceCurrencyUnit: bigint;
}

export interface APYInfo {
  borrowingAPY: number;
  lendingAPY: number;
}

export interface APYProvider {
  calculateTrailing30DaysBorrowingAndLendingAPYs(
    tokenSymbolOrATokenAddress: string | Address
  ): Promise<APYInfo>;
}

export class BaseAaveService {
  private protocol: Protocol;
  private poolAddressProvider: Address;
  private uiPoolDataProvider: Address;
  private provider: AlchemyProvider;
  private poolDataProviderContract: Contract;
  private poolAddressProviderContract: Contract;
  private apyProvider: APYProvider;

  constructor(
    protocol: Protocol,
    poolAddressProvider: Address,
    uiPoolDataProvider: Address,
    apyProvider: APYProvider
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

    this.apyProvider = apyProvider;
  }

  public async getUserDebtDetails(
    userAddress: Address
  ): Promise<UserDebtDetails> {
    const marketMap = new Map<string, Market>();
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
      const { reservesMap, baseCurrencyData } = await this.getReservesData();

      // Get user's combined account data
      const userAccountData = await this.getUserAccountData(userAddress);
      // console.log("User account data: ", userAccountData);

      const debts: TokenAmount[] = debtTokens.map((debtToken) => {
        const debtUserReserve = userReservesMap.get(debtToken.address);
        return {
          token: debtToken,
          amount: debtUserReserve.scaledVariableDebt,
          amountInUSD: calculateDebtAmountInBaseCurrency(
            debtUserReserve.scaledVariableDebt,
            reservesMap.get(debtToken.address),
            baseCurrencyData.marketReferenceCurrencyUnit
          )
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
            )
          };
        }
      );
      // Add a market for each debt & collateral token
      const underlyingAssets = new Set<Token>([
        ...debtTokens,
        ...collateralTokens
      ]);

      const marketPromises = Array.from(underlyingAssets).map(
        (underlyingAssetToken: Token) =>
          this.getAaveMarket(reservesMap, underlyingAssetToken)
      );
      (await Promise.all(marketPromises)).forEach((market) => {
        marketMap.set(market.underlyingAsset.address.toLowerCase(), market);
      });

      // Add an aggregated debt position for user with total collateral and debt
      const totalCollateralAmountInUSD = collaterals.reduce(
        (acc, curr) => acc + curr.amountInUSD,
        0
      );
      const totalDebtAmountInUSD = debts.reduce(
        (acc, curr) => acc + curr.amountInUSD,
        0
      );
      const weightedAvgLendingAPY = calculateWeightedAvgLendingAPY(
        collaterals,
        marketMap
      );
      debtPositions.push({
        maxLTV: Number(userAccountData.ltv) / 10000,
        debts: debts,
        collaterals: collaterals,
        LTV: totalDebtAmountInUSD / totalCollateralAmountInUSD,
        trailing30DaysNetAPY: calculateNetBorrowingAPY(
          collaterals,
          debts,
          marketMap
        ),
        weightedAvgTrailing30DaysLendingAPY: weightedAvgLendingAPY
      });

      // Add a debt position per debt token when user has multiple debts
      if (debtTokens.length > 1) {
        console.log(
          `User has multiple debts (${debtTokens.length}), need to create debt position for each token`
        );
        debts.forEach((debt) => {
          debtPositions.push({
            maxLTV: Number(userAccountData.ltv) / 10000,
            debts: [debt],
            collaterals: collaterals,
            LTV: debt.amountInUSD / totalCollateralAmountInUSD,
            trailing30DaysNetAPY: calculateNetBorrowingAPY(
              collaterals,
              [debt],
              marketMap
            ),
            weightedAvgTrailing30DaysLendingAPY: weightedAvgLendingAPY
          });
        });
      }
    }

    const userDebtDetails = {
      protocol: this.protocol,
      userAddress,
      markets: Array.from(marketMap.values()),
      debtPositions
    };
    // console.dir(userDebtDetails, { depth: null });
    return userDebtDetails;
  }

  public async getRecommendedDebtDetail(
    existingProtocol: Protocol,
    debtPosition:
      | DebtPosition
      | MorphoBlueDebtPosition
      | CompoundV3DebtPosition,
    maxLTVTolerance = 0.1, // 10%
    borrowingAPYTolerance = 0.03 // 3%
  ): Promise<RecommendedDebtDetail | null> {
    console.log("Generating recommendation from protocol: ", this.protocol);
    // get market reserve data
    const { reservesMap, baseCurrencyData } = await this.getReservesData();

    // get debt & collateral token based on type of debt position
    let existingDebt: TokenAmount | null;
    let existingCollateralTokens: Token[] | null;
    let existingCollateralAmountByAddress = new Map<string, TokenAmount>();
    let existingNetBorrowingApy = 0;

    switch (existingProtocol) {
      case Protocol.AaveV3:
      case Protocol.Spark:
        const convertedDebtPosition = debtPosition as DebtPosition;
        existingDebt = convertedDebtPosition.debts[0];
        existingCollateralTokens = convertedDebtPosition.collaterals.map(
          (collateral) => collateral.token
        );
        existingNetBorrowingApy = convertedDebtPosition.trailing30DaysNetAPY;
        convertedDebtPosition.collaterals.forEach((collateral) => {
          existingCollateralAmountByAddress.set(
            collateral.token.address.toLowerCase(),
            collateral
          );
        });
        break;
      case Protocol.MorphoBlue:
        const morphoBlueDebtPosition = debtPosition as MorphoBlueDebtPosition;
        existingDebt = morphoBlueDebtPosition.debt;
        existingNetBorrowingApy = morphoBlueDebtPosition.trailing30DaysNetAPY;
        existingCollateralTokens = [morphoBlueDebtPosition.collateral.token];
        existingCollateralAmountByAddress.set(
          morphoBlueDebtPosition.collateral.token.address.toLowerCase(),
          morphoBlueDebtPosition.collateral
        );
        break;
      case Protocol.CompoundV3:
        const compoundV3DebtPosition = debtPosition as CompoundV3DebtPosition;
        existingDebt = compoundV3DebtPosition.debt;
        existingCollateralTokens = compoundV3DebtPosition.collaterals.map(
          (collateral) => collateral.token
        );
        compoundV3DebtPosition.collaterals.forEach((collateral) => {
          existingCollateralAmountByAddress.set(
            collateral.token.address.toLowerCase(),
            collateral
          );
        });
        existingNetBorrowingApy = compoundV3DebtPosition.trailing30DaysNetAPY;
        break;
      default:
        throw new Error("Unsupported protocol");
    }

    const debtToken = existingDebt.token;
    const debtReserve = reservesMap.get(debtToken!.address.toLowerCase());
    // console.log("Debt reserve", debtReserve);

    if (
      !debtToken ||
      !debtReserve ||
      !debtReserve.borrowingEnabled ||
      !debtReserve.isActive
    ) {
      // console.log("There is no debt token market for position", debtPosition);
      return null;
    }

    const newDebtMarket = await this.getAaveMarket(reservesMap, debtToken!);

    let newCollateralMarkets = await this.fetchCollateralMarkets(
      existingCollateralTokens,
      reservesMap
    );

    if (!newCollateralMarkets || newCollateralMarkets.size === 0) {
      console.log("No collateral market exist for protocol: ", this.protocol);
      return null;
    }

    if (!checkBorrowingAvailability(debtReserve, existingDebt.amount)) {
      console.log("Debt market doesn't have enough liquidity to borrow");
      return null;
    }

    const newCollaterals = Array.from(newCollateralMarkets.values()).map(
      (collateralMarket: Market) => {
        const collateralToken = collateralMarket.underlyingAsset;
        return existingCollateralAmountByAddress.get(
          collateralToken.address.toLowerCase()
        )!;
      }
    );

    const { isMaxLTVAcceptable, newMaxLTV } = validateMaxLTV(
      debtPosition.maxLTV,
      newCollaterals,
      reservesMap,
      maxLTVTolerance
    );

    if (!isMaxLTVAcceptable) {
      console.log("New max LTV is not within tolerance");
      return null;
    }

    const debtAndCollateralMarkets = new Map<string, AaveMarket>(
      Array.from(newCollateralMarkets).concat([
        [debtToken.address.toLowerCase(), newDebtMarket]
      ])
    );

    const newNetBorrowingApy = calculateNetBorrowingAPY(
      newCollaterals,
      [existingDebt],
      debtAndCollateralMarkets
    );
    console.log("New net borrowing APY: ", newNetBorrowingApy);

    const borrowingApySpread = newNetBorrowingApy - existingNetBorrowingApy;

    if (borrowingApySpread < borrowingAPYTolerance) {
      console.log(
        "New net borrowing cost is not within tolerance for protocol: ",
        this.protocol
      );
      return null;
    }

    const betterBorrowingCostPercentage = borrowingAPYTolerance * 100;
    console.log(
      `New borrowing cost is at least ${betterBorrowingCostPercentage}% better than existing borrowing cost`
    );

    return {
      protocol: this.protocol,
      market: newDebtMarket,
      debt: createNewDebtPosition(
        newMaxLTV,
        existingDebt,
        newCollaterals,
        debtAndCollateralMarkets,
        baseCurrencyData
      ),
      trailing30DaysNetAPY: newNetBorrowingApy
    };
  }

  private async fetchCollateralMarkets(
    collateralTokens: Token[],
    reservesMap: Map<string, any>
  ) {
    const promises = collateralTokens
      ?.map((collateralToken) => {
        const collateralMarket = reservesMap.get(
          collateralToken.address.toLowerCase()
        );
        if (collateralMarket) {
          return this.getAaveMarket(reservesMap, collateralToken);
        } else {
          return null;
        }
      })
      .filter((marketPromise) => marketPromise !== null);
    // Resolve all promises and create a map of collateral markets
    let newCollateralMarkets = (await Promise.all(promises)).reduce(
      (acc, curr) => {
        if (curr) {
          acc.set(curr.underlyingAsset.address.toLowerCase(), curr);
        }
        return acc;
      },
      new Map<string, AaveMarket>()
    );
    return newCollateralMarkets;
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
      healthFactor: userData.healthFactor
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
          userReserveRaw.stableBorrowLastUpdateTimestamp
      });
    });

    return userReservesMap;
  }

  // Ref: https://docs.aave.com/developers/periphery-contracts/uipooldataproviderv3#aggregatedreservedata
  private async getReservesData(): Promise<{
    reservesMap: Map<string, any>;
    baseCurrencyData: BaseCurrencyInfo;
  }> {
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
        flashLoanEnabled: reserveRaw.flashLoanEnabled
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
        poolBaseCurrencyRaw.networkBaseTokenPriceDecimals
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

  private async getAaveMarket(
    reservesMap: Map<string, any>,
    underlyingAssetToken: Token
  ): Promise<AaveMarket> {
    const tokenReserve = reservesMap.get(
      underlyingAssetToken.address.toLowerCase()
    );
    const { borrowingAPY, lendingAPY } =
      await this.apyProvider.calculateTrailing30DaysBorrowingAndLendingAPYs(
        this.protocol === Protocol.AaveV3
          ? tokenReserve.aTokenAddress
          : underlyingAssetToken.symbol
      );

    return {
      underlyingAsset: underlyingAssetToken,
      trailing30DaysLendingAPY: borrowingAPY,
      trailing30DaysBorrowingAPY: lendingAPY,
      priceInMarketReferenceCurrency:
        tokenReserve.priceInMarketReferenceCurrency
    };
  }
}

function createNewDebtPosition(
  newMaxLTV: number,
  existingDebt: TokenAmount,
  newCollaterals: TokenAmount[],
  marketsMap: Map<string, AaveMarket>,
  baseCurrencyData: BaseCurrencyInfo
): DebtPosition {
  const newCollateralAmountInUsd = newCollaterals.reduce(
    (acc, curr) => acc + curr.amountInUSD,
    0
  );

  // Determine new LTV and debt amount based on new max LTV and collateral value
  let { newLTV, newDebt } = determineNewLTVAndDebtAmount(
    existingDebt,
    newCollateralAmountInUsd,
    newMaxLTV,
    marketsMap,
    baseCurrencyData
  );

  return {
    maxLTV: newMaxLTV,
    LTV: newLTV,
    debts: [newDebt],
    collaterals: newCollaterals,
    trailing30DaysNetAPY: calculateNetBorrowingAPY(
      newCollaterals,
      [newDebt],
      marketsMap
    ),
    weightedAvgTrailing30DaysLendingAPY: calculateWeightedAvgLendingAPY(
      newCollaterals,
      marketsMap
    )
  };
}

function determineNewLTVAndDebtAmount(
  existingDebt: TokenAmount,
  newCollateralAmountInUsd: number,
  newMaxLTV: number,
  marketsMap: Map<string, AaveMarket>,
  baseCurrencyData: BaseCurrencyInfo
) {
  let newLTV = existingDebt.amountInUSD / newCollateralAmountInUsd;
  let newDebt = existingDebt;

  if (newLTV > newMaxLTV) {
    // We need to make a recommendation with reduced debt based
    // on the new max LTV and collateral value
    console.log(`New LTV: ${newLTV} is higher than new max LTV: ${newMaxLTV}`);

    const newDebtAmountInUSD = newMaxLTV * newCollateralAmountInUsd;

    // console.dir(marketsMap.get(existingDebt.token.address.toLowerCase()), {
    //   depth: null
    // });

    // Calculate debt token's price in USD
    const priceInUSD = marketsMap.get(
      existingDebt.token.address.toLowerCase()
    )!.priceInMarketReferenceCurrency;

    // new debt amount in token = (newDebtAmountInUSD * 10 ** tokenDecimals) / price in USD
    const newDebtTokenAmount =
      (BigInt(Math.floor(newDebtAmountInUSD)) *
        BigInt(10 ** existingDebt.token.decimals) *
        baseCurrencyData.marketReferenceCurrencyUnit) /
      BigInt(priceInUSD);

    newDebt = {
      ...existingDebt,
      amountInUSD: newDebtAmountInUSD,
      amount: newDebtTokenAmount
    };

    // cap the new LTV to new max LTV
    newLTV = newMaxLTV;
  }
  return { newLTV, newDebt };
}

function validateMaxLTV(
  existingMaxLTV: number,
  newCollaterals: TokenAmount[],
  reservesMap: Map<string, any>,
  maxLTVTolerance: number
) {
  // Create a map of collateral amount by address
  let totalCollateralAmountInUSD = 0;
  const collateralAmountByAddress = new Map<string, TokenAmount>();
  newCollaterals.forEach((collateral) => {
    collateralAmountByAddress.set(
      collateral.token.address.toLowerCase(),
      collateral
    );
    totalCollateralAmountInUSD += collateral.amountInUSD;
  });

  // calculate weighted avg max LTV of collateral markets
  const newMaxLTV = getMaxLtv(newCollaterals, reservesMap);

  // new Max ltv should be >= current LTV - maxLTVTolerance
  const tolerableMaxLTV = existingMaxLTV - maxLTVTolerance;
  const isMaxLTVAcceptable = newMaxLTV >= tolerableMaxLTV;

  if (isMaxLTVAcceptable) {
    console.log(
      `New max LTV: ${newMaxLTV} is >= current max LTV: ${existingMaxLTV} - maxLTVTolerance: ${maxLTVTolerance}`
    );
    // calculate borrowing cost
  } else {
    console.log(
      `New max LTV: ${newMaxLTV} is not >= current max LTV: ${existingMaxLTV} - maxLTVTolerance: ${maxLTVTolerance}`
    );
  }
  return { isMaxLTVAcceptable, newMaxLTV };
}

function getMaxLtv(
  newCollaterals: TokenAmount[],
  reservesMap: Map<string, any>
): number {
  let totalMaxLtvAmountInUsd: number = 0;
  let totalCollateralAmountInUsd: number = 0;

  (newCollaterals as TokenAmount[]).map((collateral) => {
    const collateralReserve = reservesMap.get(
      collateral.token.address.toLowerCase()
    );
    const collateralFactor: number =
      Number(collateralReserve.baseLTVasCollateral) / 10000;

    const maxLtvAmountForCollateralInUSD: number =
      collateral.amountInUSD * collateralFactor;
    totalMaxLtvAmountInUsd += maxLtvAmountForCollateralInUSD;
    totalCollateralAmountInUsd += collateral.amountInUSD;
  });

  let maxLtvPercentage: number =
    totalMaxLtvAmountInUsd / totalCollateralAmountInUsd;
  return maxLtvPercentage;
}

function checkBorrowingAvailability(debtReserve: any, debtAmount: bigint) {
  const borrowCap =
    BigInt(debtReserve.borrowCap) * BigInt(10 ** Number(debtReserve.decimals));
  const availableBorrowingAmount =
    borrowCap === BigInt(0) ? debtReserve.availableLiquidity : borrowCap;

  const isAvailableForBorrowing = availableBorrowingAmount > debtAmount;
  console.log(
    `Available borrowing amount: ${availableBorrowingAmount}, debt amount: ${debtAmount}`
  );
  return isAvailableForBorrowing;
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

/**
 * Calculates net borrowing APY for a user's debt position based on total lending, borrowing costs & debt amount
 * @param collaterals
 * @param debts
 * @param marketMap
 * @returns netBorrowingAPY: (lendingInterest - borrowingInterest) / totalDebtAmount
 */
function calculateNetBorrowingAPY(
  collaterals: TokenAmount[],
  debts: TokenAmount[],
  marketMap: Map<string, Market>
): number {
  const totalLendingInterest = collaterals.reduce((acc, curr) => {
    const market = marketMap.get(curr.token.address.toLowerCase());
    return acc + curr.amountInUSD * market!.trailing30DaysLendingAPY;
  }, 0);
  // console.log("Total lending interest: ", totalLendingInterest);

  const totalBorrowingInterest = debts.reduce((acc, curr) => {
    const market = marketMap.get(curr.token.address.toLowerCase());
    return acc + curr.amountInUSD * market!.trailing30DaysBorrowingAPY;
  }, 0);
  // console.log("Total borrowing interest: ", totalBorrowingInterest);

  const totalDebtAmountInUSD = debts.reduce(
    (acc, curr) => acc + curr.amountInUSD,
    0
  );
  // console.log("Total debt amount in USD: ", totalDebtAmountInUSD);

  const netBorrowingAPY =
    (totalLendingInterest - totalBorrowingInterest) / totalDebtAmountInUSD;
  return netBorrowingAPY;
}

function calculateWeightedAvgLendingAPY(
  collaterals: TokenAmount[],
  marketMap: Map<string, Market>
): number {
  // calculate total interest earned by user's collaterals
  const totalLendingInterest = collaterals.reduce((acc, curr) => {
    const market = marketMap.get(curr.token.address.toLowerCase());
    return acc + curr.amountInUSD * market!.trailing30DaysLendingAPY;
  }, 0);

  // total collateral amount in USD
  const totalCollateralAmountInUSD = collaterals.reduce(
    (acc, curr) => acc + curr.amountInUSD,
    0
  );

  const weightedAvgLendingAPY =
    totalLendingInterest / totalCollateralAmountInUSD;
  return weightedAvgLendingAPY;
}
