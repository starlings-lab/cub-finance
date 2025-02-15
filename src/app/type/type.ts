import { Address } from "abitype";

export enum Chain {
  EthMainNet = 1,
  ArbMainNet = 42161
}

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

export interface DebtPositionBase {
  maxLTV: number;
  LTV: number; // debtAmountInUSD / sum of collateralAmountInUSD array
  // ((lendingAPY * lendingAmount) - (borrowingAPY * (debtAmount)))/debAmount
  // Positive value means user will earn interest and
  // negative value means user will pay interest.
  trailing30DaysNetBorrowingAPY: number; // negative, 0 or positive
}

export interface DebtPosition extends DebtPositionBase {
  debts: TokenAmount[]; // if debt count > 0, the debt position is an aggregate of multiple debt positions.
  collaterals: TokenAmount[];
  weightedAvgTrailing30DaysLendingAPY: number; // For multiple collateral positions, this is the weighted average = total interest/ total collateral.
  // For multiple collateral positions, this is the weighted average reward APY = total lending reward / total collateral.
  weightedAvgTrailing30DaysLendingRewardAPY: number;
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
  trailing30DaysBorrowingAPY: number; // >=0
  trailing30DaysLendingRewardAPY: number;
  trailing30DaysBorrowingRewardAPY: number;
}

export interface Market extends MarketBase {
  underlyingAsset: Token;
  trailing30DaysLendingAPY: number; // >=0
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
  utilizationRatio: number;
  debtToken: Token;
  collateralTokens: Token[];
}

// Recommendation related types

export interface RecommendedDebtDetailBase {
  protocol: Protocol;
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

export interface CompoundV3RecommendedDebtDetail
  extends RecommendedDebtDetailBase {
  debt: CompoundV3DebtPosition; // The recommended/new debt position
  market: CompoundV3Market; // The market where the debt is recommended
}

export interface RecommendedDebtDetailTableRow {
  protocol: Protocol;
  debts: TokenAmount[];
  debtTokens: Token[];
  collaterals: TokenAmount[];
  collateralTokens: Token[];
  totalDebtAmountInUSD: number;
  totalCollateralAmountInUSD: number;
  LTV: number; // debtAmountInUSD / sum of collateralAmountInUSD array
  maxLTV: number;
  trailing30DaysNetBorrowingAPY: number; // negative, 0 or positive
  trailing30DaysLendingAPY: number; // Lending apy of collateral. weighted average for multiple collateral positions.
  trailing30DaysBorrowingAPY: number; // Borrowing apy of debt token.
  trailing30DaysRewardAPY: number;
}

export interface APYInfo {
  lendingAPY: number;
  lendingRewardAPY: number;
  borrowingAPY: number;
  borrowingRewardAPY: number;
}

export interface BorrowRecommendationTableRow {
  protocol: Protocol;
  debt: TokenAmount;
  debtToken: Token;
  collaterals: TokenAmount[];
  collateralTokens: Token[];
  // negative, 0 or positive
  trailing30DaysNetBorrowingAPY: number;
  maxDebtAmountInUSD: number;
  totalCollateralAmountInUSD: number;
  // Borrowing apy of debt token.
  trailing30DaysBorrowingAPY: number;
  // Lending apy of collateral. weighted average for multiple collateral positions.
  trailing30DaysLendingAPY: number;
  trailing30DaysRewardAPY: number;
  maxLTV: number;
}

export interface TokenDetail {
  token: Token;
  stable: boolean;
}
