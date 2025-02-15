import { ethers } from "ethers";
import { Chain, Token } from "../type/type";
import { getUniqueTokens } from "../utils/utils";
import { Address } from "abitype";

export const USDC: Token = {
  address: `0x${"A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"}`,
  name: "USD Coin",
  decimals: 6,
  symbol: "USDC"
};

export const DAI: Token = {
  address: `0x${"6B175474E89094C44Da98b954EedeAC495271d0F"}`,
  name: "Dai Stablecoin",
  decimals: 18,
  symbol: "DAI"
};

export const sDAI: Token = {
  address: "0x83F20F44975D03b1b09e64809B757c47f942BEeA",
  name: "Savings Dai",
  decimals: 18,
  symbol: "sDAI"
};

export const USDT: Token = {
  address: `0x${"dAC17F958D2ee523a2206206994597C13D831ec7"}`,
  name: "Tether USD",
  decimals: 6,
  symbol: "USDT"
};

export const PYUSD: Token = {
  address: `0x${"6c3ea9036406852006290770BEdFcAbA0e23A0e8"}`,
  name: "PayPal USD",
  decimals: 6,
  symbol: "PYUSD"
};

export const USDA: Token = {
  address: `0x${"0000206329b97DB379d5E1Bf586BbDB969C63274"}`,
  name: "USDA",
  decimals: 18,
  symbol: "USDA"
};

export const LUSD: Token = {
  address: `0x${"5f98805A4E8be255a32880FDeC7F6728C6568bA0"}`,
  name: "LUSD Stablecoin",
  decimals: 18,
  symbol: "LUSD"
};

export const crvUSD: Token = {
  address: `0x${"f939E0A03FB07F59A73314E73794Be0E57ac1b4E"}`,
  name: "Curve.Fi USD Stablecoin",
  decimals: 18,
  symbol: "crvUSD"
};

export const WETH: Token = {
  address: `0x${"C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"}`,
  name: "Wrapped Ether",
  decimals: 18,
  symbol: "WETH"
};

export const COMP: Token = {
  address: `0x${"c00e94Cb662C3520282E6f5717214004A7f26888"}`,
  name: "Compound",
  decimals: 18,
  symbol: "COMP"
};

export const WBTC: Token = {
  address: `0x${"2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"}`,
  name: "Wrapped BTC",
  decimals: 8,
  symbol: "WBTC"
};

export const UNI: Token = {
  address: `0x${"1f9840a85d5aF5bf1D1762F925BDADdC4201F984"}`,
  name: "Uniswap",
  decimals: 18,
  symbol: "UNI"
};

export const LINK: Token = {
  address: `0x${"514910771AF9Ca656af840dff83E8264EcF986CA"}`,
  name: "ChainLink Token",
  decimals: 18,
  symbol: "LINK"
};

export const cbETH: Token = {
  address: `0x${"Be9895146f7AF43049ca1c1AE358B0541Ea49704"}`,
  name: "Coinbase Wrapped Staked ETH",
  decimals: 18,
  symbol: "cbETH"
};

export const wstETH: Token = {
  address: `0x${"7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"}`,
  name: "Wrapped liquid staked Ether 2.0",
  decimals: 18,
  symbol: "wstETH"
};

export const rETH: Token = {
  address: `0x${"ae78736Cd615f374D3085123A210448E74Fc6393"}`,
  name: "Rocket Pool ETH",
  decimals: 18,
  symbol: "rETH"
};

// https://etherscan.io/address/0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f#readContract
export const GHO: Token = {
  address: `0x${"40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f"}`,
  name: "Gho Token",
  decimals: 18,
  symbol: "GHO"
};

export const USDe: Token = {
  address: "0x4c9EDD5852cd905f086C759E8383e09bff1E68B3",
  name: "USDe",
  decimals: 18,
  symbol: "USDe"
};

export const sUSDe: Token = {
  address: "0x9D39A5DE30e57443BfF2A8307A4256c8797A3497",
  name: "Staked USDe",
  decimals: 18,
  symbol: "sUSDe"
};

