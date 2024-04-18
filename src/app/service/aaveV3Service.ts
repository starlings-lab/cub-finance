import * as markets from "@bgd-labs/aave-address-book";
import { BaseAaveService } from "./BaseAaveService";
import { Address } from "abitype";
import { UiPoolDataProvider } from "@aave/contract-helpers";
import {
  CompoundV3DebtPosition,
  DebtPosition,
  MorphoBlueDebtPosition,
  Protocol,
  RecommendedDebtDetail
} from "../type/type";

export const baseAaveService = new BaseAaveService(
  Protocol.AaveV3,
  markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER
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
