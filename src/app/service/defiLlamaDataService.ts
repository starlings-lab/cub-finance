"use server";

import { Address } from "abitype";
import {
  DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL,
  DEFILLAMA_TOKEN_PRICE_API_URL,
  DEFILLAMA_YIELDS_POOLS_API_URL,
  getDefiLlamaLendBorrowDataApi
} from "../constants";
import { APYInfo, Protocol } from "../type/type";
import { ETH } from "../contracts/ERC20Tokens";
import { kv } from "@vercel/kv";

export async function get30DayTrailingAPYInfo(
  protocol: Protocol,
  tokenSymbol: string
): Promise<APYInfo> {
  // check if data is already stored in vercel KV
  const poolKey = `${DEFILLAMA_PROJECT_SLUG_BY_PROTOCOL.get(
    protocol
  )}-${tokenSymbol}`.toUpperCase();
  const cachedData = await kv.hgetall(poolKey);

  if (!cachedData) {
    console.error(`APY data not found in cache for ${poolKey}`);
    return Promise.resolve({
      lendingAPY: 0,
      lendingRewardAPY: 0,
      borrowingAPY: 0,
      borrowingRewardAPY: 0
    });
  }

  // console.log(`APY data from cache for ${poolKey}: `, cachedData);
  return Promise.resolve({
    lendingAPY: Number(cachedData.lendingAPY),
    lendingRewardAPY: Number(cachedData.lendingRewardAPY),
    borrowingAPY: Number(cachedData.borrowingAPY),
    borrowingRewardAPY: Number(cachedData.borrowingRewardAPY)
  });

  // TODO: trigger cache refresh if data is not available?
}

/**
 * Calculate the 30 day trailing borrowing and lending APYs for given lending pool.
 * This function fetches last 30 days of historical lend and borrow APYs from DefiLlama API
 * and calculates the trailing APYs.
 * @param poolId DefiLlama pool id of the lending pool
 * @returns
 * @throws Error if there is an issue fetching data from DefiLlama API
 * Note: This function should only be used in the API route to calculate
 * and cache APYs for all pools of supported protocols.
 */
export async function calculate30DayTrailingBorrowingAndLendingAPYs(
  poolId: string
): Promise<APYInfo> {
  return getHistoricalLendBorrowRewardAPY(poolId, 30)
    .then((data) => {
      let cumulativeBorrowAPY: number = 0;
      let cumulativeLendAPY: number = 0;
      let cumulativeLendingRewardAPY: number = 0;
      let cumulativeBorrowingRewardAPY: number = 0;
      for (let i = 0; i < data.length; i++) {
        // expected shape of data:
        // { apyBase: number, apyReward: number, apyBaseBorrow: number, apyRewardBorrow: number }
        const datum: any = data[i];
        cumulativeBorrowAPY += Number(datum.apyBaseBorrow);
        cumulativeLendAPY += Number(datum.apyBase);
        cumulativeLendingRewardAPY += Number(datum.apyReward);
        cumulativeBorrowingRewardAPY += Number(datum.apyRewardBorrow);
      }

      const trailingDayBorrowingAPY: number =
        cumulativeBorrowAPY / data.length / 100;
      const trailingDayLendingAPY: number =
        cumulativeLendAPY / data.length / 100;

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
async function getHistoricalLendBorrowRewardAPY(
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
  // check if data is already stored in vercel KV
  const cachedData = await kv.hgetall(`pools-${projectSlug}`);
  if (cachedData) {
    const typedCachedData = cachedData as { [key: string]: string };
    return Promise.resolve(new Map(Object.entries(typedCachedData)));
  }

  console.log(`Fetching pools data from DefiLlama API for ${projectSlug}`);
  return fetch(DEFILLAMA_YIELDS_POOLS_API_URL, { cache: "no-store" })
    .then((responseRaw) => responseRaw.json())
    .then((response) => {
      // console.dir(response, { depth: null });

      // filter pools by protocol and create a map of pool token symbol to pool id
      const pools: { [key: string]: string } = {};
      response.data
        .filter(
          (pool: any) =>
            pool.chain === "Ethereum" &&
            pool.project.toLowerCase() === projectSlug.toLowerCase()
        )
        .forEach((poolData: any) => {
          pools[poolData.symbol.toUpperCase()] = poolData.pool;
        });

      // console.dir(pools, { depth: null });
      // store data in vercel KV
      kv.hset(`pools-${projectSlug}`, pools);

      // convert pools to map and return
      return new Map(Object.entries(pools));
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

const ETHEREUM_CHAIN_PREFIX = "ethereum:";
const ETHEREUM_COINGECKO_ID = "coingecko:ethereum";

/**
 * Fetches token prices from DefiLlama API for given token addresses
 * @param tokenAddresses List of token addresses
 * @returns Map of token address to token price
 */
export async function getTokenPrice(
  tokenAddresses: Address[]
): Promise<Map<Address, number>> {
  const tokenPriceMap = new Map<Address, number>();
  return fetch(
    DEFILLAMA_TOKEN_PRICE_API_URL +
      tokenAddresses
        .map((address) => {
          // use "coingecko:ethereum" for ZERO address which represents ETH
          return address === ETH.address
            ? ETHEREUM_COINGECKO_ID
            : `${ETHEREUM_CHAIN_PREFIX}${address}`;
        })
        .join(",") +
      "?searchWidth=1h"
  )
    .then((responseRaw) => responseRaw.json())
    .then((response) => {
      // console.dir(response, { depth: null });
      Object.keys(response.coins).forEach((key: string) => {
        /**
         * Shape of the coin data returned by DefiLlama API:
         * {
         *    "coins": {
         *      "ethereum:0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0": {
         *        "price": 3409.45,
         *        "symbol": "wstETH",
         *        "decimals": 18,
         *        "timestamp": 1715378800,
         *        "confidence": 0.99
         *      }
         *    }
         * }
         */
        // remove "ethereum:" prefix and add token price to map
        const tokenAddress =
          key === ETHEREUM_COINGECKO_ID
            ? ETH.address
            : (key
                .slice(ETHEREUM_CHAIN_PREFIX.length)
                .toLowerCase() as Address);

        const coinData = response.coins[key];
        tokenPriceMap.set(tokenAddress, coinData.price);
      });

      // console.dir(tokenPriceMap, { depth: null });

      return tokenPriceMap;
    })
    .catch((error) => {
      console.error(
        `Error fetching token prices for addresses ${tokenAddresses}: `,
        error
      );
      // throw error;
      return tokenPriceMap;
    });
}
