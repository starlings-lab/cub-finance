import { Address } from "abitype";

export interface Token {
  address: Address;
  decimals: number;
  symbol: string;
}

export interface BigIntWithDecimals {
  value: BigInt;
  decimals: number;
}

export interface DebtPosition {
  marketId: string;
  collateralToken: Token[];
  debtToken: Token;
  collateralAmount: BigInt;
  borrowAmount: BigInt;
  LTV: number; // borrowAmount / collateralAmount
}

export interface Market {
  marketId: string;
  collateralToken: Token[];
  debtToken: Token;
  maxLTV: BigIntWithDecimals;
  lendingAPY: number;
  borrowingAPY: number;
}
