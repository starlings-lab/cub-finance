import { AlchemyProvider, Contract } from "ethers";
import {
  CompoundV3DebtPosition,
  DebtPosition,
  Market,
  MorphoBlueDebtPosition,
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";
import { Address } from "abitype";
import {
  POOL_ABI,
  POOL_ADDRESS_PROVIDER_ABI,
  UI_POOL_DATA_PROVIDER_V3_ABI
} from "../contracts/aaveV3";
import {
  checkBorrowingAvailability,
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
    // get market reserve data
    const { reservesMap, baseCurrencyData } = await this.getReservesData();

    const recommendations: RecommendedDebtDetail[] = [];

    const collateralMarkets = await this.fetchCollateralMarkets(
      collaterals.map((collateral) => collateral.token),
      reservesMap
    );

    if (!collateralMarkets || collateralMarkets.size === 0) {
      // console.log("No matching debt or collateral market exist for protocol: ", this.protocol);
      return recommendations;
    }

    // Filter out collateral markets where borrowing is not enabled
    const supportedCollateralMap = collaterals
      .filter((collateral) =>
        collateralMarkets.has(collateral.token.address.toLowerCase())
      )
      .reduce((map, collateral) => {
        map.set(collateral.token.address.toLowerCase(), collateral);
        return map;
      }, new Map<string, TokenAmount>());
    const supportedCollaterals = Array.from(supportedCollateralMap.values());

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

      // filter out debt tokens when it's same as single collateral token
      if (
        supportedCollateralMap.has(debtToken.address.toLowerCase()) &&
        supportedCollaterals.length === 1
      ) {
        // console.log(
        //   `Debt token is same as collateral token, skipping: ${debtToken.symbol} for protocol: ${this.protocol}`
        // );
        continue;
      }

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
