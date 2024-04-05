import { Address } from "abitype";

export interface Token {
  address: Address;
  decimals: number;
  symbol: string;
}

export interface DebtPosition {
  marketId: string;
  collateralTokens: Token[];
  debtToken: Token;
  collateralAmount: BigInt;
  borrowAmount: BigInt;
  LTV: number; // borrowAmount / collateralAmount
}

export interface Market {
  marketId: string;
  supportedCollateralTokens: Token[];
  maxLTV: number;
  lendingAPY: number;
  borrowingAPY: number;
}
