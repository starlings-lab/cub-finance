import {
  DEFILLAMA_AAVE_V3_PROJECT_SLUGS,
  DEFILLAMA_YIELDS_POOLS_API_URL
} from "@/app/constants";
import { calculate30DayTrailingBorrowingAndLendingAPYs } from "@/app/service/defiLlamaDataService";
import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET() {
  const start = Date.now();
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
            DEFILLAMA_AAVE_V3_PROJECT_SLUGS.includes(pool.project.toLowerCase())
        )
        .map((poolData: any) => poolData.pool);
      // console.dir(pools, { depth: null });
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });

  for (let i = 0; i < pools.length; i++) {
    const poolId = pools[i];
    // calculate APY for each pool
    const apyInfo: any = await calculate30DayTrailingBorrowingAndLendingAPYs(
      poolId
    );
    // store data in vercel KV
    await kv.hset(`${poolId}`, apyInfo);
  }
  const timeTaken = `${Date.now() - start}ms`;
  console.log("Time taken refresh APY cache: " + timeTaken);
  return NextResponse.json({ success: true, timeTaken: timeTaken });
}
