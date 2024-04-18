import { BaseAaveService } from "./BaseAaveService";
import { Address } from "abitype";
import {
  CompoundV3DebtPosition,
  DebtPosition,
  MorphoBlueDebtPosition,
  Protocol,
  RecommendedDebtDetail
} from "../type/type";

// Contract addresses are used from https://docs.sparkprotocol.io/developers/deployed-contracts/mainnet-addresses
const baseAaveService = new BaseAaveService(
  Protocol.Spark,
  "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE", //POOL_ADDRESSES_PROVIDER,
  "0xF028c2F4b19898718fD0F77b9b881CbfdAa5e8Bb" //UI_POOL_DATA_PROVIDER
);

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
