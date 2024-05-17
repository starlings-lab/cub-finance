import {
  DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL,
  DEFILLAMA_YIELDS_POOLS_API_URL
} from "@/app/constants";
import { calculate30DayTrailingBorrowingAndLendingAPYs } from "@/app/service/defiLlamaDataService";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

// This function can run for a maximum of 60 seconds
export const maxDuration = 60;

const PROJECT_SLUGS = Array.from(DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL.values());

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
        .filter(
          (pool: any) =>
            pool.chain === "Ethereum" &&
            PROJECT_SLUGS.includes(pool.project.toLowerCase())
        )
        .map((poolData: any) => {
          // console.log("Fetched pool data", poolData);
          return {
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

    const poolKey = `${poolData.project}-${poolData.symbol}`.toUpperCase();
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
