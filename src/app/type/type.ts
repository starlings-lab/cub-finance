import { Address } from "abitype";

export interface Token{
  address: Address;
  name: string;
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
  ltv: BigIntWithDecimals;
  lendingAPY: BigIntWithDecimals;
  borrowingAPY: BigIntWithDecimals;
}
