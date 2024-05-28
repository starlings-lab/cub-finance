import { BaseAaveService } from "./BaseAaveService";
import {
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";

// Contract addresses are used from https://docs.sparkprotocol.io/developers/deployed-contracts/mainnet-addresses
export const baseSparkService = new BaseAaveService(
  Protocol.Spark,
  "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE", //POOL_ADDRESSES_PROVIDER,
  "0xF028c2F4b19898718fD0F77b9b881CbfdAa5e8Bb" //UI_POOL_DATA_PROVIDER
);

// Get all debt tokens supported by protocol
export async function getSupportedDebtTokens(): Promise<Token[]> {
  return baseSparkService.getSupportedDebtTokens();
}

// get all collateral tokens supported by protocol
export async function getSupportedCollateralTokens(): Promise<Token[]> {
  return baseSparkService.getSupportedCollateralTokens();
}

export async function getBorrowRecommendations(
  debtTokens: Token[],
  collaterals: TokenAmount[]
): Promise<RecommendedDebtDetail[]> {
  return baseSparkService.getBorrowRecommendations(debtTokens, collaterals);
}
