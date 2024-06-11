"use server";

import { getSupportedDebtTokens as getAaveSupportedDebtTokens } from "@/app/service/aaveV3Service";
import { getSupportedDebtTokens as getSparkSupportedDebtTokens } from "@/app/service/sparkService";
import { getSupportedDebtTokens as getCompoundV3SupportedDebtTokens } from "@/app/service/compoundV3Service";
import { getSupportedDebtTokens as getMorphoBlueSupportedDebtTokens } from "@/app/service/morphoBlueService";
import { Chain, Token, TokenDetail } from "@/app/type/type";
import {
  DAI,
  SUPPORTED_DEBT_STABLECOINS_ETH_MAINNET,
  USDC,
  USDC_DUPLICATE_OR_SCAM,
  USDT,
  WBTC,
  WETH,
  weETH,
  rETH,
  LINK,
  USDC_ARB,
  USDT_ARB,
  DAI_ARB,
  WETH_ARB,
  WBTC_ARB,
  weETH_ARB,
  rETH_ARB,
  LINK_ARB,
  USDC_BRIDGED_ARB,
  FRAX_ARB,
  SUPPORTED_DEBT_STABLECOINS_ARB_MAINNET
} from "@/app/contracts/ERC20Tokens";

const ETH_MAINNET_SUPPORTED_DEBT_TOKENS = [
  {
    token: USDC,
    stable: true
  },
  {
    token: USDT,
    stable: true
  },
  {
    token: DAI,
    stable: true
  },
  {
    token: WETH,
    stable: false
  },
  {
    token: WBTC,
    stable: false
  },
  {
    token: weETH,
    stable: false
  },
  {
    token: rETH,
    stable: false
  },
  {
    token: LINK,
    stable: false
  }
];

const ARB_MAINNET_SUPPORTED_DEBT_TOKENS = [
  {
    token: USDC_ARB,
    stable: true
  },
  {
    token: USDT_ARB,
    stable: true
  },
  {
    token: DAI_ARB,
    stable: true
  },
  {
    token: USDC_BRIDGED_ARB,
    stable: true
  },
  {
    token: FRAX_ARB,
    stable: true
  },
  {
    token: WETH_ARB,
    stable: false
  },
  {
    token: WBTC_ARB,
    stable: false
  },
  {
    token: weETH_ARB,
    stable: false
  },
  {
    token: rETH_ARB,
    stable: false
  },
  {
    token: LINK_ARB,
    stable: false
  }
];

export async function getAllSupportedDebtTokens(
  chain: Chain
): Promise<TokenDetail[]> {
  if (chain === Chain.EthMainNet) {
    return ETH_MAINNET_SUPPORTED_DEBT_TOKENS;
  } else if (chain === Chain.ArbMainNet) {
    return ARB_MAINNET_SUPPORTED_DEBT_TOKENS;
  } else {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  // Call all protocol services to get supported debt tokens
  return Promise.all([
    getAaveSupportedDebtTokens(chain),
    getSparkSupportedDebtTokens(chain),
    getCompoundV3SupportedDebtTokens(chain),
    getMorphoBlueSupportedDebtTokens(chain)
  ]).then((results) => {
    const supportedDebtStablecoins =
      chain === Chain.EthMainNet
        ? SUPPORTED_DEBT_STABLECOINS_ETH_MAINNET
        : SUPPORTED_DEBT_STABLECOINS_ARB_MAINNET;

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
            stable: supportedDebtStablecoins.some(
              (stableCoin) => stableCoin.address.toLowerCase() === address
            )
          });
        });
      }
    });

    return Array.from(allSupportedDebtTokens.values());
  });
}
