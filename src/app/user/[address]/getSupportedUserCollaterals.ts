"use server";

import { getSupportedCollateralTokens as getAaveSupportedCollateralTokens } from "@/app/service/aaveV3Service";
import { getSupportedCollateralTokens as getSparkSupportedCollateralTokens } from "@/app/service/sparkService";
import { getSupportedCollateralTokens as getCompoundV3SupportedCOllateralTokens } from "@/app/service/compoundV3Service";
import { getSupportedCollateralTokens as getMorphoBlueSupportedCollateralTokens } from "@/app/service/morphoBlueService";
import { Token, TokenAmount } from "@/app/type/type";
import { USDC_DUPLICATE_OR_SCAM } from "@/app/contracts/ERC20Tokens";
import { Address } from "abitype";
import { getSupportedTokenHoldings } from "@/app/service/tokenService";

// This function should be used until we fix borrow recommendation performance
export async function getSupportedUserCollaterals(
  userAddress: Address
): Promise<TokenAmount[]> {
  const MIN_TOKEN_AMOUNT_IN_USD = 100;

  return getSupportedTokenHoldings(userAddress).then((userHoldings) => {
    if (!userHoldings || userHoldings.length === 0) {
      return [];
    }

    const allSupportedCollaterals: Map<string, TokenAmount> = new Map();
    userHoldings.forEach((userHolding) => {
      const address = userHolding.token.address.toLowerCase();
      if (userHolding.amountInUSD > MIN_TOKEN_AMOUNT_IN_USD) {
        allSupportedCollaterals.set(address, userHolding);
      }
    });

    const supportedCollaterals = Array.from(allSupportedCollaterals.values());
    // console.log("supportedCollaterals", supportedCollaterals);

    return supportedCollaterals;
  });
}

/**
 * Get all user collaterals that are available in the supported protocols.
 * @param userAddress User address
 * @returns List of supported collaterals
 * @Remarks This function should not be used until we fix borrow recommendation performance
 */
export async function getSupportedUserCollaterals_Old(
  userAddress: Address
): Promise<TokenAmount[]> {
  return getSupportedTokenHoldings(userAddress).then((userHoldings) => {
    // console.log("userHoldings", userHoldings);

    if (!userHoldings || userHoldings.length === 0) {
      return [];
    }

    return Promise.all([
      getAaveSupportedCollateralTokens(),
      getSparkSupportedCollateralTokens(),
      getCompoundV3SupportedCOllateralTokens(),
      getMorphoBlueSupportedCollateralTokens()
    ]).then((results) => {
      const allSupportedCollateralTokens: Map<string, Token> = new Map();

      // Filter out null results and duplicate tokens
      results.forEach((result: Token[]) => {
        if (result && result.length > 0) {
          result.forEach((token) => {
            const address = token.address.toLowerCase();
            if (
              allSupportedCollateralTokens.has(address) ||
              address === USDC_DUPLICATE_OR_SCAM
            ) {
              return;
            }

            allSupportedCollateralTokens.set(address, token);
          });
        }
      });

      // Filter out user holdings that are not supported as collateral
      const allSupportedCollaterals: Map<string, TokenAmount> = new Map();
      userHoldings.forEach((userHolding) => {
        const address = userHolding.token.address.toLowerCase();
        if (allSupportedCollateralTokens.has(address)) {
          allSupportedCollaterals.set(address, userHolding);
        }
      });

      return Array.from(allSupportedCollaterals.values());
    });
  });
}
