import * as markets from "@bgd-labs/aave-address-book";
import { BaseAaveService } from "./BaseAaveService";
import { Address } from "abitype";
import { UiPoolDataProvider } from "@aave/contract-helpers";
import { DebtPosition, Market, Protocol } from "../type/type";

const baseAaveService = new BaseAaveService(
  Protocol.AaveV3,
  markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER
);

export async function getUserDebtDetails(userAddress: Address) {
  return baseAaveService.getUserDebtDetails(userAddress);
}