// LRTs
export const weETH: Token = {
  address: "0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee",
  name: "Wrapped eETH",
  symbol: "weETH",
  decimals: 18
};

// https://etherscan.io/token/0xbf5495Efe5DB9ce00f80364C8B423567e58d2110#readProxyContract
export const ezETH: Token = {
  address: "0xbf5495Efe5DB9ce00f80364C8B423567e58d2110",
  name: "Renzo Restaked ETH",
  symbol: "ezETH",
  decimals: 18
};

export const AAVE: Token = {
  address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
  name: "Aave Token",
  symbol: "AAVE",
  decimals: 18
};

export const ETH: Token = {
  address: ethers.ZeroAddress as Address,
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18
};

export const MORPHO_BLUE_DEBT_STABLECOINS_ETH_MAINNET = [
  USDC,
  DAI,
  USDT,
  PYUSD,
  USDA
];
export const AAVE_V3_DEBT_STABLECOINS_ETH_MAINNET = [
  GHO,
  USDC,
  DAI,
  USDT,
  PYUSD,
  LUSD,
  crvUSD
];
export const COMPOUND_V3_DEBT_STABLECOINS_ETH_MAINNET = [USDC];
export const SPARKFI_DEBT_STABLECOINS_ETH_MAINNET = [DAI];
export const SUPPORTED_DEBT_STABLECOINS_ETH_MAINNET = getUniqueTokens([
  ...MORPHO_BLUE_DEBT_STABLECOINS_ETH_MAINNET,
  ...AAVE_V3_DEBT_STABLECOINS_ETH_MAINNET,
  ...COMPOUND_V3_DEBT_STABLECOINS_ETH_MAINNET,
  ...SPARKFI_DEBT_STABLECOINS_ETH_MAINNET
]);

// this token seems like scam or test token in morpho blue market with same name as USDC
export const USDC_DUPLICATE_OR_SCAM =
  "0xcbfb9B444d9735C345Df3A0F66cd89bD741692E9".toLowerCase();

export const SUPPORTED_COLLATERAL_TOKENS_ETH_MAINNET: Token[] = [
  USDC,
  USDT,
  DAI,
  sDAI,
  USDe,
  sUSDe,
  WETH,
  WBTC,
  wstETH,
  rETH,
  cbETH,
  weETH,
  ezETH,
  LINK,
  AAVE,
  COMP,
  UNI
];

export const SUPPORTED_COLLATERAL_TOKENS_MAP_ETH_MAINNET =
  SUPPORTED_COLLATERAL_TOKENS_ETH_MAINNET.reduce((map, obj) => {
    map.set(obj.address.toLowerCase(), obj);
    return map;
  }, new Map<string, Token>());

// Arbitrum Tokens
export const DAI_ARB: Token = {
  ...DAI,
  address: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"
};

export const LINK_ARB: Token = {
  ...LINK,
  address: "0xf97f4df75117a78c1a5a0dbb814af92458539fb4"
};

// https://arbiscan.io/address/0xff970a61a04b1ca14834a43f5de4533ebddb5cc8
// USDC.e is the bridged version of USDC on Arbitrum
// Bridged vs Native USDC: https://www.circle.com/blog/bridged-usdc-standard
export const USDC_BRIDGED_ARB: Token = {
  ...USDC,
  address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
  symbol: "USDC.e",
  name: "USD Coin (Arb1)"
};

// https://arbiscan.io/address/0xaf88d065e77c8cc2239327c5edb3a432268e5831
export const USDC_ARB: Token = {
  ...USDC,
  address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831" as Address
};

export const WBTC_ARB: Token = {
  ...WBTC,
  address: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f" as Address
};

export const WETH_ARB: Token = {
  ...WETH,
  address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1" as Address
};

export const USDT_ARB: Token = {
  ...USDT,
  address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9" as Address
};

export const EURS_ARB: Token = {
  address: "0xd22a58f79e9481d1a88e00c344885a588b34b68b" as Address,
  name: "STASIS EURS Token",
  symbol: "EURS",
  decimals: 2
};

