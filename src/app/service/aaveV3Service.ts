import * as markets from "@bgd-labs/aave-address-book";
import { BaseAaveService } from "./BaseAaveService";
import {
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";

export const baseAaveService = new BaseAaveService(
  Protocol.AaveV3,
  markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER
);

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
