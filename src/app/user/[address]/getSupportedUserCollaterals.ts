"use server";

import { getSupportedCollateralTokens as getAaveSupportedCollateralTokens } from "@/app/service/aaveV3Service";
import { getSupportedCollateralTokens as getSparkSupportedCollateralTokens } from "@/app/service/sparkService";
import { getSupportedCollateralTokens as getCompoundV3SupportedCOllateralTokens } from "@/app/service/compoundV3Service";
import { getSupportedCollateralTokens as getMorphoBlueSupportedCollateralTokens } from "@/app/service/morphoBlueService";
import { Token, TokenAmount } from "@/app/type/type";
import {
  AAVE,
  COMP,
  DAI,
  LINK,
  UNI,
  USDC,
  USDC_DUPLICATE_OR_SCAM,
  USDT,
  USDe,
  WBTC,
  WETH,
  cbETH,
  rETH,
  sDAI,
  sUSDe,
  weETH,
  wstETH
} from "@/app/contracts/ERC20Tokens";
import { Address } from "abitype";
import { getTokenHoldings } from "@/app/service/tokenService";

const supportedCollateralTokens: Token[] = [
  USDC,
  USDT,
  DAI,
  sDAI,
  USDe,
  sUSDe,
  WETH,
  WBTC,
  wstETH,
  rETH,
  cbETH,
  weETH,
  LINK,
  AAVE,
  COMP,
  UNI
];

// This function should be used until we fix borrow recommendation performance
export async function getSupportedUserCollaterals(
  userAddress: Address
): Promise<TokenAmount[]> {
  return getTokenHoldings(userAddress).then((userHoldings) => {
    if (!userHoldings || userHoldings.length === 0) {
      return [];
    }

    const allSupportedCollaterals: Map<string, TokenAmount> = new Map();
    userHoldings.forEach((userHolding) => {
      const address = userHolding.token.address.toLowerCase();
      if (
        supportedCollateralTokens.some(
          (token) => token.address.toLowerCase() === address
        )
      ) {
        allSupportedCollaterals.set(address, userHolding);
      }
    });

    return Array.from(allSupportedCollaterals.values());
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
  return getTokenHoldings(userAddress).then((userHoldings) => {
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
