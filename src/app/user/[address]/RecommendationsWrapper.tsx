"use client";
import { getRecommendations } from "@/app/service/refiananceRecommendationService";
import { Protocol } from "@/app/type/type";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "./context";
import Loading from "./loading";
import { DataTable } from "@/components/ui/data-table";
import { debtTableColumns } from "./debtTableColumns";
import { RefiTableWrapper } from "./RefiTableWrapper";

const RecommendationsWrapper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const state = useContext(StoreContext);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 4000);

      // TODO: check here why this call is failing
      const data = await getRecommendations(
        state!.activeDebtPosition?.protocol!,
        state!.activeDebtPosition?.debtPosition!
      );
      console.log("Recommendations: ", data);
      // setRecommendations(data);
    };
    if (state?.activeDebtPosition) {
      fetchRecommendations();
    }
  }, [state?.activeDebtPosition]);

  if (!state?.activeDebtPosition) {
    return;
  }

  return (
    <div>
      <div className="mt-5 text-4xl font-medium tracking-wide">
        Refinance Options
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="max-w-screen-xl mx-auto py-5">
          <RefiTableWrapper
            columns={debtTableColumns}
            data={[state?.activeDebtPosition]}
          />
        </div>
      )}
    </div>
  );
};

export default RecommendationsWrapper;
