import { gql } from "graphql-request";
import { Address } from "abitype";
import { Chain, Protocol } from "./type/type";

export const ALCHEMY_API_URL_ETH_MAINNET = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY_ETH_MAINNET}`;
export const ALCHEMY_RPC_URL_ETH_MAINNET = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_ETH_MAINNET}`;

export const ALCHEMY_API_URL_ARB_MAINNET = `https://arb-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY_ARB_MAINNET}`;
export const ALCHEMY_RPC_URL_ARB_MAINNET = `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_ARB_MAINNET}`;

export function getAlchemyApiUrl(chain: Chain) {
  if (chain === Chain.EthMainNet) {
    return ALCHEMY_API_URL_ETH_MAINNET;
  } else if (chain === Chain.ArbMainNet) {
    return ALCHEMY_API_URL_ARB_MAINNET;
  }
  throw new Error(`Unsupported chain: ${chain}`);
}

export function getAlchemyApiKey(chain: Chain) {
  if (chain === Chain.EthMainNet) {
    return process.env.ALCHEMY_API_KEY_ETH_MAINNET;
  } else if (chain === Chain.ArbMainNet) {
    return process.env.ALCHEMY_API_KEY_ARB_MAINNET;
  }
  throw new Error(`Unsupported chain: ${chain}`);
}

// Graph playground: https://thegraph.com/hosted-service/subgraph/messari/aave-v3-ethereum
export const MESSARI_AAVE_V3_GRAPHQL_URL =
  "https://api.thegraph.com/subgraphs/name/messari/aave-v3-ethereum";

export const MORPHO_GRAPHQL_URL = "https://blue-api.morpho.org/graphql";

export const MORPHO_SUPPORTED_DEBT_TOKEN_QUERY = gql`
  query {
    markets(where: { chainId_in: [1] }) {
      items {
        loanAsset {
          address
          name
          decimals
          symbol
        }
      }
    }
  }
`;

export const MORPHO_SUPPORTED_COLLATERAL_TOKEN_QUERY = gql`
  query {
    markets(where: { chainId_in: [1] }) {
      items {
        collateralAsset {
          address
          name
          decimals
          symbol
        }
      }
    }
  }
`;

export const DEFILLAMA_YIELDS_API_URL = "https://yields.llama.fi";
export const DEFILLAMA_YIELDS_POOLS_API_URL = `${DEFILLAMA_YIELDS_API_URL}/pools`;
export const DEFILLAMA_TOKEN_PRICE_API_URL = `https://coins.llama.fi/prices/current/`;

export const DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL = new Map<Protocol, string>([
  [Protocol.AaveV3, "aave-v3"],
  [Protocol.CompoundV3, "compound-v3"],
  [Protocol.Spark, "spark"]
]);

export const getDefiLlamaLendBorrowDataApi = (poolId: string) => {
  return `${DEFILLAMA_YIELDS_API_URL}/chartLendBorrow/${poolId}`;
};

export const TEST_DEBT_POSITION_ADDRESSES = {
  aaveUser1: `0x00171ab2f44c1c9b21c7696eb1a5c601f05a9167` as Address,
  aaveUser2: `0xa61D72BD43087d5102EC7AdFBBf9DE7189b1A6b1` as Address,
  aaveUser3: `0x4F03745D7963462CDbb0050F02f99025FeD52976` as Address,
  aaveUser4: `0xbF47E471eEe2C58782Abd0B66cb7be865c809A95` as Address,
  aaveUser5: `0x901bd9EF18da00b43985B608ee831a79c4070C30` as Address,
  compoundUser1: `0xfe99cc4664a939f826dbeb545c1aad4c89ee737a` as Address,
  compoundUser2: `0x9CF423E929d661a0fB25e4AEf05bEB1037298fFb` as Address,
  compoundUser3: `0xE4Fd8213711F18Fad8A97A1DB45436Abd8a2902c` as Address,
  compoundUser4: `0xb7B7eb7E9611975Bc9715F22ce7e6Ee288296fd4` as Address,
  morphoUser1: `0xf603265f91f58F1EfA4fAd57694Fb3B77b25fC18` as Address,
  morphoUser2: `0xA9DdD91249DFdd450E81E1c56Ab60E1A62651701` as Address,
  morphoUser3: `0x21c079c580560494De9cCB67FF5D46762c81E525` as Address,
  sparkUser1: `0x000005151cc6f5e8df4b44b955f440c05df7912f` as Address,
  sparkUser2: `0x00081cbc7cb307852b22d541f004dc6c6922277a` as Address,
  sparkUser3: `0x035dd15ca9621a448c7e47ce49e2525aa0bf14d0` as Address, // has morpho position too
  ensAddress1: "zloy.eth",
  ensAddress2: "juanvilla.eth",
  ensAddress3: "lozben.eth",
  ethAndWethHolder: "0xcA518c4DB97ECCe85cC82DE3C2B93D8f8b536ca5"
};

export const TEST_ARB_ADDRESSES = {
  ETH_HOLDER: "0xc3e5607cd4ca0d5fe51e09b60ed97a0ae6f874dd" as Address,
  USDC_HOLDER: "0xba35212fe946028543b2978a52fe842212b759dd" as Address,
  USDC_BRIDGED_HOLDER: "0x205e33536c0861e8a2f1f98b1d58b20e14d3a121" as Address,
  ARB_ETH_HOLDER: "0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23" as Address
};

export const ROUTE_BORROW = "borrow";
