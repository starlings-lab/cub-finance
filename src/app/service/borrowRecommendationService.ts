"use server";

import {
  BorrowRecommendationTableRow,
  CompoundV3RecommendedDebtDetail,
  MorphoBlueRecommendedDebtDetail,
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";
import { getBorrowRecommendations as getAaveBorrowRecommendations } from "./aaveV3Service";
import { getBorrowRecommendations as getSparkBorrowRecommendations } from "./sparkService";
import { getBorrowRecommendations as getCompoundBorrowRecommendations } from "./compoundV3Service";
import { getBorrowRecommendations as getMorphoBorrowRecommendations } from "./morphoBlueService";

/**
 * Provides borrow recommendations by aggregating all borrow recommendations from supported protocols
 * @param debtTokens
 * @param collaterals
 * @returns
 */
export async function getBorrowRecommendations(
  debtTokens: Token[],
  collaterals: TokenAmount[]
): Promise<BorrowRecommendationTableRow[]> {
  // Call all protocol services to get debt recommendations
  return await Promise.all([
    getAaveBorrowRecommendations(debtTokens, collaterals),
    getSparkBorrowRecommendations(debtTokens, collaterals),
    getCompoundBorrowRecommendations(debtTokens, collaterals),
    getMorphoBorrowRecommendations(debtTokens, collaterals)
  ])
    .then((recommendationResults) => {
      const allRecommendations: (
        | RecommendedDebtDetail
        | MorphoBlueRecommendedDebtDetail
        | CompoundV3RecommendedDebtDetail
      )[] = [];

      const allRecommendationsConverted: BorrowRecommendationTableRow[] = [];

      // Filter out null or empty recommendations
      recommendationResults
        .filter(
          (recommendationResult) =>
            recommendationResult !== null && recommendationResult.length > 0
        )
        .forEach((recommendationResult) => {
          recommendationResult.forEach((r) => allRecommendations.push(r));
        });

      allRecommendations.forEach((result) => {
        if (result) {
          switch (result.protocol) {
            case Protocol.AaveV3:
            case Protocol.Spark:
              allRecommendationsConverted.push(
                convertAaveOrSparkBorrowRecommendation(
                  result as RecommendedDebtDetail
                )
              );
              break;
            case Protocol.CompoundV3:
              allRecommendationsConverted.push(
                convertCompoundBorrowRecommendation(
                  result as CompoundV3RecommendedDebtDetail
                )
              );
              break;
            case Protocol.MorphoBlue:
              allRecommendationsConverted.push(
                convertMorphoRecommendedDebtDetail(
                  result as MorphoBlueRecommendedDebtDetail
                )
              );
              break;
          }
        }
      });

      return allRecommendationsConverted;
    })
    .catch((error) => {
      console.error("Error fetching borrow recommendations: ", error);
      throw error;
    });
}

function convertAaveOrSparkBorrowRecommendation(
  borrowRecommendation: RecommendedDebtDetail
): BorrowRecommendationTableRow {
  const tableRow: BorrowRecommendationTableRow = {
    protocol: borrowRecommendation.protocol,
    debtToken: borrowRecommendation.debt.debts[0].token,
    collateralTokens: borrowRecommendation.debt.collaterals.map(
      (collateral) => collateral.token
    ),
    maxDebtAmountInUSD: borrowRecommendation.debt.debts.reduce(
      (sum, debt) => sum + debt.amountInUSD,
      0
    ),
    totalCollateralAmountInUSD: borrowRecommendation.debt.collaterals.reduce(
      (sum, collateral) => sum + collateral.amountInUSD,
      0
    ),
    maxLTV: borrowRecommendation.debt.maxLTV,
    trailing30DaysNetBorrowingAPY:
      borrowRecommendation.debt.trailing30DaysNetBorrowingAPY,
    trailing30DaysLendingAPY:
      borrowRecommendation.debt.weightedAvgTrailing30DaysLendingAPY,
    trailing30DaysBorrowingAPY:
      borrowRecommendation.market.trailing30DaysBorrowingAPY,
    trailing30DaysRewardAPY:
      borrowRecommendation.market.trailing30DaysBorrowingRewardAPY +
      borrowRecommendation.debt.weightedAvgTrailing30DaysLendingRewardAPY
  };

  return tableRow;
}

function convertCompoundBorrowRecommendation(
  borrowRecommendation: CompoundV3RecommendedDebtDetail
): BorrowRecommendationTableRow {
  const tableRow: BorrowRecommendationTableRow = {
    protocol: borrowRecommendation.protocol,
    debtToken: borrowRecommendation.debt.debt.token,
    collateralTokens: borrowRecommendation.debt.collaterals.map(
      (collateral) => collateral.token
    ),
    maxDebtAmountInUSD: borrowRecommendation.debt.debt.amountInUSD,
    totalCollateralAmountInUSD: borrowRecommendation.debt.collaterals.reduce(
      (sum, collateral) => sum + collateral.amountInUSD,
      0
    ),
    maxLTV: borrowRecommendation.debt.maxLTV,
    trailing30DaysNetBorrowingAPY:
      borrowRecommendation.debt.trailing30DaysNetBorrowingAPY,
    trailing30DaysLendingAPY: 0,
    trailing30DaysBorrowingAPY:
      borrowRecommendation.market.trailing30DaysBorrowingAPY,
    trailing30DaysRewardAPY:
      borrowRecommendation.market.trailing30DaysBorrowingRewardAPY
  };

  return tableRow;
}

function convertMorphoRecommendedDebtDetail(
  borrowRecommendation: MorphoBlueRecommendedDebtDetail
): BorrowRecommendationTableRow {
  const tableRow: BorrowRecommendationTableRow = {
    protocol: borrowRecommendation.protocol,
    debtToken: borrowRecommendation.debt.debt.token,
    collateralTokens: [borrowRecommendation.debt.collateral.token],
    maxDebtAmountInUSD: borrowRecommendation.debt.debt.amountInUSD,
    totalCollateralAmountInUSD:
      borrowRecommendation.debt.collateral.amountInUSD,
    maxLTV: borrowRecommendation.debt.maxLTV,
    trailing30DaysNetBorrowingAPY:
      borrowRecommendation.debt.trailing30DaysNetBorrowingAPY,
    trailing30DaysLendingAPY: 0,
    trailing30DaysBorrowingAPY:
      borrowRecommendation.market.trailing30DaysBorrowingAPY,
    trailing30DaysRewardAPY:
      borrowRecommendation.market.trailing30DaysBorrowingRewardAPY
  };

  return tableRow;
}
