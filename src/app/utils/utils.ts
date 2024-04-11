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
