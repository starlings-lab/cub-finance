"use server";

import {
  CompoundV3DebtPosition,
  CompoundV3RecommendedDebtDetail,
  DebtPosition,
  MorphoBlueDebtPosition,
  MorphoBlueRecommendedDebtDetail,
  Protocol,
  RecommendedDebtDetail,
  RecommendedDebtDetailTableRow
} from "../type/type";
import { getRecommendedDebtDetail as getAaveRecommendedDebtDetail } from "./aaveV3Service";
import { getRecommendedDebtDetail as getSparkRecommendedDebtDetail } from "./sparkService";
import { getRecommendedDebtDetail as getCompoundRecommendedDebtDetail } from "./compoundV3Service";
import { getRecommendedDebtDetail as getMorphoRecommendedDebtDetail } from "./morphoBlueService";

export async function getRefinanceRecommendations(
  existingProtocol: Protocol,
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition,
  maxLTVTolerance = 0.1, // default 10%
  borrowingAPYTolerance = 0.01 // default 1%
): Promise<RecommendedDebtDetailTableRow[]> {
  // Call all protocol services to get debt recommendations
  return await Promise.all([
    getAaveRecommendedDebtDetail(
      existingProtocol,
      debtPosition,
      maxLTVTolerance,
      borrowingAPYTolerance
    ),
    getSparkRecommendedDebtDetail(
      existingProtocol,
      debtPosition,
      maxLTVTolerance,
      borrowingAPYTolerance
    ),
    getCompoundRecommendedDebtDetail(
      existingProtocol,
      debtPosition,
      maxLTVTolerance,
      borrowingAPYTolerance
    ),
    getMorphoRecommendedDebtDetail(
      existingProtocol,
      debtPosition,
      maxLTVTolerance,
      borrowingAPYTolerance
    )
  ])
    .then((recommendationResults) => {
      const allRecommendations: (
        | RecommendedDebtDetail
        | MorphoBlueRecommendedDebtDetail
        | CompoundV3RecommendedDebtDetail
      )[] = [];

      const allRecommendationsConverted: RecommendedDebtDetailTableRow[] = [];

      // Filter out null recommendations
      recommendationResults
        .filter((recommendationResult) => recommendationResult !== null)
        .forEach((recommendationResult) => {
          // if recommendation is an array, add all elements to allRecommendations
          if (Array.isArray(recommendationResult)) {
            recommendationResult.forEach((r) => allRecommendations.push(r));
          } else {
            allRecommendations.push(
              recommendationResult as RecommendedDebtDetail
            );
          }
        });

      allRecommendations.forEach((result) => {
        if (result) {
          switch (result.protocol) {
            case Protocol.AaveV3:
            case Protocol.Spark:
              allRecommendationsConverted.push(
                ...convertAaveOrSparkRecommendedDebtDetail(
                  result as RecommendedDebtDetail
                )
              );
              break;
            case Protocol.CompoundV3:
              allRecommendationsConverted.push(
                ...convertCompoundRecommendedDebtDetail(
                  result as CompoundV3RecommendedDebtDetail
                )
              );
              break;
            case Protocol.MorphoBlue:
              allRecommendationsConverted.push(
                ...convertMorphoRecommendedDebtDetail(
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
      console.error("Error fetching recommendations: ", error);
      return [];
    });
}

function convertAaveOrSparkRecommendedDebtDetail(
  userRecommendedDebtDetail: RecommendedDebtDetail
): RecommendedDebtDetailTableRow[] {
  return [
    {
      protocol: userRecommendedDebtDetail.protocol,
      debtToken: userRecommendedDebtDetail.debt.debts.map((debt) => debt.token),
      collateralTokens: userRecommendedDebtDetail.debt.collaterals.map(
        (collateral) => collateral.token
      ),
      totalDebtAmountInUSD: userRecommendedDebtDetail.debt.debts.reduce(
        (sum, debt) => sum + debt.amountInUSD,
        0
      ),
      totalCollateralAmountInUSD:
        userRecommendedDebtDetail.debt.collaterals.reduce(
          (sum, collateral) => sum + collateral.amountInUSD,
          0
        ),
      LTV: userRecommendedDebtDetail.debt.LTV,
      maxLTV: userRecommendedDebtDetail.debt.maxLTV,
      trailing30DaysNetBorrowingAPY:
        userRecommendedDebtDetail.debt.trailing30DaysNetBorrowingAPY,
      trailing30DaysLendingAPY:
        userRecommendedDebtDetail.debt.weightedAvgTrailing30DaysLendingAPY,
      trailing30DaysBorrowingAPY:
        userRecommendedDebtDetail.market.trailing30DaysBorrowingAPY,
      trailing30DaysRewardAPY:
        userRecommendedDebtDetail.market.trailing30DaysBorrowingRewardAPY +
        userRecommendedDebtDetail.debt.weightedAvgTrailing30DaysLendingRewardAPY
    }
  ];
}

function convertCompoundRecommendedDebtDetail(
  userRecommendedDebtDetail: CompoundV3RecommendedDebtDetail
): RecommendedDebtDetailTableRow[] {
  return [
    {
      protocol: userRecommendedDebtDetail.protocol,
      debtToken: [userRecommendedDebtDetail.debt.debt.token],
      collateralTokens: userRecommendedDebtDetail.debt.collaterals.map(
        (collateral) => collateral.token
      ),
      totalDebtAmountInUSD: userRecommendedDebtDetail.debt.debt.amountInUSD,
      totalCollateralAmountInUSD:
        userRecommendedDebtDetail.debt.collaterals.reduce(
          (sum, collateral) => sum + collateral.amountInUSD,
          0
        ),
      LTV: userRecommendedDebtDetail.debt.LTV,
      maxLTV: userRecommendedDebtDetail.debt.maxLTV,
      trailing30DaysNetBorrowingAPY:
        userRecommendedDebtDetail.debt.trailing30DaysNetBorrowingAPY,
      trailing30DaysLendingAPY: 0,
      trailing30DaysBorrowingAPY:
        userRecommendedDebtDetail.market.trailing30DaysBorrowingAPY,
      trailing30DaysRewardAPY:
        userRecommendedDebtDetail.market.trailing30DaysBorrowingRewardAPY
    }
  ];
}

function convertMorphoRecommendedDebtDetail(
  userRecommendedDebtDetail: MorphoBlueRecommendedDebtDetail
): RecommendedDebtDetailTableRow[] {
  return [
    {
      protocol: userRecommendedDebtDetail.protocol,
      debtToken: [userRecommendedDebtDetail.debt.debt.token],
      collateralTokens: [userRecommendedDebtDetail.debt.collateral.token],
      totalDebtAmountInUSD: userRecommendedDebtDetail.debt.debt.amountInUSD,
      totalCollateralAmountInUSD:
        userRecommendedDebtDetail.debt.collateral.amountInUSD,
      LTV: userRecommendedDebtDetail.debt.LTV,
      maxLTV: userRecommendedDebtDetail.debt.maxLTV,
      trailing30DaysNetBorrowingAPY:
        userRecommendedDebtDetail.debt.trailing30DaysNetBorrowingAPY,
      trailing30DaysLendingAPY: 0,
      trailing30DaysBorrowingAPY:
        userRecommendedDebtDetail.market.trailing30DaysBorrowingAPY,
      trailing30DaysRewardAPY:
        userRecommendedDebtDetail.market.trailing30DaysBorrowingRewardAPY
    }
  ];
}
