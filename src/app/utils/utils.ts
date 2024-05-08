import { Address } from "abitype";
import { Token } from "../type/type";
import {
  USDC,
  DAI,
  USDT,
  PYUSD,
  USDA,
  LUSD,
  crvUSD,
  WETH,
  COMP,
  WBTC,
  UNI,
  LINK,
  cbETH,
  wstETH
} from "../contracts/ERC20Tokens";
import { ethers } from "ethers";

export function getTokenByAddress(address: string | Address): Token {
  const tokens: Token[] = [
    USDC,
    DAI,
    USDT,
    PYUSD,
    USDA,
    LUSD,
    crvUSD,
    WETH,
    COMP,
    WBTC,
    UNI,
    LINK,
    cbETH,
    wstETH
  ];
  const foundToken = tokens.find((token) => {
    return ethers.getAddress(token.address) === ethers.getAddress(address);
  });
  if (!foundToken) {
    throw new Error(`Token not found for address: ${address}`);
  }
  return foundToken;
}

export function calculateAPYFromAPR(aprDecimal: number) {
  const secondsPerYear = 365 * 24 * 60 * 60; // 86,400 seconds/day * 365 days/year
  const apyDecimal =
    Math.pow(1 + aprDecimal / secondsPerYear, secondsPerYear) - 1;
  return apyDecimal;
}

export function isZeroOrPositive(num: number): num is number {
  return num >= 0;
}

export function isZeroOrNegative(num: number): num is number {
  return num <= 0;
}

export function getUniqueTokens(tokens: Token[]): Token[] {
  const uniqueTokens: Map<string, Token> = new Map();
  tokens.forEach((token) => {
    const address = token.address.toLowerCase();
    if (uniqueTokens.has(address)) {
      return;
    }

    uniqueTokens.set(address, token);
  });

  return Array.from(uniqueTokens.values());
}

export function getFormattedTokenAmount(token: Token, amount: bigint): string {
  const amountFormatted = Number(ethers.formatUnits(amount, token.decimals));
  const preciseAmount = amountFormatted.toFixed(amountFormatted > 1 ? 2 : 6);
  return preciseAmount.toString();
}
