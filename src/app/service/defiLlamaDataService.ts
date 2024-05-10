"use server";

import {
  DEFILLAMA_YIELDS_POOLS_API_URL,
  getDefiLlamaLendBorrowDataApi
} from "../constants";
import { APYInfo } from "../type/type";

/**
 * Calculate the 30 day trailing borrowing and lending APYs for given lending pool.
 * This function fetches last 30 days of historical lend and borrow APYs from DefiLlama API
 * and calculates the trailing APYs.
 * @param poolId DefiLlama pool id of the lending pool
 * @returns
 */
export async function calculate30DayTrailingBorrowingAndLendingAPYs(
  poolId: string
): Promise<APYInfo> {
  return getHistoricalLendBorrowRewardAPY(poolId, 30)
    .then((data) => {
      let cumulativeBorrowAPY = 0;
      let cumulativeLendAPY = 0;
      let cumulativeLendingRewardAPY = 0;
      let cumulativeBorrowingRewardAPY = 0;
      for (let i = 0; i < data.length; i++) {
        // expected shape of data:
        // { apyBase: number, apyReward: number, apyBaseBorrow: number, apyRewardBorrow: number }
        const datum: any = data[i];
        cumulativeBorrowAPY += datum.apyBaseBorrow;
        cumulativeLendAPY += datum.apyBase;
        cumulativeLendingRewardAPY += datum.apyReward;
        cumulativeBorrowingRewardAPY += datum.apyRewardBorrow;
      }

      const trailingDayBorrowingAPY = cumulativeBorrowAPY / data.length / 100;
      const trailingDayLendingAPY = cumulativeLendAPY / data.length / 100;

      // console.log(
      //   `Cumulative borrow rate: ${cumulativeBorrowRate}, Cumulative lend rate: ${cumulativeLendRate}`
      // );
      // console.log(
      //   `Trailing day borrow rate: ${trailingDayBorrowingAPY}, Trailing day lend rate: ${trailingDayLendingAPY}`
      // );

      return {
        lendingAPY: trailingDayLendingAPY,
        lendingRewardAPY: cumulativeLendingRewardAPY / data.length / 100,
        borrowingAPY: trailingDayBorrowingAPY,
        borrowingRewardAPY: cumulativeBorrowingRewardAPY / data.length / 100
      };
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

// function to fetch historical lend, borrow & reward apy for lending pool
export async function getHistoricalLendBorrowRewardAPY(
  poolId: string,
  days: number = 30
): Promise<any[]> {
  try {
    const responseRaw = await fetch(getDefiLlamaLendBorrowDataApi(poolId));
    const response = await responseRaw.json();

    // return last 30 items from the array
    // console.log("Data length: ", response.data.length);
    /**
     * Shape of the data returned by DefiLlama API:
     * {
          "timestamp": "2022-10-06T23:01:12.545Z",
          "totalSupplyUsd": 65413418,
          "totalBorrowUsd": 39402128,
          "debtCeilingUsd": null,
          "apyBase": 1.95765,
          "apyReward": 0,
          "apyBaseBorrow": 3.60824,
          "apyRewardBorrow": 8.77746
        } 
    */
    const data = response.data.slice(-days);
    // console.dir(data, { depth: null });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/**
 * Provides a map of pool token symbol to pool id for a given project/protocol for mainnet
 * @param projectSlug project slug defined by DefiLlama API
 * @returns
 */
export async function getProtocolPoolsMap(
  projectSlug: string
): Promise<Map<string, string>> {
  try {
    return fetch(DEFILLAMA_YIELDS_POOLS_API_URL, { cache: "no-store" })
      .then((responseRaw) => responseRaw.json())
      .then((response) => {
        // console.dir(response, { depth: null });

        // filter pools by protocol and create a map of pool token symbol to pool id
        const pools = new Map<string, string>();
        response.data
          .filter(
            (pool: any) =>
              pool.chain === "Ethereum" &&
              pool.project.toLowerCase() === projectSlug.toLowerCase()
          )
          .forEach((poolData: any) => {
            pools.set(poolData.symbol.toUpperCase(), poolData.pool);
          });

        // console.dir(pools, { depth: null });

        return pools;
      });
  } catch (error) {
    console.log(error);
    throw error;
  }
}
