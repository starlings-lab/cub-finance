import { Address } from "abitype";

export interface Token {
  address: Address;
  decimals: number;
  symbol: string;
}

export interface DebtPosition {
  collateralTokens: Token[];
  debtToken: Token;
  collateralAmount: BigInt;
  debtAmount: BigInt;
  LTV: number; // debtAmount / collateralAmount
}

export interface Market {
  underlyingAsset: Token;
  Trailing30DaysBorrowingAPY: number; // borrowing cost of an underlying asset
  Trailing30DaysLendingAPY: number; // yields from an underlying asset
  maxLTV: number; // the maximum LTV when an underlying asset is used as collateral
}

export interface Protocol {
  name: string;
  supportedDebtTokens: Token[];
  supportedCollateralTokens: Token[];
}

export interface ILendingMarketService {
  getProtocol(): Promise<Protocol>;
  getMarkets(): Promise<Market[]>;
  getUserDebtPositions(userAddress: Address): Promise<DebtPosition[]>;
}