export const wstETH_ARB: Token = {
  ...wstETH,
  address: "0x5979d7b546e38e414f7e9822514be443a4800529" as Address,
  name: "Wrapped liquid staked Ether 2.0"
};

export const MAI_ARB: Token = {
  address: "0x3f56e0c36d275367b8c502090edf38289b3dea0d" as Address,
  name: "Mai Stablecoin",
  symbol: "MAI",
  decimals: 18
};

export const rETH_ARB: Token = {
  ...rETH,
  address: "0xec70dcb4a1efa46b8f2d97c310c9c4790ba5ffa8" as Address
};

export const LUSD_ARB: Token = {
  ...LUSD,
  address: "0x93b346b6bc2548da6a1e7d98e9a421b42541425b" as Address
};

export const FRAX_ARB: Token = {
  address: "0x17fc002b466eec40dae837fc4be5c67993ddbd6f" as Address,
  name: "Frax",
  symbol: "FRAX",
  decimals: 18
};

export const ARB: Token = {
  address: "0x912ce59144191c1204e64559fe8253a0e49e6548" as Address,
  name: "Arbitrum",
  symbol: "ARB",
  decimals: 18
};

export const weETH_ARB: Token = {
  address: "0x35751007a407ca6feffe80b3cb397736d2cf4dbe" as Address,
  name: "Wrapped eETH",
  symbol: "weETH",
  decimals: 18
};

export const AAVE_ARB: Token = {
  ...AAVE,
  address: "0xba5ddd1f9d7f570dc94a51479a000e3bce967196" as Address
};

export const COMP_ARB: Token = {
  ...COMP,
  address: "0x354A6dA3fcde098F8389cad84b0182725c6C91dE" as Address
};

// GMX (Arbitrum): https://arbiscan.io/address/0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a
export const GMX_ARB: Token = {
  address: "0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a" as Address,
  name: "GMX",
  symbol: "GMX",
  decimals: 18
};

export const AAVE_V3_DEBT_STABLECOINS_ARB_MAINNET = [
  USDC_ARB,
  USDC_BRIDGED_ARB,
  DAI_ARB,
  USDT_ARB,
  LUSD_ARB,
  FRAX_ARB,
  EURS_ARB,
  MAI_ARB
];
export const COMPOUND_V3_DEBT_STABLECOINS_ARB_MAINNET = [USDC_ARB];
export const SUPPORTED_DEBT_STABLECOINS_ARB_MAINNET = getUniqueTokens([
  ...AAVE_V3_DEBT_STABLECOINS_ARB_MAINNET,
  ...COMPOUND_V3_DEBT_STABLECOINS_ARB_MAINNET
]);

export const SUPPORTED_COLLATERAL_TOKENS_ARB_MAINNET: Token[] = [
  USDC_ARB,
  USDC_BRIDGED_ARB,
  DAI_ARB,
  USDT_ARB,
  WETH_ARB,
  WBTC_ARB,
  wstETH_ARB,
  rETH_ARB,
  weETH_ARB,
  LINK_ARB,
  AAVE_ARB,
  LUSD_ARB,
  ARB
  // COMP_ARB,
  // UNI_ARB
];

export const SUPPORTED_COLLATERAL_TOKENS_MAP_ARB_MAINNET =
  SUPPORTED_COLLATERAL_TOKENS_ARB_MAINNET.reduce((map, obj) => {
    map.set(obj.address.toLowerCase(), obj);
    return map;
  }, new Map<string, Token>());

export function getSupportedCollateralTokenMap(chain: Chain) {
  if (chain === Chain.EthMainNet) {
    return SUPPORTED_COLLATERAL_TOKENS_MAP_ETH_MAINNET;
  } else if (chain === Chain.ArbMainNet) {
    return SUPPORTED_COLLATERAL_TOKENS_MAP_ARB_MAINNET;
  }
  throw new Error(`Unsupported chain: ${chain}`);
}
