import {
  DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL,
  DEFILLAMA_YIELDS_POOLS_API_URL
} from "@/app/constants";
import { calculate30DayTrailingBorrowingAndLendingAPYs } from "@/app/service/defiLlamaDataService";
import { Chain, Protocol } from "@/app/type/type";
import { getApyCacheKey } from "@/app/utils/utils";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

// This function can run for a maximum of 60 seconds
export const maxDuration = 75;

const PROJECT_SLUGS_ETH_MAINNET = Array.from(
  DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL.values()
);

const PROJECT_SLUGS_ARB_MAINNET = [
  DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL.get(Protocol.AaveV3),
  DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL.get(Protocol.CompoundV3)
];

const CHAIN_ETHEREUM = "Ethereum";
const CHAIN_ARBITRUM = "Arbitrum";

/**
 * This api refreshes the APY cache for all the pools from supported protocols.
 * Vercel cron job will run every day at 10 am UST (4AM CST) to invoke this api.
 * See vercel.json for configuration.
 */
export async function GET() {
  console.log("Refreshing APY cache...");
  const start = Date.now();
  const poolKeys = [];

  const pools = await fetch(DEFILLAMA_YIELDS_POOLS_API_URL, {
    cache: "no-store"
  })
    .then((responseRaw) => responseRaw.json())
    .then(async (response) => {
      // console.dir(response, { depth: null });

      // filter pools by protocol and create a list of pool id
      return response.data
        .filter((pool: any) => isPoolSupported(pool))
        .map((poolData: any) => {
          // console.log("Fetched pool data", poolData);
          return {
            chain: poolData.chain,
            project: poolData.project,
            poolId: poolData.pool,
            symbol: poolData.symbol.toUpperCase()
          };
        });
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });

  for (let i = 0; i < pools.length; i++) {
    const poolData = pools[i];
    // calculate APY for each pool
    const apyInfo: any = await calculate30DayTrailingBorrowingAndLendingAPYs(
      poolData.poolId
    );

    const poolKey = getCacheKey(poolData);
    poolKeys.push(poolKey);

    // store data in vercel KV
    await kv.hset(poolKey, apyInfo);
  }
  const timeTaken = `${Date.now() - start}ms`;
  console.log(
    `Time taken to refresh APY cache: ${timeTaken}, pool data cached for keys: ${poolKeys}`
  );
  return NextResponse.json({ success: true, timeTaken: timeTaken });
}

function isPoolSupported(pool: any) {
  return (
    (pool.chain === CHAIN_ETHEREUM &&
      PROJECT_SLUGS_ETH_MAINNET.includes(pool.project.toLowerCase())) ||
    (pool.chain === CHAIN_ARBITRUM &&
      PROJECT_SLUGS_ARB_MAINNET.includes(pool.project.toLowerCase()))
  );
}

function getCacheKey(poolData: any) {
  let chainEnum: Chain;
  if (poolData.chain === CHAIN_ETHEREUM) {
    chainEnum = Chain.EthMainNet;
  } else if (poolData.chain === CHAIN_ARBITRUM) {
    chainEnum = Chain.ArbMainNet;
  } else {
    throw new Error(`Unsupported chain: ${poolData.chain}`);
  }

  return getApyCacheKey(chainEnum, poolData.project, poolData.symbol);
}
