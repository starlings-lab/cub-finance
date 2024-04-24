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

export const TEST_DEBT_POSITION_ADDRESSES = {
  aaveUser1: "0x00171ab2f44c1c9b21c7696eb1a5c601f05a9167",
  aaveUser2: "0xa61D72BD43087d5102EC7AdFBBf9DE7189b1A6b1",
  aaveUser3: "0x4F03745D7963462CDbb0050F02f99025FeD52976",
  aaveUser4: "0xbF47E471eEe2C58782Abd0B66cb7be865c809A95",
  aaveUser5: "0x901bd9EF18da00b43985B608ee831a79c4070C30",
  compoundUser1: "0xfe99cc4664a939f826dbeb545c1aad4c89ee737a",
  compoundUser2: "0x9CF423E929d661a0fB25e4AEf05bEB1037298fFb",
  morphoUser1: "0xf603265f91f58F1EfA4fAd57694Fb3B77b25fC18"
};
