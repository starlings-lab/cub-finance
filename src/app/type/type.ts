import { Address } from "abitype";

export interface SupportedCollateral {
  name: string;
  address: Address;
}

export interface Token {
  address: Address;
  name: string;
  decimals: number;
  symbol: string;
}

export interface TokenAmount {
  token: Token;
  amount: BigInt;
  amountInUSD: number;
}

export interface DebtPositionTableRow {
  protocol: Protocol;
  debtToken: Token[];
  collateralTokens: Token[];
  totalCollateralAmountInUSD: number;
  totalDebtAmountInUSD: number;
  LTV: number; // debtAmountInUSD / sum of collateralAmountInUSD array
  maxLTV: number;
  Trailing30DaysNetAPY: number;
  Trailing30DaysLendingAPY: number;
  Trailing30DaysBorrowingAPY: number;
}

export interface UserDebtDetailsBase {
  protocol: Protocol;
  debtPositions: DebtPosition[];
}

export interface MorphoBlueUserDebtDetails extends UserDebtDetailsBase {
  markets: MorphoBlueMarket[];
}

export interface UserDebtDetails extends UserDebtDetailsBase {
  markets: Market[];
}

export interface DebtPosition {
  debt: TokenAmount[];
  collateral: TokenAmount[];
  LTV: number; // debtAmountInUSD / sum of collateralAmountInUSD array
}

export interface MorphoBlueDebtPosition extends DebtPosition {
  marketId: string; // This is required because there can be two markets with the same collateral token and a debt token.
}

export interface MarketBase {
  maxLTV: number; // the maximum LTV in this market.
  Trailing30DaysLendingAPY: number;
  Trailing30DaysBorrowingAPY: number; // borrowing cost of a debt token or an underling asset.
}

export interface MorphoBlueMarket extends MarketBase {
  marketId: string; // This is required because two markets with the same collateral token and a debt token can have different borrowing APY and maxLTV.
  collateralToken: Token;
  debtToken: Token;
}

export interface Market extends MarketBase {
  underlyingAsset: Token;
  Trailing30DaysLendingAPY: number;
}

export enum Protocol {
  AaveV3 = "AaveV3",
  CompoundV3 = "CompoundV3",
  MorphoBlue = "MorphoBlue",
  Spark = "Spark"
}
