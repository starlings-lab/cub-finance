"use client";
import { getRecommendations } from "@/app/service/refiananceRecommendationService";
import { RecommendedDebtDetailTableRow } from "@/app/type/type";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "./context";
import Loading from "./loading";
import { debtTableColumns, recommendedTableColumns } from "./debtTableColumns";
import { RefiTableWrapper } from "./RefiTableWrapper";

const RecommendationsWrapper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<
    RecommendedDebtDetailTableRow[]
  >([]);

  const state = useContext(StoreContext);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      const data = await getRecommendations(
        state!.activeDebtPosition?.protocol!,
        state!.activeDebtPosition?.debtPosition!
      );
      console.log("Recommendations: ", data);
      setRecommendations(data);
      setIsLoading(false);
    };
    if (state?.activeDebtPosition) {
      fetchRecommendations();
    }
  }, [state]);

  if (!state?.activeDebtPosition) {
    return;
  }

  return (
    <div>
      <div className="mt-3 sm:mt-5 text-3xl sm:text-4xl font-medium tracking-wide">
        Refinance Options
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="max-w-screen-xl mx-auto py-5">
          <RefiTableWrapper
            debtColumns={debtTableColumns}
            activeDebtPositionData={[state?.activeDebtPosition]}
            recommendationsData={recommendations}
            recommendedColumns={recommendedTableColumns}
          />
        </div>
      )}
    </div>
  );
};

export default RecommendationsWrapper;
