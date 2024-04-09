import { SupportedCollateral } from "../type/type";

export const COMPOUND_V3_CUSDC_ADDRESS = `0x${"c3d688B66703497DAA19211EEdff47f25384cdc3"}`;
export const COMPOUND_V3_CWETH_ADDRESS = `0x${"A17581A9E3356d9A858b789D68B4d866e593aE94"}`;

export const COMPOUND_V3_CUSDC_COLLATERALS: SupportedCollateral[] = [
  { name: "COMP", address: `0x${"c00e94Cb662C3520282E6f5717214004A7f26888"}` },
  { name: "WBTC", address: `0x${"2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"}` },
  { name: "WETH", address: `0x${"C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"}` },
  { name: "UNI", address: `0x${"1f9840a85d5aF5bf1D1762F925BDADdC4201F984"}` },
  { name: "LINK", address: `0x${"514910771AF9Ca656af840dff83E8264EcF986CA"}` },
  { name: "USDC", address: `0x${"A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"}` }
];

export const COMPOUND_V3_CWETH_COLLATERALS: SupportedCollateral[] = [
  { name: "cbETH", address: `0x${"Be9895146f7AF43049ca1c1AE358B0541Ea49704"}` },
  {
    name: "wstETH",
    address: `0x${"7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"}`
  },
  { name: "WETH", address: `0x${"C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"}` }
];

export const COMPOUND_V3_CUSDC_ABI: object[] = [
  {
    inputs: [
      { internalType: "address", name: "_logic", type: "address" },
      { internalType: "address", name: "admin_", type: "address" },
      { internalType: "bytes", name: "_data", type: "bytes" }
    ],
    stateMutability: "payable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address"
      }
    ],
    name: "AdminChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address"
      }
    ],
    name: "BeaconUpgraded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address"
      }
    ],
    name: "Upgraded",
    type: "event"
  },
  { stateMutability: "payable", type: "fallback" },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "admin_", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "newAdmin", type: "address" }],
    name: "changeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "implementation",
    outputs: [
      { internalType: "address", name: "implementation_", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" }
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  { stateMutability: "payable", type: "receive" }
];

export const COMPOUND_V3_CWETH_ABI: object[] = [
  {
    inputs: [
      { internalType: "address", name: "_logic", type: "address" },
      { internalType: "address", name: "admin_", type: "address" },
      { internalType: "bytes", name: "_data", type: "bytes" }
    ],
    stateMutability: "payable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address"
      }
    ],
    name: "AdminChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address"
      }
    ],
    name: "BeaconUpgraded",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address"
      }
    ],
    name: "Upgraded",
    type: "event"
  },
  { stateMutability: "payable", type: "fallback" },
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "admin_", type: "address" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "newAdmin", type: "address" }],
    name: "changeAdmin",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "implementation",
    outputs: [
      { internalType: "address", name: "implementation_", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" }
    ],
    name: "upgradeTo",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" }
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  { stateMutability: "payable", type: "receive" }
];
