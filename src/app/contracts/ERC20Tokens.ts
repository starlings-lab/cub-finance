import { Token } from "../type/type";

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

export const DEBT_STABLECOINS = [USDC, DAI, USDT, PYUSD, USDA, LUSD, crvUSD];
