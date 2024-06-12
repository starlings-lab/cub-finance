import { Address } from "abitype";
import { ethers, Contract } from "ethers";
import {
  ALCHEMY_API_URL_ARB_MAINNET,
  ALCHEMY_API_URL_ETH_MAINNET
} from "../constants";
import { Chain, Token } from "../type/type";
import {
  COMP,
  WBTC,
  WETH,
  USDC,
  UNI,
  LINK,
  cbETH,
  wstETH,
  rETH,
  WBTC_ARB,
  WETH_ARB,
  ARB,
  GMX_ARB,
  USDC_ARB,
  USDC_BRIDGED_ARB
} from "./ERC20Tokens";

export const COMPOUND_V3_CUSDC_ADDRESS_ETH_MAINNET = `0x${"c3d688B66703497DAA19211EEdff47f25384cdc3"}`;
export const COMPOUND_V3_CWETH_ADDRESS_ETH_MAINNET = `0x${"A17581A9E3356d9A858b789D68B4d866e593aE94"}`;

export const COMPOUND_V3_CUSDC_COLLATERALS_ETH_MAINNET: Token[] = [
  COMP,
  WBTC,
  WETH,
  UNI,
  LINK
];
export const COMPOUND_V3_CWETH_COLLATERALS_ETH_MAINNET: Token[] = [
  cbETH,
  wstETH,
  rETH
];

export const COMPOUND_V3_COLLATERALS_ETH_MAINNET: Token[] = [
  ...COMPOUND_V3_CUSDC_COLLATERALS_ETH_MAINNET,
  ...COMPOUND_V3_CWETH_COLLATERALS_ETH_MAINNET
];

export const COMPOUND_V3_DEBTS_ETH_MAINNET: Token[] = [USDC, WETH];

export const COMPOUND_V3_PRICEFEEDS_ETH_MAINNET = {
  USDC: `0x${"8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6"}` as Address,
  ETH: `0x${"5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"}` as Address,
  COMP: `0x${"dbd020CAeF83eFd542f4De03e3cF0C28A4428bd5"}` as Address,
  WBTC: `0x${"F4030086522a5bEEa4988F8cA5B36dbC97BeE88c"}` as Address,
  UNI: `0x${"553303d460EE0afB37EdFf9bE42922D8FF63220e"}` as Address,
  LINK: `0x${"2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c"}` as Address,
  // Following price feeds returns price in ETH, e.g. 1 wstETH = 1.1 ETH
  WETH: `0x${"D72ac1bCE9177CFe7aEb5d0516a38c88a64cE0AB"}` as Address,
  CBETH: `0x${"23a982b74a3236A5F2297856d4391B2edBBB5549"}` as Address,
  WSTETH: `0x${"4F67e4d9BD67eFa28236013288737D39AeF48e79"}` as Address,
  RETH: `0x${"A3A7fB5963D1d69B95EEC4957f77678EF073Ba08"}` as Address
};

