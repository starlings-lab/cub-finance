export const ALCHEMY_API_URL = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY_ETH_MAINNET}`;
export const ALCHEMY_RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_ETH_MAINNET}`;
export const MESSARI_GRAPHQL_URL =
  "https://api.thegraph.com/subgraphs/name/messari/aave-v3-ethereum";
export const MORPHO_GRAPHQL_URL = "https://blue-api.morpho.org/graphql";

export const DEFILLAMA_YIELDS_API_URL = "https://yields.llama.fi";

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
