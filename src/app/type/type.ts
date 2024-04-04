import { Address } from "abitype";

export interface Token {
  address: Address;
  symbol: string;
  decimals: number;
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
  LTV: BigIntWithDecimals; // borrowAmount / collateralAmount
}

export interface Market {
  marketId: string;
  collateralToken: Token[];
  debtToken: Token;
  maxLTV: BigIntWithDecimals;
  lendingAPY: BigIntWithDecimals;
  borrowingAPY: BigIntWithDecimals;
}