export const COMPOUND_V3_ABI: object[] = [
  { inputs: [], name: "Absurd", type: "error" },
  { inputs: [], name: "AlreadyInitialized", type: "error" },
  { inputs: [], name: "BadAmount", type: "error" },
  { inputs: [], name: "BadAsset", type: "error" },
  { inputs: [], name: "BadDecimals", type: "error" },
  { inputs: [], name: "BadDiscount", type: "error" },
  { inputs: [], name: "BadMinimum", type: "error" },
  { inputs: [], name: "BadNonce", type: "error" },
  { inputs: [], name: "BadPrice", type: "error" },
  { inputs: [], name: "BadSignatory", type: "error" },
  { inputs: [], name: "BorrowCFTooLarge", type: "error" },
  { inputs: [], name: "BorrowTooSmall", type: "error" },
  { inputs: [], name: "InsufficientReserves", type: "error" },
  { inputs: [], name: "InvalidInt104", type: "error" },
  { inputs: [], name: "InvalidInt256", type: "error" },
  { inputs: [], name: "InvalidUInt104", type: "error" },
  { inputs: [], name: "InvalidUInt128", type: "error" },
  { inputs: [], name: "InvalidUInt64", type: "error" },
  { inputs: [], name: "InvalidValueS", type: "error" },
  { inputs: [], name: "InvalidValueV", type: "error" },
  { inputs: [], name: "LiquidateCFTooLarge", type: "error" },
  { inputs: [], name: "NegativeNumber", type: "error" },
  { inputs: [], name: "NoSelfTransfer", type: "error" },
  { inputs: [], name: "NotCollateralized", type: "error" },
  { inputs: [], name: "NotForSale", type: "error" },
  { inputs: [], name: "NotLiquidatable", type: "error" },
  { inputs: [], name: "Paused", type: "error" },
  { inputs: [], name: "SignatureExpired", type: "error" },
  { inputs: [], name: "SupplyCapExceeded", type: "error" },
  { inputs: [], name: "TimestampTooLarge", type: "error" },
  { inputs: [], name: "TooManyAssets", type: "error" },
  { inputs: [], name: "TooMuchSlippage", type: "error" },
  { inputs: [], name: "TransferInFailed", type: "error" },
  { inputs: [], name: "TransferOutFailed", type: "error" },
  { inputs: [], name: "Unauthorized", type: "error" },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "absorber",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "borrower",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "collateralAbsorbed",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "usdValue",
        type: "uint256"
      }
    ],
    name: "AbsorbCollateral",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "absorber",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "borrower",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "basePaidOut",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "usdValue",
        type: "uint256"
      }
    ],
    name: "AbsorbDebt",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Approval",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "buyer",
        type: "address"
      },
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "baseAmount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "collateralAmount",
        type: "uint256"
      }
    ],
    name: "BuyCollateral",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bool",
        name: "supplyPaused",
        type: "bool"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "transferPaused",
        type: "bool"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "withdrawPaused",
        type: "bool"
      },
      {
        indexed: false,
        internalType: "bool",
        name: "absorbPaused",
        type: "bool"
      },
      { indexed: false, internalType: "bool", name: "buyPaused", type: "bool" }
    ],
    name: "PauseAction",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "dst", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Supply",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "dst", type: "address" },
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "SupplyCollateral",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Transfer",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "TransferCollateral",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "src", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Withdraw",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "src", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: true,
        internalType: "address",
        name: "asset",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "WithdrawCollateral",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "WithdrawReserves",
    type: "event"
  },
  {
    inputs: [
      { internalType: "address", name: "absorber", type: "address" },
      { internalType: "address[]", name: "accounts", type: "address[]" }
    ],
    name: "absorb",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "accrueAccount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "manager", type: "address" },
      { internalType: "bool", name: "isAllowed", type: "bool" }
    ],
    name: "allow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "manager", type: "address" },
      { internalType: "bool", name: "isAllowed", type: "bool" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "expiry", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" }
    ],
    name: "allowBySig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "manager", type: "address" },
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approveThis",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseAccrualScale",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseBorrowMin",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseIndexScale",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseMinForRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseScale",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseTokenPriceFeed",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "baseTrackingAccrued",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseTrackingBorrowSpeed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "baseTrackingSupplySpeed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "borrowBalanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "borrowKink",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "borrowPerSecondInterestRateBase",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "borrowPerSecondInterestRateSlopeHigh",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "borrowPerSecondInterestRateSlopeLow",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "minAmount", type: "uint256" },
      { internalType: "uint256", name: "baseAmount", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" }
    ],
    name: "buyCollateral",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "address", name: "asset", type: "address" }
    ],
    name: "collateralBalanceOf",
    outputs: [{ internalType: "uint128", name: "", type: "uint128" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "extensionDelegate",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "factorScale",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint8", name: "i", type: "uint8" }],
    name: "getAssetInfo",
    outputs: [
      {
        components: [
          { internalType: "uint8", name: "offset", type: "uint8" },
          { internalType: "address", name: "asset", type: "address" },
          { internalType: "address", name: "priceFeed", type: "address" },
          { internalType: "uint64", name: "scale", type: "uint64" },
          {
            internalType: "uint64",
            name: "borrowCollateralFactor",
            type: "uint64"
          },
          {
            internalType: "uint64",
            name: "liquidateCollateralFactor",
            type: "uint64"
          },
          { internalType: "uint64", name: "liquidationFactor", type: "uint64" },
          { internalType: "uint128", name: "supplyCap", type: "uint128" }
        ],
        internalType: "struct CometCore.AssetInfo",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "asset", type: "address" }],
    name: "getAssetInfoByAddress",
    outputs: [
      {
        components: [
          { internalType: "uint8", name: "offset", type: "uint8" },
          { internalType: "address", name: "asset", type: "address" },
          { internalType: "address", name: "priceFeed", type: "address" },
          { internalType: "uint64", name: "scale", type: "uint64" },
          {
            internalType: "uint64",
            name: "borrowCollateralFactor",
            type: "uint64"
          },
          {
            internalType: "uint64",
            name: "liquidateCollateralFactor",
            type: "uint64"
          },
          { internalType: "uint64", name: "liquidationFactor", type: "uint64" },
          { internalType: "uint128", name: "supplyCap", type: "uint128" }
        ],
        internalType: "struct CometCore.AssetInfo",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "utilization", type: "uint256" }],
    name: "getBorrowRate",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "asset", type: "address" }],
    name: "getCollateralReserves",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "priceFeed", type: "address" }],
    name: "getPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getReserves",
    outputs: [{ internalType: "int256", name: "", type: "int256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "utilization", type: "uint256" }],
    name: "getSupplyRate",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getUtilization",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "governor",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "manager", type: "address" }
    ],
    name: "hasPermission",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "initializeStorage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "isAbsorbPaused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "isAllowed",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "isBorrowCollateralized",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isBuyPaused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "isLiquidatable",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isSupplyPaused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isTransferPaused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isWithdrawPaused",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "liquidatorPoints",
    outputs: [
      { internalType: "uint32", name: "numAbsorbs", type: "uint32" },
      { internalType: "uint64", name: "numAbsorbed", type: "uint64" },
      { internalType: "uint128", name: "approxSpend", type: "uint128" },
      { internalType: "uint32", name: "_reserved", type: "uint32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "maxAssets",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "numAssets",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "bool", name: "supplyPaused", type: "bool" },
      { internalType: "bool", name: "transferPaused", type: "bool" },
      { internalType: "bool", name: "withdrawPaused", type: "bool" },
      { internalType: "bool", name: "absorbPaused", type: "bool" },
      { internalType: "bool", name: "buyPaused", type: "bool" }
    ],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "pauseGuardian",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "priceScale",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "baseAmount", type: "uint256" }
    ],
    name: "quoteCollateral",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "storeFrontPriceFactor",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "dst", type: "address" },
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "supplyFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "supplyKink",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "supplyPerSecondInterestRateBase",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "supplyPerSecondInterestRateSlopeHigh",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "supplyPerSecondInterestRateSlopeLow",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "dst", type: "address" },
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "supplyTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "targetReserves",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalBorrow",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalsBasic",
    outputs: [
      {
        components: [
          { internalType: "uint64", name: "baseSupplyIndex", type: "uint64" },
          { internalType: "uint64", name: "baseBorrowIndex", type: "uint64" },
          {
            internalType: "uint64",
            name: "trackingSupplyIndex",
            type: "uint64"
          },
          {
            internalType: "uint64",
            name: "trackingBorrowIndex",
            type: "uint64"
          },
          { internalType: "uint104", name: "totalSupplyBase", type: "uint104" },
          { internalType: "uint104", name: "totalBorrowBase", type: "uint104" },
          { internalType: "uint40", name: "lastAccrualTime", type: "uint40" },
          { internalType: "uint8", name: "pauseFlags", type: "uint8" }
        ],
        internalType: "struct CometStorage.TotalsBasic",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "totalsCollateral",
    outputs: [
      { internalType: "uint128", name: "totalSupplyAsset", type: "uint128" },
      { internalType: "uint128", name: "_reserved", type: "uint128" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "trackingIndexScale",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "dst", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "dst", type: "address" },
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "transferAsset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "src", type: "address" },
      { internalType: "address", name: "dst", type: "address" },
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "transferAssetFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "src", type: "address" },
      { internalType: "address", name: "dst", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "userBasic",
    outputs: [
      { internalType: "int104", name: "principal", type: "int104" },
      { internalType: "uint64", name: "baseTrackingIndex", type: "uint64" },
      { internalType: "uint64", name: "baseTrackingAccrued", type: "uint64" },
      { internalType: "uint16", name: "assetsIn", type: "uint16" },
      { internalType: "uint8", name: "_reserved", type: "uint8" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "address", name: "", type: "address" }
    ],
    name: "userCollateral",
    outputs: [
      { internalType: "uint128", name: "balance", type: "uint128" },
      { internalType: "uint128", name: "_reserved", type: "uint128" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "userNonce",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "version",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "src", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdrawFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdrawReserves",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "address", name: "asset", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "withdrawTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

const PROVIDER_ETH_MAINNET = new ethers.JsonRpcProvider(
  ALCHEMY_API_URL_ETH_MAINNET
);

export const COMPOUND_V3_CUSDC_CONTRACT = new Contract(
  COMPOUND_V3_CUSDC_ADDRESS_ETH_MAINNET,
  COMPOUND_V3_ABI,
  PROVIDER_ETH_MAINNET
);

export const COMPOUND_V3_CWETH_CONTRACT = new Contract(
  COMPOUND_V3_CWETH_ADDRESS_ETH_MAINNET,
  COMPOUND_V3_ABI,
  PROVIDER_ETH_MAINNET
);

// USDC.e (Bridged): https://arbiscan.io/address/0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA
// https://app.compound.finance/markets/usdc.e-arb
export const COMPOUND_V3_CUSDC_BRIDGED_ADDRESS_ARB_MAINNET =
  "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA" as Address;
export const COMPOUND_V3_CUSDC_BRIDGED_COLLATERALS_ARB_MAINNET: Token[] = [
  WBTC_ARB,
  WETH_ARB,
  ARB,
  GMX_ARB
];

// USDC (Native): https://arbiscan.io/address/0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf
// https://app.compound.finance/markets/usdc-arb
export const COMPOUND_V3_CUSDC_ADDRESS_ARB_MAINNET =
  "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf" as Address;

export const COMPOUND_V3_CUSDC_COLLATERALS_ARB_MAINNET: Token[] = [
  ...COMPOUND_V3_CUSDC_BRIDGED_COLLATERALS_ARB_MAINNET
];

export const COMPOUND_V3_COLLATERALS_ARB_MAINNET: Token[] = [
  ...COMPOUND_V3_CUSDC_COLLATERALS_ARB_MAINNET
];

export const COMPOUND_V3_DEBTS_ARB_MAINNET: Token[] = [
  USDC_ARB,
  USDC_BRIDGED_ARB
];

const PROVIDER_ARB_MAINNET = new ethers.JsonRpcProvider(
  ALCHEMY_API_URL_ARB_MAINNET
);

export const COMPOUND_V3_CUSDC_CONTRACT_ARB_MAINNET = new Contract(
  COMPOUND_V3_CUSDC_ADDRESS_ARB_MAINNET,
  COMPOUND_V3_ABI,
  PROVIDER_ARB_MAINNET
);

export const COMPOUND_V3_CUSDC_BRIDGED_CONTRACT_ARB_MAINNET = new Contract(
  COMPOUND_V3_CUSDC_BRIDGED_ADDRESS_ARB_MAINNET,
  COMPOUND_V3_ABI,
  PROVIDER_ARB_MAINNET
);

function getTokenId(chain: Chain, debtTokenAddress: Address): string {
  return `${chain}-${debtTokenAddress}.toLowerCase()`;
}

const COMPOUND_V3_CONTRACT_MAP: Map<string, Contract> = new Map([
  [getTokenId(Chain.EthMainNet, WETH.address), COMPOUND_V3_CWETH_CONTRACT],
  [getTokenId(Chain.EthMainNet, USDC.address), COMPOUND_V3_CUSDC_CONTRACT],
  [
    getTokenId(Chain.ArbMainNet, USDC_ARB.address),
    COMPOUND_V3_CUSDC_CONTRACT_ARB_MAINNET
  ],
  [
    getTokenId(Chain.ArbMainNet, USDC_BRIDGED_ARB.address),
    COMPOUND_V3_CUSDC_BRIDGED_CONTRACT_ARB_MAINNET
  ]
]);

/**
 * Returns the Compound V3 market contract for a given chain and debt token address.
 * @param chain
 * @param debtTokenAddress
 * @returns
 */
export function getCompoundV3MarketContract(
  chain: Chain,
  debtTokenAddress: Address
) {
  const contract = COMPOUND_V3_CONTRACT_MAP.get(
    getTokenId(chain, debtTokenAddress)
  );

  if (!contract) {
    throw new Error(
      `No Compound V3 market contract found for ${chain} and ${debtTokenAddress}`
    );
  }

  return contract;
}

const COMPOUND_V3_COLLATERAL_MAP: Map<string, Token[]> = new Map([
  [
    getTokenId(Chain.EthMainNet, USDC.address),
    COMPOUND_V3_CUSDC_COLLATERALS_ETH_MAINNET
  ],
  [
    getTokenId(Chain.EthMainNet, WETH.address),
    COMPOUND_V3_CWETH_COLLATERALS_ETH_MAINNET
  ],
  [
    getTokenId(Chain.ArbMainNet, USDC_ARB.address),
    COMPOUND_V3_CUSDC_COLLATERALS_ARB_MAINNET
  ],
  [
    getTokenId(Chain.ArbMainNet, USDC_BRIDGED_ARB.address),
    COMPOUND_V3_CUSDC_BRIDGED_COLLATERALS_ARB_MAINNET
  ]
]);

export function getSupportedCollateralsByDebtToken(
  chain: Chain,
  debtTokenAddress: Address
) {
  const collateralTokens = COMPOUND_V3_COLLATERAL_MAP.get(
    getTokenId(chain, debtTokenAddress)
  );

  if (!collateralTokens) {
    throw new Error(
      `No supported collateral tokens found for ${chain} and ${debtTokenAddress}`
    );
  }

  return [...collateralTokens];
}

// Price feed from: https://raw.githubusercontent.com/compound-finance/compound-js/master/src/comet-artifacts/comet-constants.json
const COMPOUND_V3_PRICEFEEDS_ARB_MAINNET = {
  ARB: "0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6" as Address,
  GMX: "0xDB98056FecFff59D032aB628337A4887110df3dB" as Address,
  WETH: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612" as Address,
  WBTC: "0xd0C7101eACbB49F3deCcCc166d238410D6D46d57" as Address,
  USDC: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3" as Address
};

export function getPriceFeedFromTokenSymbol(
  chain: Chain,
  tokenSymbol: string
): Address {
  let priceFeeds;
  if (chain === Chain.EthMainNet) {
    priceFeeds = COMPOUND_V3_PRICEFEEDS_ETH_MAINNET;
  } else if (chain === Chain.ArbMainNet) {
    priceFeeds = COMPOUND_V3_PRICEFEEDS_ARB_MAINNET;
  } else {
    throw new Error("Unsupported chain: " + chain);
  }

  const tokenSymbolUpper = tokenSymbol.toUpperCase();
  if (tokenSymbolUpper in priceFeeds) {
    return priceFeeds[tokenSymbolUpper as keyof typeof priceFeeds];
  } else {
    throw new Error(
      `Price feed not found for token symbol: ${tokenSymbol} for chain: ${chain}`
    );
  }
}
