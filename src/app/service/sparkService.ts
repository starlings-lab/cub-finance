import { BaseAaveService, APYProvider, APYInfo } from "./BaseAaveService";
import { Address } from "abitype";
import {
  CompoundV3DebtPosition,
  DebtPosition,
  MorphoBlueDebtPosition,
  Protocol,
  RecommendedDebtDetail
} from "../type/type";
import { calculate30DayTrailingBorrowingAndLendingAPYs } from "./defiLlamaDataService";
import { DEFILLAMA_SPARK_POOL_IDS } from "../constants";

// implement APYProvider interface for Spark protocol
class SparkAPYProvider implements APYProvider {
  public async calculateTrailing30DaysBorrowingAndLendingAPYs(
    tokenSymbolOrATokenAddress: string | Address
  ): Promise<APYInfo> {
    const tokenSymbol = (tokenSymbolOrATokenAddress as string).toUpperCase();

    const tokenPoolId = DEFILLAMA_SPARK_POOL_IDS[
      tokenSymbol as keyof typeof DEFILLAMA_SPARK_POOL_IDS
    ] as string;
    if (!tokenPoolId) {
      // TODO: DefiLlama doesn't have data for sDAI and GNO(Gnosis Token)
      console.log(`DefiLlama pool id not found for token: ${tokenSymbol}`);
      return Promise.resolve({
        borrowingAPY: 0,
        lendingAPY: 0
      });
    }
    // Implement logic to calculate APYs
    return calculate30DayTrailingBorrowingAndLendingAPYs(tokenPoolId).then(
      (apyInfo) => {
        return {
          borrowingAPY: apyInfo.trailingDayBorrowingAPY,
          lendingAPY: apyInfo.trailingDayLendingAPY
        };
      }
    );
  }
}

// Contract addresses are used from https://docs.sparkprotocol.io/developers/deployed-contracts/mainnet-addresses
const baseAaveService = new BaseAaveService(
  Protocol.Spark,
  "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE", //POOL_ADDRESSES_PROVIDER,
  "0xF028c2F4b19898718fD0F77b9b881CbfdAa5e8Bb", //UI_POOL_DATA_PROVIDER
  new SparkAPYProvider()
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
