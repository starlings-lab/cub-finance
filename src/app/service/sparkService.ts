import * as markets from "@bgd-labs/aave-address-book";
import { BaseAaveService } from "./BaseAaveService";
import { Address } from "abitype";

// Contract addresses are used from https://docs.sparkprotocol.io/developers/deployed-contracts/mainnet-addresses
const baseAaveService = new BaseAaveService(
  "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE", //POOL_ADDRESSES_PROVIDER,
  "0xF028c2F4b19898718fD0F77b9b881CbfdAa5e8Bb" //UI_POOL_DATA_PROVIDER
);

export async function getUserDebtPositions(userAddress: Address) {
  return baseAaveService.getUserDebtPositions(userAddress);
}

export async function getInterestRates(marketAddress: Address): Promise<any[]> {
  return baseAaveService.getInterestRates(marketAddress);
}
