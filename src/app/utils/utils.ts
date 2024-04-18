import { Token } from "../type/type";
import {
  USDC,
  WETH,
  COMP,
  WBTC,
  UNI,
  LINK,
  cbETH,
  wstETH
} from "../contracts/ERC20Tokens";
import { ethers } from "ethers";

export function getTokenByAddress(address: string): Token {
  const tokens: Token[] = [USDC, WETH, COMP, WBTC, UNI, LINK, cbETH, wstETH];
  const foundToken = tokens.find(
    (token) => ethers.getAddress(token.address) === ethers.getAddress(address)
  );
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
