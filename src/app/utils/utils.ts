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

export function getTokenByAddress(address: string): Token | undefined {
  const tokens: Token[] = [USDC, WETH, COMP, WBTC, UNI, LINK, cbETH, wstETH];
  return tokens.find(
    (token) => ethers.getAddress(token.address) === ethers.getAddress(address)
  );
}
