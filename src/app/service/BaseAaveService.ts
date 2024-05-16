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
import {
  calculateDebtAmountInBaseCurrency,
  calculateCollateralAmountInBaseCurrency,
  calculateWeightedAvgLendingAPY,
  calculateWeightedAvgLendingRewardAPY,
  calculateNetBorrowingAPY,
  checkBorrowingAvailability,
  validateMaxLTV,
  createNewDebtPosition,
  createToken,
  calculateMaxLtv,
  calculateTokenAmount,
  calculateAmountInBaseCurrency
} from "./baseAaveServiceHelper";
import { get30DayTrailingAPYInfo } from "./defiLlamaDataService";

export interface AaveMarket extends Market {
  priceInMarketReferenceCurrency: number;
}

export interface BaseCurrencyInfo {
  marketReferenceCurrencyUnit: bigint;
}

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

  /**
   * Provides the existing debt positions and other details for a given user address
   * @param userAddress
   * @returns
   */
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
      (await Promise.all(marketPromises))
        .filter((market) => market !== null)
        .forEach((market) => {
          marketMap.set(market!.underlyingAsset.address.toLowerCase(), market!);
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
      const weightedAvgLendingRewardAPY = calculateWeightedAvgLendingRewardAPY(
        collaterals,
        marketMap
      );

      debtPositions.push({
        maxLTV: Number(userAccountData.ltv) / 10000,
        debts: debts,
        collaterals: collaterals,
        LTV: totalDebtAmountInUSD / totalCollateralAmountInUSD,
        trailing30DaysNetBorrowingAPY: calculateNetBorrowingAPY(
          collaterals,
          debts,
          marketMap
        ),
        weightedAvgTrailing30DaysLendingAPY: weightedAvgLendingAPY,
        weightedAvgTrailing30DaysLendingRewardAPY: weightedAvgLendingRewardAPY
      });

      // Add a debt position per debt token when user has multiple debts
      if (debtTokens.length > 1) {
        // console.log(
        //   `User has multiple debts (${debtTokens.length}), need to create debt position for each token`
        // );
        debts.forEach((debt) => {
          debtPositions.push({
            maxLTV: Number(userAccountData.ltv) / 10000,
            debts: [debt],
            collaterals: collaterals,
            LTV: debt.amountInUSD / totalCollateralAmountInUSD,
            trailing30DaysNetBorrowingAPY: calculateNetBorrowingAPY(
              collaterals,
              [debt],
              marketMap
            ),
            weightedAvgTrailing30DaysLendingAPY: weightedAvgLendingAPY,
            weightedAvgTrailing30DaysLendingRewardAPY:
              weightedAvgLendingRewardAPY
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

  /**
   * Provides recommended debt details for a given debt position in existing protocol
   * @param existingProtocol
   * @param debtPosition
   * @param maxLTVTolerance
   * @param borrowingAPYTolerance
   * @returns
   */
  public async getRecommendedDebtDetail(
    existingProtocol: Protocol,
    debtPosition:
      | DebtPosition
      | MorphoBlueDebtPosition
      | CompoundV3DebtPosition,
    maxLTVTolerance = 0.1, // 10%
    borrowingAPYTolerance = 0.03 // 3%
  ): Promise<RecommendedDebtDetail | null> {
    // console.log("Generating recommendation from protocol: ", this.protocol);
    // get market reserve data
    const { reservesMap, baseCurrencyData } = await this.getReservesData();

    // get existing debt & collateral details based on given debt position
    const {
      existingDebtAmount,
      existingCollateralAmountByToken,
      existingNetBorrowingApy
    } = getExistingDebtAndCollateralInfo(existingProtocol, debtPosition);

    const debtToken = existingDebtAmount.token;
    const debtReserve = reservesMap.get(debtToken!.address.toLowerCase());
    // console.log("Debt reserve", debtReserve);

    if (!isReserveBorrowingEnabled(debtReserve)) {
      // console.log("There is no debt token market for position", debtPosition);
      return null;
    }

    const newDebtMarket = (await this.getAaveMarket(reservesMap, debtToken!))!;

    let newCollateralMarkets = await this.fetchCollateralMarkets(
      Array.from(existingCollateralAmountByToken.keys()),
      reservesMap
    );

    if (!newCollateralMarkets || newCollateralMarkets.size === 0) {
      // console.log("No collateral market exist for protocol: ", this.protocol);
      return null;
    }

    if (!checkBorrowingAvailability(debtReserve, existingDebtAmount.amount)) {
      // console.log("Debt market doesn't have enough liquidity to borrow");
      return null;
    }

    const newCollaterals = Array.from(newCollateralMarkets.values()).map(
      (collateralMarket: Market) => {
        const collateralToken = collateralMarket.underlyingAsset;
        return existingCollateralAmountByToken.get(collateralToken)!;
      }
    );

    const { isMaxLTVAcceptable, newMaxLTV } = validateMaxLTV(
      debtPosition.maxLTV,
      newCollaterals,
      reservesMap,
      maxLTVTolerance
    );

    if (!isMaxLTVAcceptable) {
      // console.log("New max LTV is not within tolerance");
      return null;
    }

    const debtAndCollateralMarkets = new Map<string, AaveMarket>(
      Array.from(newCollateralMarkets).concat([
        [debtToken.address.toLowerCase(), newDebtMarket]
      ])
    );

    const newNetBorrowingApy = calculateNetBorrowingAPY(
      newCollaterals,
      [existingDebtAmount],
      debtAndCollateralMarkets
    );
    // console.log("New net borrowing APY: ", newNetBorrowingApy);

    const borrowingApySpread = newNetBorrowingApy - existingNetBorrowingApy;

    if (borrowingApySpread < borrowingAPYTolerance) {
      // console.log(
      //   "New net borrowing cost is not within tolerance for protocol: ",
      //   this.protocol
      // );
      return null;
    }

    const betterBorrowingCostPercentage = borrowingAPYTolerance * 100;
    // console.log(
    //   `New borrowing cost is at least ${betterBorrowingCostPercentage}% better than existing borrowing cost`
    // );

    return {
      protocol: this.protocol,
      market: newDebtMarket,
      debt: createNewDebtPosition(
        newMaxLTV,
        existingDebtAmount,
        newCollaterals,
        debtAndCollateralMarkets,
        baseCurrencyData
      )
    };
  }

  /**
   * Provides all debt tokens supported by protocol
   * @returns debt tokens
   */
  public async getSupportedDebtTokens(): Promise<Token[]> {
    // Fetch all reserves data and filter out tokens where borrowing is enabled
    return this.getReservesData().then(({ reservesMap }) => {
      return Array.from(reservesMap.values())
        .filter((reserve) => isReserveBorrowingEnabled(reserve))
        .map(createToken);
    });
  }

  /**
   * Provides all collateral tokens supported by protocol
   * @returns collateral tokens
   */
  public async getSupportedCollateralTokens(): Promise<Token[]> {
    // Fetch all reserves data and filter out tokens where collateral is enabled
    return this.getReservesData().then(({ reservesMap }) => {
      return Array.from(reservesMap.values())
        .filter((reserve) => canReserveBeCollateral(reserve))
        .map(createToken);
    });
  }

  /**
   * Get all borrow recommendations based on given debt and collateral tokens
   * @param debtTokens
   * @param collaterals
   * @returns
   */
  public async getBorrowRecommendations(
    debtTokens: Token[],
    collaterals: TokenAmount[]
  ): Promise<RecommendedDebtDetail[]> {
    const start = Date.now();

    // get market reserve data
    const { reservesMap, baseCurrencyData } = await this.getReservesData();
    console.log(
      `Time taken to get reserves data for protocol: ${this.protocol}: ${
        Date.now() - start
      } ms`
    );

    const recommendations: RecommendedDebtDetail[] = [];

    const start1 = Date.now();
    const collateralMarkets = await this.fetchCollateralMarkets(
      collaterals.map((collateral) => collateral.token),
      reservesMap
    );
    console.log(
      `Time taken to fetch collateral markets for protocol: ${this.protocol}: ${
        Date.now() - start1
      } ms`
    );

    if (!collateralMarkets || collateralMarkets.size === 0) {
      // console.log("No matching debt or collateral market exist for protocol: ", this.protocol);
      return recommendations;
    }

    // Filter out collateral markets where borrowing is not enabled
    const supportedCollaterals = collaterals.filter((collateral) => {
      const collateralMarket = collateralMarkets.get(
        collateral.token.address.toLowerCase()
      );
      return collateralMarket;
    });

    // Calculate total collateral amount in USD
    const totalCollateralAmountInUSD = supportedCollaterals.reduce(
      (total, collateral) => {
        const amountInUSD = calculateAmountInBaseCurrency(
          collateral.amount,
          reservesMap.get(collateral.token.address.toLowerCase()),
          baseCurrencyData.marketReferenceCurrencyUnit
        );

        // Update collateral amount in USD as caller doesn't have this info
        collateral.amountInUSD = amountInUSD;
        return total + amountInUSD;
      },
      0
    );

    // Calculate recommended debt amount using max LTV
    const maxLTV = calculateMaxLtv(supportedCollaterals, reservesMap);
    const debtAmountInUSD = maxLTV * totalCollateralAmountInUSD;

    // create a recommended position for each debt token
    for (let i = 0; i < debtTokens.length; i++) {
      const debtToken = debtTokens[i];
      const debtReserve = reservesMap.get(debtToken!.address.toLowerCase());
      // console.log("Debt reserve", debtReserve);

      if (!isReserveBorrowingEnabled(debtReserve)) {
        // console.log("There is no debt token market for token", debtToken);
        continue;
      }

      const debtMarket = await this.getAaveMarket(reservesMap, debtToken);
      if (!debtMarket) {
        continue;
      }

      const recommendedDebt = {
        token: debtToken,
        amount: calculateTokenAmount(
          debtAmountInUSD,
          debtReserve,
          baseCurrencyData.marketReferenceCurrencyUnit
        ),
        amountInUSD: debtAmountInUSD
      };

      if (!checkBorrowingAvailability(debtReserve, recommendedDebt.amount)) {
        // console.log("Debt market doesn't have enough liquidity to borrow");
        continue;
      }

      const debtAndCollateralMarkets = new Map<string, AaveMarket>(
        Array.from(collateralMarkets).concat([
          [debtToken.address.toLowerCase(), debtMarket]
        ])
      );

      recommendations.push({
        protocol: this.protocol,
        market: debtMarket,
        debt: createNewDebtPosition(
          maxLTV,
          recommendedDebt,
          supportedCollaterals,
          debtAndCollateralMarkets,
          baseCurrencyData
        )
      });
    }

    return recommendations;
  }

  private async fetchCollateralMarkets(
    collateralTokens: Token[],
    reservesMap: Map<string, any>
  ) {
    const promises = collateralTokens
      ?.map((collateralToken) => {
        const collateralReserve = reservesMap.get(
          collateralToken.address.toLowerCase()
        );
        if (canReserveBeCollateral(collateralReserve)) {
          return this.getAaveMarket(reservesMap, collateralToken);
        } else {
          return null;
        }
      })
      .filter((marketPromise) => marketPromise !== null);
    // Resolve all promises and create a map of collateral markets
    let newCollateralMarkets = (await Promise.all(promises))
      .filter((market) => market !== null)
      .reduce((map, market) => {
        if (market) {
          map.set(market.underlyingAsset.address.toLowerCase(), market);
        }
        return map;
      }, new Map<string, AaveMarket>());
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
  ): Promise<AaveMarket | null> {
    const tokenReserve = reservesMap.get(
      underlyingAssetToken.address.toLowerCase()
    );
    if (
      !tokenReserve ||
      (!isReserveBorrowingEnabled(tokenReserve) &&
        !canReserveBeCollateral(tokenReserve))
    ) {
      // console.log("No AAVE v3 market found for token: ",underlyingAssetToken.symbol);
      return null;
    }

    return get30DayTrailingAPYInfo(
      this.protocol,
      underlyingAssetToken.symbol
    ).then((apyInfo) => {
      return {
        underlyingAsset: underlyingAssetToken,
        trailing30DaysLendingAPY: apyInfo.borrowingAPY,
        trailing30DaysBorrowingAPY: apyInfo.lendingAPY,
        trailing30DaysLendingRewardAPY: apyInfo.lendingRewardAPY,
        trailing30DaysBorrowingRewardAPY: apyInfo.borrowingRewardAPY,
        priceInMarketReferenceCurrency:
          tokenReserve.priceInMarketReferenceCurrency
      };
    });
  }
}

function canReserveBeCollateral(reserve: any): unknown {
  return (
    isReserveActive(reserve) &&
    !reserve.isPaused &&
    reserve.usageAsCollateralEnabled &&
    reserve.baseLTVasCollateral > 0
  );
}

function isReserveBorrowingEnabled(reserve: any): unknown {
  return isReserveActive(reserve) && reserve.borrowingEnabled;
}

function isReserveActive(reserve: any) {
  return reserve && reserve.isActive && !reserve.isPaused;
}

function getExistingDebtAndCollateralInfo(
  existingProtocol: Protocol,
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition
) {
  let existingDebtAmount: TokenAmount;
  let existingCollateralAmountByToken = new Map<Token, TokenAmount>();
  let existingNetBorrowingApy = 0;

  switch (existingProtocol) {
    case Protocol.AaveV3:
    case Protocol.Spark:
      const convertedDebtPosition = debtPosition as DebtPosition;
      existingDebtAmount = convertedDebtPosition.debts[0];
      existingNetBorrowingApy =
        convertedDebtPosition.trailing30DaysNetBorrowingAPY;
      convertedDebtPosition.collaterals.forEach((collateral) => {
        existingCollateralAmountByToken.set(collateral.token, collateral);
      });
      break;
    case Protocol.MorphoBlue:
      const morphoBlueDebtPosition = debtPosition as MorphoBlueDebtPosition;
      existingDebtAmount = morphoBlueDebtPosition.debt;
      existingNetBorrowingApy =
        morphoBlueDebtPosition.trailing30DaysNetBorrowingAPY;
      existingCollateralAmountByToken.set(
        morphoBlueDebtPosition.collateral.token,
        morphoBlueDebtPosition.collateral
      );
      break;
    case Protocol.CompoundV3:
      const compoundV3DebtPosition = debtPosition as CompoundV3DebtPosition;
      existingDebtAmount = compoundV3DebtPosition.debt;
      compoundV3DebtPosition.collaterals.forEach((collateral) => {
        existingCollateralAmountByToken.set(collateral.token, collateral);
      });
      existingNetBorrowingApy =
        compoundV3DebtPosition.trailing30DaysNetBorrowingAPY;
      break;
    default:
      throw new Error("Unsupported protocol");
  }
  return {
    existingDebtAmount,
    existingCollateralAmountByToken,
    existingNetBorrowingApy
  };
}
