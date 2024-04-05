import { AlchemyProvider, Contract } from "ethers";
import { ChainId } from "@aave/contract-helpers";
import * as markets from "@bgd-labs/aave-address-book";
import { getTokenMetadata } from "./tokenService";
import { DebtPosition, Token } from "../type/type";
import { Address } from "abitype";

const provider = new AlchemyProvider(
  ChainId.mainnet,
  process.env.ALCHEMY_API_KEY_ETH_MAINNET
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

    for (let i = 0; i < debtTokens.length; i++) {
      const debtToken = debtTokens[i];

      const debtAssetReserve = userReservesMap.get(debtToken.address);

      // TODO: Need to figure out collateral amount for multiple collateral tokens
      const collateralAssetReserve = userReservesMap.get(
        collateralTokens[0].address
      );
      console.log("User asset reserve: ", debtAssetReserve);
      console.log("User collateral reserve: ", collateralAssetReserve);
      debtPositions.push({
        collateralTokens: collateralTokens,
        debtToken,

        collateralAmount: calculateCollateralAmount(
          collateralAssetReserve.scaledATokenBalance,
          reservesMap.get(collateralTokens[0].address)
        ),
        debtAmount: calculateDebtAmount(
          debtAssetReserve.scaledVariableDebt,
          reservesMap.get(debtToken.address)
        ),
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

async function getReservesData(): Promise<Map<string, any>> {
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

  return reservesMap;
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
  console.log("Scaled AToken balance: ", scaledATokenBalance);

  const supplyAmount =
    (scaledATokenBalance * assetReserveData.liquidityIndex) / BigInt(10 ** 27); // Liquidity index uses ray decimals, see https://docs.aave.com/developers/v/2.0/glossary
  console.log("Supply amount: ", supplyAmount);
  return supplyAmount;
}

// UiPoolDataProviderV3 ABI
const UI_POOL_DATA_PROVIDER_V3_ABI = [
  {
    inputs: [
      {
        internalType: "contract IPoolAddressesProvider",
        name: "provider",
        type: "address",
      },
    ],
    name: "getReservesData",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "underlyingAsset",
            type: "address",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "symbol",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "decimals",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "baseLTVasCollateral",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "reserveLiquidationThreshold",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "reserveLiquidationBonus",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "reserveFactor",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "usageAsCollateralEnabled",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "borrowingEnabled",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "stableBorrowRateEnabled",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "isFrozen",
            type: "bool",
          },
          {
            internalType: "uint128",
            name: "liquidityIndex",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "variableBorrowIndex",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "liquidityRate",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "variableBorrowRate",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "stableBorrowRate",
            type: "uint128",
          },
          {
            internalType: "uint40",
            name: "lastUpdateTimestamp",
            type: "uint40",
          },
          {
            internalType: "address",
            name: "aTokenAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "stableDebtTokenAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "variableDebtTokenAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "interestRateStrategyAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "availableLiquidity",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalPrincipalStableDebt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "averageStableRate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "stableDebtLastUpdateTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalScaledVariableDebt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "priceInMarketReferenceCurrency",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "priceOracle",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "variableRateSlope1",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "variableRateSlope2",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "stableRateSlope1",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "stableRateSlope2",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "baseStableBorrowRate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "baseVariableBorrowRate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "optimalUsageRatio",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isPaused",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "isSiloedBorrowing",
            type: "bool",
          },
          {
            internalType: "uint128",
            name: "accruedToTreasury",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "unbacked",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "isolationModeTotalDebt",
            type: "uint128",
          },
          {
            internalType: "bool",
            name: "flashLoanEnabled",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "debtCeiling",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "debtCeilingDecimals",
            type: "uint256",
          },
          {
            internalType: "uint8",
            name: "eModeCategoryId",
            type: "uint8",
          },
          {
            internalType: "uint256",
            name: "borrowCap",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "supplyCap",
            type: "uint256",
          },
          {
            internalType: "uint16",
            name: "eModeLtv",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "eModeLiquidationThreshold",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "eModeLiquidationBonus",
            type: "uint16",
          },
          {
            internalType: "address",
            name: "eModePriceSource",
            type: "address",
          },
          {
            internalType: "string",
            name: "eModeLabel",
            type: "string",
          },
          {
            internalType: "bool",
            name: "borrowableInIsolation",
            type: "bool",
          },
        ],
        internalType: "struct IUiPoolDataProviderV3.AggregatedReserveData[]",
        name: "",
        type: "tuple[]",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "marketReferenceCurrencyUnit",
            type: "uint256",
          },
          {
            internalType: "int256",
            name: "marketReferenceCurrencyPriceInUsd",
            type: "int256",
          },
          {
            internalType: "int256",
            name: "networkBaseTokenPriceInUsd",
            type: "int256",
          },
          {
            internalType: "uint8",
            name: "networkBaseTokenPriceDecimals",
            type: "uint8",
          },
        ],
        internalType: "struct IUiPoolDataProviderV3.BaseCurrencyInfo",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IPoolAddressesProvider",
        name: "provider",
        type: "address",
      },
    ],
    name: "getReservesList",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IPoolAddressesProvider",
        name: "provider",
        type: "address",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserReservesData",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "underlyingAsset",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "scaledATokenBalance",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "usageAsCollateralEnabledOnUser",
            type: "bool",
          },
          {
            internalType: "uint256",
            name: "stableBorrowRate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "scaledVariableDebt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "principalStableDebt",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "stableBorrowLastUpdateTimestamp",
            type: "uint256",
          },
        ],
        internalType: "struct IUiPoolDataProviderV3.UserReserveData[]",
        name: "",
        type: "tuple[]",
      },
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// View contract used to fetch all reserves data (including market base currency data), and user reserves
const poolDataProviderContract = new Contract(
  markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
  UI_POOL_DATA_PROVIDER_V3_ABI,
  provider
);

