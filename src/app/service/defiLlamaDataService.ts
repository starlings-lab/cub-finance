"use server";

import { Address } from "abitype";
import {
  DEFILLAMA_TOKEN_PRICE_API_URL,
  DEFILLAMA_YIELDS_POOLS_API_URL,
  getDefiLlamaLendBorrowDataApi
} from "../constants";
import { APYInfo } from "../type/type";
import { ethers } from "ethers";
import { ETH } from "../contracts/ERC20Tokens";

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
