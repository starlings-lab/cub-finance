import { Address } from "abitype";

export enum Protocol {
  AaveV3 = "AaveV3",
  CompoundV3 = "CompoundV3",
  MorphoBlue = "MorphoBlue",
  Spark = "Spark",
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
  totalDebtAmountInUSD: number;
  totalCollateralAmountInUSD: number;
  LTV: number; // debtAmountInUSD / sum of collateralAmountInUSD array
  maxLTV: number;
  Trailing30DaysNetAPY: number;
  Trailing30DaysLendingAPY: number;
  Trailing30DaysBorrowingAPY: number;
}

export interface UserDebtDetailsBase {
  protocol: Protocol;
  userAddress: Address;
}

export interface MorphoBlueUserDebtDetails extends UserDebtDetailsBase {
  markets: MorphoBlueMarket[];
  debtPositions: MorphoBlueDebtPosition[];
}

export interface CompoundV3UserDebtDetails extends UserDebtDetailsBase {
  markets: CompoundV3Market[];
  debtPositions: CompoundV3DebtPosition[];
}

export interface UserDebtDetails extends UserDebtDetailsBase {
  markets: Market[];
  debtPositions: DebtPosition[];
}

export interface DebtPositionBase {
  maxLTV: number;
  LTV: number; // debtAmountInUSD / sum of collateralAmountInUSD array
}

export interface DebtPosition extends DebtPositionBase {
  debt: TokenAmount[]; // if debt count > 0, the debt position is an aggregate of multiple debt positions.
  collaterals: TokenAmount[];
}

export interface MorphoBlueDebtPosition extends DebtPositionBase {
  marketId: string; // This is required because there can be two markets with the same collateral token and a debt token.
  debt: TokenAmount;
  collateral: TokenAmount;
}

export interface CompoundV3DebtPosition extends DebtPositionBase {
  debt: TokenAmount;
  collaterals: TokenAmount[];
}

export interface MarketBase {
  trailing30DaysBorrowingAPY: number; // borrowing cost of a debt token or an underlying asset.
  trailing30DaysLendingAPY: number;
}

export interface Market extends MarketBase {
  underlyingAsset: Token;
}

// collateral doesn't earn yields in MorphoBlue
export interface MorphoBlueMarket extends MarketBase {
  marketId: string; // This is required because two markets with the same collateral token and a debt token can have different borrowing APY and maxLTV.
  debtToken: Token;
  collateralToken: Token;
}

// collateral doesn't earn yields in Compound V3
export interface CompoundV3Market extends MarketBase {
  debtToken: Token;
  collateralTokens: Token[];
}
