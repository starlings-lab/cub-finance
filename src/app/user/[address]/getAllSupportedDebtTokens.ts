"use server";

import { getSupportedDebtTokens as getAaveSupportedDebtTokens } from "@/app/service/aaveV3Service";
import { getSupportedDebtTokens as getSparkSupportedDebtTokens } from "@/app/service/sparkService";
import { getSupportedDebtTokens as getCompoundV3SupportedDebtTokens } from "@/app/service/compoundV3Service";
import { getSupportedDebtTokens as getMorphoBlueSupportedDebtTokens } from "@/app/service/morphoBlueService";
import { Token, TokenDetail } from "@/app/type/type";
import {
  SUPPORTED_DEBT_STABLECOINS,
  USDC_DUPLICATE_OR_SCAM
} from "@/app/contracts/ERC20Tokens";

export async function getAllSupportedDebtTokens(): Promise<TokenDetail[]> {
  // Call all protocol services to get supported debt tokens
  return Promise.all([
    getAaveSupportedDebtTokens(),
    getSparkSupportedDebtTokens(),
    getCompoundV3SupportedDebtTokens(),
    getMorphoBlueSupportedDebtTokens()
  ]).then((results) => {
    const allSupportedDebtTokens: Map<string, TokenDetail> = new Map();

    // Filter out null debt positions
    results.forEach((result: Token[]) => {
      if (result && result.length > 0) {
        result.forEach((token) => {
          const address = token.address.toLowerCase();
          if (
            allSupportedDebtTokens.has(address) ||
            address === USDC_DUPLICATE_OR_SCAM
          ) {
            return;
          }

          allSupportedDebtTokens.set(address, {
            token,
            stable: SUPPORTED_DEBT_STABLECOINS.some(
              (stableCoin) => stableCoin.address.toLowerCase() === address
            )
          });
        });
      }
    });

    return Array.from(allSupportedDebtTokens.values());
  });
}
