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
    const start = Date.now();
    return get30DayTrailingAPYInfo(Protocol.AaveV3, tokenSymbol).then(
      (result) => {
        console.log(
          `Time taken to fetch APY info AAVE token: ${tokenSymbol}: ${
            Date.now() - start
          } ms`
        );
        return result;
      }
    );
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
  const start = Date.now();
  return baseAaveService
    .getBorrowRecommendations(debtTokens, collaterals)
    .then((results) => {
      console.log(
        `Time taken to get AAVE v3 borrow recommendations: ${
          Date.now() - start
        } ms`
      );
      return results;
    });
}

async function calculateRewardAPYs(
  tokenSymbol: string
): Promise<{ lendingRewardAPY: number; borrowingRewardAPY: number }> {
  const start = Date.now();
  return get30DayTrailingAPYInfo(Protocol.AaveV3, tokenSymbol).then(
    (result) => {
      console.log(
        `Time taken to fetch 30 day trailing APY info using DefiLlama for token: ${tokenSymbol}: ${
          Date.now() - start
        } ms`
      );
      return result;
    }
  );
}
