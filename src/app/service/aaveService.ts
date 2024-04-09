import { AlchemyProvider, Contract } from "ethers";
import { ChainId, UiPoolDataProvider } from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import { getTokenMetadata } from "./tokenService";
import { DebtPosition, Token } from "../type/type";
import { Address } from "abitype";
import {
  POOL_ABI,
  POOL_ADDRESS_PROVIDER_ABI,
  UI_POOL_DATA_PROVIDER_V3_ABI,
} from "./aaveAbi";
import { request, gql } from "graphql-request";
import { MESSARI_GRAPHQL_URL } from "../constants";

const provider = new AlchemyProvider(
  ChainId.mainnet,
  process.env.ALCHEMY_API_KEY_ETH_MAINNET
);

// View contract used to fetch all reserves data (including market base currency data), and user reserves
const poolDataProviderContract = new Contract(
  markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
  UI_POOL_DATA_PROVIDER_V3_ABI,
  provider
);

const poolAddressProviderContract = new Contract(
  markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  POOL_ADDRESS_PROVIDER_ABI,
  provider
);

export async function getUserDebtPositions(userAddress: Address) {
  // console.log("Alchemy URL: ", ALCHEMY_RPC_URL);
  // console.log("Current block number: ", await provider.getBlockNumber());
  const debtPositions: DebtPosition[] = [];
  const [userReservesRaw] = await poolDataProviderContract.getUserReservesData(
    markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
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
          r.usageAsCollateralEnabledOnUser === true && r.scaledATokenBalance > 0
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
    const reservesMap = await getReservesData();

    // Get user's combined account data
    const userAccountData = await getUserAccountData(userAddress);
    // console.log("User account data: ", userAccountData);

    // TODO: how do we get specific debt amount when user has multiple debt tokens?
    for (let i = 0; i < debtTokens.length; i++) {
      const debtToken = debtTokens[i];
      const debtAssetReserve = userReservesMap.get(debtToken.address);

      // TODO: Need to figure out collateral amount for multiple collateral tokens
      // const collateralAssetReserve = userReservesMap.get(
      //   collateralTokens[0].address
      // );
      // console.log("User debt asset reserve: ", debtAssetReserve);
      // console.log("User collateral reserve: ", collateralAssetReserve);
      // console.log(
      //   "Collateral Reserve data: ",
      //   reservesMap.get(collateralTokens[0].address)
      // );
      // console.log("Debt Reserve data: ", reservesMap.get(debtToken.address));

      debtPositions.push({
        collateralTokens: collateralTokens,
        debtToken,
        collateralAmount: userAccountData.totalCollateralBase,
        debtAmount: userAccountData.totalDebtBase,
        LTV: 0,
      });
    }
  }

  // console.log(
  //   "Pool User Data: ",
  //   await poolContract.getUserAccountData(userAddress)
  // );

  return debtPositions;
}

export async function getReservesData(): Promise<Map<string, any>> {
  const lendingPoolAddressProvider =
    markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER;
  const { 0: reservesRaw, 1: poolBaseCurrencyRaw } =
    await poolDataProviderContract.getReservesData(lendingPoolAddressProvider);

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
      priceInMarketReferenceCurrency: reserveRaw.priceInMarketReferenceCurrency,
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

export async function getUserAccountData(userAddress: Address) {
  const poolAddress = await poolAddressProviderContract.getPool();
  // console.log("Pool address: ", poolAddress);
  const poolContract = new Contract(poolAddress, POOL_ABI, provider);
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

export async function getInterestRates(marketAddress: Address): Promise<any[]> {
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

function calculateDebtAmount(
  scaledVariableDebt: bigint,
  assetReserveData: any
): bigint {
  let borrowAmount: bigint = BigInt(0);
  // Ref: https://docs.aave.com/developers/guides/rates-guide#variable-borrow-balances
  // Variable borrow balance =
  // VariableDebtToken.balanceOf(user) = VariableDebtToken.scaledBalanceOf(user) * Pool.getReserveData(underlyingTokenAddress).variableBorrowIndex
  borrowAmount =
    (scaledVariableDebt * assetReserveData.variableBorrowIndex) /
    BigInt(10 ** 27); // borrow index uses ray decimals, see https://docs.aave.com/developers/v/2.0/glossary
  return borrowAmount;
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
