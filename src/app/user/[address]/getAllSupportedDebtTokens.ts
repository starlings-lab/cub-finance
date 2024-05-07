import { getSupportedDebtTokens as getAaveSupportedDebtTokens } from "@/app/service/aaveV3Service";
import { getSupportedDebtTokens as getSparkSupportedDebtTokens } from "@/app/service/sparkService";
import { getSupportedDebtTokens as getCompoundV3SupportedDebtTokens } from "@/app/service/compoundV3Service";
import { getSupportedDebtTokens as getMorphoBlueSupportedDebtTokens } from "@/app/service/morphoBlueService";
import { Token } from "@/app/type/type";

// this token seems like scam or test token in morpho blue market with same name as USDC
const USDC_DUPLICATE_OR_SCAM =
  "0xcbfb9B444d9735C345Df3A0F66cd89bD741692E9".toLowerCase();

export async function getAllSupportedDebtTokens() {
  // Call all protocol services to get supported debt tokens
  return Promise.all([
    getAaveSupportedDebtTokens(),
    getSparkSupportedDebtTokens(),
    getCompoundV3SupportedDebtTokens(),
    getMorphoBlueSupportedDebtTokens()
  ]).then((results) => {
    const allSupportedDebtTokens: Map<string, Token> = new Map();

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
          allSupportedDebtTokens.set(address, token);
        });
      }
    });

    return Array.from(allSupportedDebtTokens.values());
  });
}
