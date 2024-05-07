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
import { ethers, isAddress } from "ethers";
import { normalize } from "viem/ens";
import { getEnsAddress } from "@wagmi/core";
import { ensConfig } from "../../../src/wagmiConfig";

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

export async function isValidEnsAddress(ensAddress: string): Promise<boolean> {
  let result;
  try {
    result = await getEnsAddress(ensConfig, {
      name: normalize(ensAddress)
    });
  } catch (error) {
    console.error(`Error fetching ENS address: ${error}`);
    return false;
  }
  return isAddress(result);
}

export async function EOAFromENS(address: string): Promise<string | null> {
  const eoaAddress = await getEnsAddress(ensConfig, {
    name: normalize(address)
  });
  return eoaAddress;
}
