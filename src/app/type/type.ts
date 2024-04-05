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

export interface MorphoBlueDebtPosition extends DebtPosition {
  marketId: string; // This is required because there can be two markets with the same collateral token and a debt token.
}

export interface Market {
  Trailing30DaysBorrowingAPY: number; // borrowing cost of a debt token or an underling asset.
  maxLTV: number; // the maximum LTV in this market.
}

export interface MorphoBlueMarket extends Market {
  marketId: string; // This is required because two markets with the same collateral token and a debt token can have different borrowing APY and maxLTV.
  collateralToken: Token;
  debtToken: Token;
}

export interface AaveV3Market extends Market {
  underlyingAsset: Token;
  Trailing30DaysLendingAPY: number;
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
