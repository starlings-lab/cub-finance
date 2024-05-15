import * as markets from "@bgd-labs/aave-address-book";
import { BaseAaveService } from "./BaseAaveService";
import { Address } from "abitype";
import { UiPoolDataProvider } from "@aave/contract-helpers";
import {
  APYInfo,
  APYProvider,
  CompoundV3DebtPosition,
  DebtPosition,
  MorphoBlueDebtPosition,
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";
import { calculateAPYFromAPR } from "../utils/utils";
import { request, gql } from "graphql-request";
import { MESSARI_AAVE_V3_GRAPHQL_URL } from "../constants";
import { get30DayTrailingAPYInfo } from "./defiLlamaDataService";

// implement APYProvider interface for Spark protocol
class AaveV3APYProvider implements APYProvider {
  /**
   * Calculates 30 trailing days APY for a given aave market.
   * @param tokenSymbol Token symbol of the asset
   * @param aTokenAddress Address of and aave market (aToken address of an asset)
   * @returns
   * @remarks Trailing day interest rate is calculated by fetching hourly snapshots of the market
   * and calculating the average rate for the trailing days.
   */
  public async calculateTrailing30DaysBorrowingAndLendingAPYs(
    tokenSymbol: string,
    aTokenAddress: Address
  ): Promise<APYInfo> {
    const query = gql`
    query {
      marketHourlySnapshots(
        where: { market: "${aTokenAddress}" }
        orderBy: blockNumber
        orderDirection: desc
        first: 720
      ) {
        rates(where: {type: VARIABLE}) {
          rate
          side
          type
        }
        blockNumber
      }
    }
  `;
    try {
      return Promise.all([
        request(MESSARI_AAVE_V3_GRAPHQL_URL, query),
        calculateRewardAPYs(tokenSymbol)
      ]).then((values) => {
        // console.log(
        //   "Query result count: ",
        //   queryResult.marketHourlySnapshots.length
        // );
        const queryResult: any = values[0];
        let cumulativeBorrowRate = 0;
        let cumulativeLendRate = 0;
        for (let i = 0; i < queryResult.marketHourlySnapshots.length; i++) {
          const snapshot = queryResult.marketHourlySnapshots[i];
          const rateMapBySide = new Map<string, number>();
          snapshot.rates.forEach((rate: any) => {
            rateMapBySide.set(rate.side, parseFloat(rate.rate) / 100);
          });
          const borrowerRate = rateMapBySide.get("BORROWER") || 0;
          cumulativeBorrowRate += borrowerRate;
          const lenderRate = rateMapBySide.get("LENDER") || 0;
          cumulativeLendRate += lenderRate;
        }

        const trailingDayBorrowRate =
          cumulativeBorrowRate / queryResult.marketHourlySnapshots.length;
        const trailingDayLendRate =
          cumulativeLendRate / queryResult.marketHourlySnapshots.length;

        // console.log(
        //   `Cumulative borrow rate: ${cumulativeBorrowRate}, Cumulative lend rate: ${cumulativeLendRate}`
        // );
        // console.log(
        //   `Trailing day borrow rate: ${trailingDayBorrowRate}, Trailing day lend rate: ${trailingDayLendRate}`
        // );
        const trailingDayBorrowingAPY = calculateAPYFromAPR(
          trailingDayBorrowRate
        );
        const trailingDayLendingAPY = calculateAPYFromAPR(trailingDayLendRate);

        const apyInfo = {
          borrowingAPY: trailingDayBorrowingAPY,
          lendingAPY: trailingDayLendingAPY,
          borrowingRewardAPY: values[1].borrowingRewardAPY,
          lendingRewardAPY: values[1].lendingRewardAPY
        };

        // console.log("APY Info: ", apyInfo);
        return apyInfo;
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export const baseAaveService = new BaseAaveService(
  Protocol.AaveV3,
  markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER,
  new AaveV3APYProvider()
);

/**
 * Provides the existing debt positions and other details for a given user address
 * @param userAddress the user address for which the debt details are required
 * @returns user debt details
 */
export async function getUserDebtDetails(userAddress: Address) {
  return baseAaveService.getUserDebtDetails(userAddress);
}

/**
 * Provides recommended debt details for a given debt position
 * @param debtPosition the existing debt position which needs to be refinanced
 * @returns recommended debt details or null if no recommendations are available
 */
export async function getRecommendedDebtDetail(
  protocol: Protocol,
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition,
  maxLTVTolerance: number,
  borrowingAPYTolerance: number
): Promise<RecommendedDebtDetail | null> {
  return baseAaveService.getRecommendedDebtDetail(
    protocol,
    debtPosition,
    maxLTVTolerance,
    borrowingAPYTolerance
  );
}

// Get all debt tokens supported by protocol
export async function getSupportedDebtTokens(): Promise<Token[]> {
  return baseAaveService.getSupportedDebtTokens();
}

// get all collateral tokens supported by protocol
export async function getSupportedCollateralTokens(): Promise<Token[]> {
  return baseAaveService.getSupportedCollateralTokens();
}

export async function getBorrowRecommendations(
  debtTokens: Token[],
  collaterals: TokenAmount[]
): Promise<RecommendedDebtDetail[]> {
  return baseAaveService.getBorrowRecommendations(debtTokens, collaterals);
}

async function calculateRewardAPYs(
  tokenSymbol: string
): Promise<{ lendingRewardAPY: number; borrowingRewardAPY: number }> {
  return get30DayTrailingAPYInfo(Protocol.AaveV3, tokenSymbol);
}
