import { Address } from "abitype";

export enum Protocol {
  AaveV3 = "AaveV3",
  CompoundV3 = "CompoundV3",
  MorphoBlue = "MorphoBlue",
  Spark = "Spark"
}

export interface Token {
  address: Address;
  name: string;
  decimals: number;
  symbol: string;
}

export interface TokenAmount {
  token: Token;
  amount: bigint;
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
  trailing30DaysNetAPY: number;
  trailing30DaysLendingAPY: number;
  trailing30DaysBorrowingAPY: number;
}

export interface UserDebtDetailsBase {
  protocol: Protocol;
  userAddress: Address;
}

export interface UserDebtDetails extends UserDebtDetailsBase {
  markets: Market[];
  debtPositions: DebtPosition[];
}

export interface MorphoBlueUserDebtDetails extends UserDebtDetailsBase {
  markets: MorphoBlueMarket[];
  debtPositions: MorphoBlueDebtPosition[];
}

export interface CompoundV3UserDebtDetails extends UserDebtDetailsBase {
  markets: CompoundV3Market[];
  debtPositions: CompoundV3DebtPosition[];
}

export interface DebtPositionBase {
  maxLTV: number;
  LTV: number; // debtAmountInUSD / sum of collateralAmountInUSD array
  trailing30DaysNetAPY: number;
}

export interface DebtPosition extends DebtPositionBase {
  debts: TokenAmount[]; // if debt count > 0, the debt position is an aggregate of multiple debt positions.
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
}

export interface Market extends MarketBase {
  underlyingAsset: Token;
  trailing30DaysLendingAPY: number;
}

// collateral doesn't earn yields in MorphoBlue
export interface MorphoBlueMarket extends MarketBase {
  marketId: string; // This is required because two markets with the same collateral token and a debt token can have different borrowing APY and maxLTV.
  utilizationRatio: number;
  maxLTV: number;
  debtToken: Token;
  collateralToken: Token;
}

// collateral doesn't earn yields in Compound V3
export interface CompoundV3Market extends MarketBase {
  debtToken: Token;
  collateralTokens: Token[];
}

// Recommendation related types

export interface RecommendedDebtDetailBase {
  protocol: Protocol;
  // ((lendingAPY * lendingAmount) - (borrowingAPY * (debtAmount)))/debAmount
  // Positive value means user will earn interest and
  // negative value means user will pay interest.
  netBorrowingApy: number;
}

// Interface for Aave & Spark
export interface RecommendedDebtDetail extends RecommendedDebtDetailBase {
  debt: DebtPosition; // The recommended/new debt position
  market: Market; // The market where the debt is recommended
}

export interface MorphoBlueRecommendedDebtDetail
  extends RecommendedDebtDetailBase {
  debt: MorphoBlueDebtPosition; // The recommended/new debt position
  market: MorphoBlueMarket; // The market where the debt is recommended
}
