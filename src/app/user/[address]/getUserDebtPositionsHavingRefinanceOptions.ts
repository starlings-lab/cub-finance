"use server";
import {
  DebtPositionTableRow,
  RecommendedDebtDetailTableRow
} from "@/app/type/type";
import { getRefinanceRecommendations } from "@/app/service/refiananceRecommendationService";

/**
 * Get all user collaterals that are available in the supported protocols.
 * @param allDebtPositions all debt positions of user
 * @returns map of debt position and refinance options
 */
export async function getUserDebtPositionsHavingRefinanceOptions(
  allDebtPositions: DebtPositionTableRow[]
): Promise<Record<string, RecommendedDebtDetailTableRow[]>> {
  const debtPositionsRefinanceOptions: Record<
    string,
    RecommendedDebtDetailTableRow[]
  > = {};

  await Promise.all(allDebtPositions.map(async (debtPosition) => {
    if (debtPosition?.subRows && debtPosition.subRows!.length > 0) {
      await Promise.all(debtPosition.subRows.map(async (subDebtPosition) => {
        const data = await getRefinanceRecommendations(
          subDebtPosition.protocol,
          subDebtPosition.debtPosition
        );
        debtPositionsRefinanceOptions[subDebtPosition.id] = data;
      }));
    } else {
      const data = await getRefinanceRecommendations(
        debtPosition.protocol,
        debtPosition.debtPosition
      );
      debtPositionsRefinanceOptions[debtPosition.id] = data;
    }
  }));

  return debtPositionsRefinanceOptions;
}
