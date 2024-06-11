import { BaseAaveService } from "./BaseAaveService";
import {
  Chain,
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";
import { AlchemyProvider } from "ethers";

// Contract addresses are used from https://docs.sparkprotocol.io/developers/deployed-contracts/mainnet-addresses
export const baseSparkServiceEthMainNet = new BaseAaveService(
  new AlchemyProvider(
    1, // MAINNET
    process.env.ALCHEMY_API_KEY_ETH_MAINNET
  ),
  Protocol.Spark,
  "0x02C3eA4e34C0cBd694D2adFa2c690EECbC1793eE", //POOL_ADDRESSES_PROVIDER,
  "0xF028c2F4b19898718fD0F77b9b881CbfdAa5e8Bb" //UI_POOL_DATA_PROVIDER
);

// Get all debt tokens supported by protocol
export async function getSupportedDebtTokens(chain: Chain): Promise<Token[]> {
  if (chain === Chain.EthMainNet) {
    return baseSparkServiceEthMainNet.getSupportedDebtTokens();
  } else {
    return [];
  }
}

// get all collateral tokens supported by protocol
export async function getSupportedCollateralTokens(): Promise<Token[]> {
  return baseSparkServiceEthMainNet.getSupportedCollateralTokens();
}

export async function getBorrowRecommendations(
  chain: Chain,
  debtTokens: Token[],
  collaterals: TokenAmount[]
): Promise<RecommendedDebtDetail[]> {
  if (chain === Chain.EthMainNet) {
    return baseSparkServiceEthMainNet.getBorrowRecommendations(
      debtTokens,
      collaterals
    );
  } else {
    return [];
  }
}
