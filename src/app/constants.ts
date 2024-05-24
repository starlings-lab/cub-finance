import { gql } from "graphql-request";
import { Address } from "abitype";
import { Protocol } from "./type/type";

export const ALCHEMY_API_URL = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY_ETH_MAINNET}`;
export const ALCHEMY_RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_ETH_MAINNET}`;

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

// App: https://defillama.com/yields/pool/85c57261-b75b-4447-a115-d79b1a7de8ed
// API: https://yields.llama.fi/chartLendBorrow/85c57261-b75b-4447-a115-d79b1a7de8ed
export const DEFILLAMA_COMPOUND_ETH_POOL_ID =
  "85c57261-b75b-4447-a115-d79b1a7de8ed";

// App: https://defillama.com/yields/pool/7da72d09-56ca-4ec5-a45f-59114353e487
// API: https://yields.llama.fi/chartLendBorrow/7da72d09-56ca-4ec5-a45f-59114353e487
export const DEFILLAMA_COMPOUND_USDC_POOL_ID =
  "7da72d09-56ca-4ec5-a45f-59114353e487";

export const getDefiLlamaLendBorrowDataApi = (poolId: string) => {
  return `${DEFILLAMA_YIELDS_API_URL}/chartLendBorrow/${poolId}`;
};

export const DEFILLAMA_SPARK_POOL_IDS = {
  // https://defillama.com/yields/pool/3b45941c-16cb-48c5-a490-16c6c4f1d86a
  WSTETH: "3b45941c-16cb-48c5-a490-16c6c4f1d86a",
  // https://defillama.com/yields/pool/24195b31-d749-445f-bf9e-b65aa025ebdd
  WETH: "24195b31-d749-445f-bf9e-b65aa025ebdd",
  // https://defillama.com/yields/pool/03406d3a-fcc4-4fe3-8809-7a95222951b6
  WBTC: "03406d3a-fcc4-4fe3-8809-7a95222951b6",
  // https://defillama.com/yields/pool/8751078b-6be1-403b-ac44-9f11fe87d400
  RETH: "8751078b-6be1-403b-ac44-9f11fe87d400",
  // https://defillama.com/yields/pool/e26ce7d9-db75-4aa4-b1db-cc21ae17bdfb
  DAI: "e26ce7d9-db75-4aa4-b1db-cc21ae17bdfb",
  // https://defillama.com/yields/pool/65ce8276-b4d9-41ba-9f6f-21fc374cf9bc
  USDC: "65ce8276-b4d9-41ba-9f6f-21fc374cf9bc",
  // https://defillama.com/yields/pool/8fbe28b8-140d-4e37-8804-5d2aba4daded
  USDT: "8fbe28b8-140d-4e37-8804-5d2aba4daded"
};

export const DEFILLAMA_AAVE_V3_POOL_IDS = {};

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

export const ROUTE_BORROW = "borrow";