const POOL_ABI = [
  {
    inputs: [
      {
        internalType: "contract IPoolAddressesProvider",
        name: "provider",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "backer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    name: "BackUnbacked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum DataTypes.InterestRateMode",
        name: "interestRateMode",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "borrowRate",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "Borrow",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "target",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "initiator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum DataTypes.InterestRateMode",
        name: "interestRateMode",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "premium",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "FlashLoan",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "totalDebt",
        type: "uint256",
      },
    ],
    name: "IsolationModeTotalDebtUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "collateralAsset",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "debtAsset",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "debtToCover",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "liquidatedCollateralAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "liquidator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "receiveAToken",
        type: "bool",
      },
    ],
    name: "LiquidationCall",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "MintUnbacked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amountMinted",
        type: "uint256",
      },
    ],
    name: "MintedToTreasury",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "RebalanceStableBorrowRate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "repayer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "useATokens",
        type: "bool",
      },
    ],
    name: "Repay",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "liquidityRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "stableBorrowRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "variableBorrowRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "liquidityIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "variableBorrowIndex",
        type: "uint256",
      },
    ],
    name: "ReserveDataUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "ReserveUsedAsCollateralDisabled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "ReserveUsedAsCollateralEnabled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "Supply",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "enum DataTypes.InterestRateMode",
        name: "interestRateMode",
        type: "uint8",
      },
    ],
    name: "SwapBorrowRateMode",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "categoryId",
        type: "uint8",
      },
    ],
    name: "UserEModeSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "reserve",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "ADDRESSES_PROVIDER",
    outputs: [
      {
        internalType: "contract IPoolAddressesProvider",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "BRIDGE_PROTOCOL_FEE",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "FLASHLOAN_PREMIUM_TOTAL",
    outputs: [
      {
        internalType: "uint128",
        name: "",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "FLASHLOAN_PREMIUM_TO_PROTOCOL",
    outputs: [
      {
        internalType: "uint128",
        name: "",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_NUMBER_RESERVES",
    outputs: [
      {
        internalType: "uint16",
        name: "",
        type: "uint16",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_STABLE_RATE_BORROW_SIZE_PERCENT",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "POOL_REVISION",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
    ],
    name: "backUnbacked",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "interestRateMode",
        type: "uint256",
      },
      {
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
    ],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "id",
        type: "uint8",
      },
      {
        components: [
          {
            internalType: "uint16",
            name: "ltv",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "liquidationThreshold",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "liquidationBonus",
            type: "uint16",
          },
          {
            internalType: "address",
            name: "priceSource",
            type: "address",
          },
          {
            internalType: "string",
            name: "label",
            type: "string",
          },
        ],
        internalType: "struct DataTypes.EModeCategory",
        name: "category",
        type: "tuple",
      },
    ],
    name: "configureEModeCategory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "dropReserve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "balanceFromBefore",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "balanceToBefore",
        type: "uint256",
      },
    ],
    name: "finalizeTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiverAddress",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "assets",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "amounts",
        type: "uint256[]",
      },
      {
        internalType: "uint256[]",
        name: "interestRateModes",
        type: "uint256[]",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "params",
        type: "bytes",
      },
      {
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "flashLoan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiverAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "params",
        type: "bytes",
      },
      {
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "flashLoanSimple",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "getConfiguration",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "data",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.ReserveConfigurationMap",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "id",
        type: "uint8",
      },
    ],
    name: "getEModeCategoryData",
    outputs: [
      {
        components: [
          {
            internalType: "uint16",
            name: "ltv",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "liquidationThreshold",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "liquidationBonus",
            type: "uint16",
          },
          {
            internalType: "address",
            name: "priceSource",
            type: "address",
          },
          {
            internalType: "string",
            name: "label",
            type: "string",
          },
        ],
        internalType: "struct DataTypes.EModeCategory",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "id",
        type: "uint16",
      },
    ],
    name: "getReserveAddressById",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "getReserveData",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "uint256",
                name: "data",
                type: "uint256",
              },
            ],
            internalType: "struct DataTypes.ReserveConfigurationMap",
            name: "configuration",
            type: "tuple",
          },
          {
            internalType: "uint128",
            name: "liquidityIndex",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "currentLiquidityRate",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "variableBorrowIndex",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "currentVariableBorrowRate",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "currentStableBorrowRate",
            type: "uint128",
          },
          {
            internalType: "uint40",
            name: "lastUpdateTimestamp",
            type: "uint40",
          },
          {
            internalType: "uint16",
            name: "id",
            type: "uint16",
          },
          {
            internalType: "address",
            name: "aTokenAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "stableDebtTokenAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "variableDebtTokenAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "interestRateStrategyAddress",
            type: "address",
          },
          {
            internalType: "uint128",
            name: "accruedToTreasury",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "unbacked",
            type: "uint128",
          },
          {
            internalType: "uint128",
            name: "isolationModeTotalDebt",
            type: "uint128",
          },
        ],
        internalType: "struct DataTypes.ReserveData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "getReserveNormalizedIncome",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "getReserveNormalizedVariableDebt",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getReservesList",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserAccountData",
    outputs: [
      {
        internalType: "uint256",
        name: "totalCollateralBase",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalDebtBase",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "availableBorrowsBase",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "currentLiquidationThreshold",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ltv",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "healthFactor",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserConfiguration",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "data",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.UserConfigurationMap",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getUserEMode",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "address",
        name: "aTokenAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "stableDebtAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "variableDebtAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "interestRateStrategyAddress",
        type: "address",
      },
    ],
    name: "initReserve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IPoolAddressesProvider",
        name: "provider",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "collateralAsset",
        type: "address",
      },
      {
        internalType: "address",
        name: "debtAsset",
        type: "address",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "debtToCover",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "receiveAToken",
        type: "bool",
      },
    ],
    name: "liquidationCall",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "assets",
        type: "address[]",
      },
    ],
    name: "mintToTreasury",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "mintUnbacked",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "rebalanceStableBorrowRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "interestRateMode",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
    ],
    name: "repay",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "interestRateMode",
        type: "uint256",
      },
    ],
    name: "repayWithATokens",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "interestRateMode",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "permitV",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "permitR",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "permitS",
        type: "bytes32",
      },
    ],
    name: "repayWithPermit",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "rescueTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
    ],
    name: "resetIsolationModeTotalDebt",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "data",
            type: "uint256",
          },
        ],
        internalType: "struct DataTypes.ReserveConfigurationMap",
        name: "configuration",
        type: "tuple",
      },
    ],
    name: "setConfiguration",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "address",
        name: "rateStrategyAddress",
        type: "address",
      },
    ],
    name: "setReserveInterestRateStrategyAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "categoryId",
        type: "uint8",
      },
    ],
    name: "setUserEMode",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "bool",
        name: "useAsCollateral",
        type: "bool",
      },
    ],
    name: "setUserUseReserveAsCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onBehalfOf",
        type: "address",
      },
      {
        internalType: "uint16",
        name: "referralCode",
        type: "uint16",
      },
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "permitV",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "permitR",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "permitS",
        type: "bytes32",
      },
    ],
    name: "supplyWithPermit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "interestRateMode",
        type: "uint256",
      },
    ],
    name: "swapBorrowRateMode",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "protocolFee",
        type: "uint256",
      },
    ],
    name: "updateBridgeProtocolFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint128",
        name: "flashLoanPremiumTotal",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "flashLoanPremiumToProtocol",
        type: "uint128",
      },
    ],
    name: "updateFlashloanPremiums",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "asset",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
    ],
    name: "withdraw",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const poolContract = new Contract(
  "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  POOL_ABI,
  provider
);
