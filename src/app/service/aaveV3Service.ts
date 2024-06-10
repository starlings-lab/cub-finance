import * as markets from "@bgd-labs/aave-address-book";
import { AlchemyProvider } from "ethers";
import { BaseAaveService } from "./BaseAaveService";
import {
  Chain,
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";

export const baseAaveServiceEthMainNet = new BaseAaveService(
  new AlchemyProvider(
    1, // MAINNET
    process.env.ALCHEMY_API_KEY_ETH_MAINNET
  ),
  Protocol.AaveV3,
  markets.AaveV3Ethereum.POOL_ADDRESSES_PROVIDER,
  markets.AaveV3Ethereum.UI_POOL_DATA_PROVIDER
);

export const baseAaveServiceArbMainNet = new BaseAaveService(
  new AlchemyProvider(
    42161, // ARB_MAINNET
    process.env.ALCHEMY_API_KEY_ARB_MAINNET
  ),
  Protocol.AaveV3,
  markets.AaveV3Arbitrum.POOL_ADDRESSES_PROVIDER,
  markets.AaveV3Arbitrum.UI_POOL_DATA_PROVIDER
);

// Get all debt tokens supported by protocol
export async function getSupportedDebtTokens(chain: Chain): Promise<Token[]> {
  return getBaseServiceForChain(chain).getSupportedDebtTokens();
}

// get all collateral tokens supported by protocol
export async function getSupportedCollateralTokens(
  chain: Chain
): Promise<Token[]> {
  return getBaseServiceForChain(chain).getSupportedCollateralTokens();
}

export async function getBorrowRecommendations(
  chain: Chain,
  debtTokens: Token[],
  collaterals: TokenAmount[]
): Promise<RecommendedDebtDetail[]> {
  return getBaseServiceForChain(chain).getBorrowRecommendations(
    debtTokens,
    collaterals
  );
}

function getBaseServiceForChain(chain: Chain) {
  switch (chain) {
    case Chain.EthMainNet:
      return baseAaveServiceEthMainNet;
    case Chain.ArbMainNet:
      return baseAaveServiceArbMainNet;
    default:
      throw new Error(`Chain ${chain} not supported`);
  }
}
