"use server";

import {
  CompoundV3DebtPosition,
  CompoundV3RecommendedDebtDetail,
  DebtPosition,
  MorphoBlueDebtPosition,
  MorphoBlueRecommendedDebtDetail,
  Protocol,
  RecommendedDebtDetail
} from "../type/type";
import { getRecommendedDebtDetail as getAaveRecommendedDebtDetail } from "./aaveV3Service";
import { getRecommendedDebtDetail as getSparkRecommendedDebtDetail } from "./sparkService";
import { getRecommendedDebtDetail as getCompoundRecommendedDebtDetail } from "./compoundV3Service";
import { getRecommendedDebtDetail as getMorphoRecommendedDebtDetail } from "./morphoBlueService";

export async function getRecommendations(
  existingProtocol: Protocol,
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition,
  maxLTVTolerance = 0.1, // default 10%
  borrowingAPYTolerance = 0.01 // default 1%
): Promise<
  (
    | RecommendedDebtDetail
    | MorphoBlueRecommendedDebtDetail
    | CompoundV3RecommendedDebtDetail
  )[]
> {
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
      debtPosition
      // maxLTVTolerance,
      // borrowingAPYTolerance
    ),
    getMorphoRecommendedDebtDetail(
      existingProtocol,
      debtPosition
      // maxLTVTolerance,
      // borrowingAPYTolerance
    )
  ]).then((recommendationResults) => {
    const allRecommendations: (
      | RecommendedDebtDetail
      | MorphoBlueRecommendedDebtDetail
      | CompoundV3RecommendedDebtDetail
    )[] = [];

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

    return allRecommendations;
  });
}
