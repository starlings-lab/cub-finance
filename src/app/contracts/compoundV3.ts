import { Token } from "../type/type";
import {
  COMP,
  WBTC,
  WETH,
  UNI,
  LINK,
  USDC,
  cbETH,
  wstETH
} from "./ERC20Tokens";

export const COMPOUND_V3_CUSDC_ADDRESS = `0x${"c3d688B66703497DAA19211EEdff47f25384cdc3"}`;
export const COMPOUND_V3_CWETH_ADDRESS = `0x${"A17581A9E3356d9A858b789D68B4d866e593aE94"}`;

export const COMPOUND_V3_CUSDC_COLLATERALS: Token[] = [
  COMP,
  WBTC,
  WETH,
  UNI,
  LINK,
  USDC
];
export const COMPOUND_V3_CWETH_COLLATERALS: Token[] = [cbETH, wstETH, WETH];

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
