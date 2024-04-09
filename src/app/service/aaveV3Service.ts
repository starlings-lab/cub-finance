import * as markets from "@bgd-labs/aave-address-book";
import { BaseAaveService } from "./BaseAaveService";
import { Address } from "abitype";

const baseAaveService = new BaseAaveService(
  markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER
);

export async function getUserDebtPositions(userAddress: Address) {
  return baseAaveService.getUserDebtPositions(userAddress);
}

export async function getInterestRates(marketAddress: Address): Promise<any[]> {
  return baseAaveService.getInterestRates(marketAddress);
}
