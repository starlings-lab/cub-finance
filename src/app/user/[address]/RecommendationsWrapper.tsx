"use client";
import { getRecommendations } from "@/app/service/refiananceRecommendationService";
import { RecommendedDebtDetailTableRow } from "@/app/type/type";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "./context";
import Loading from "./loading";
import {
  debtTableColumns,
  maxLTVColumnId,
  recommendedTableColumns,
  totalDebtAmountInUSDColumnId,
  trailing30DaysBorrowingAPYColumnId,
  trailing30DaysLendingAPYColumnId,
  trailing30DaysNetBorrowingAPYColumnId
} from "./debtTableColumns";
import { RefiTableWrapper } from "./RefiTableWrapper";
import { ColumnSort } from "@tanstack/react-table";

// Sort debts by descending order of trailing30DaysNetBorrowingAPY and descending order of totalDebtAmountInUSD
const initialSortedColumns: ColumnSort[] = [
  {
    id: trailing30DaysNetBorrowingAPYColumnId,
    // We want to display the highest APY first,
    // because positive APY means the user is earning interest for borrowing.
    // And negative APY means the user is paying interest.
    desc: true
  },
  {
    id: totalDebtAmountInUSDColumnId,
    // We want to display the highest debt amount first.
    desc: true
  },
  {
    id: trailing30DaysBorrowingAPYColumnId,
    desc: false
  },
  {
    id: trailing30DaysLendingAPYColumnId,
    desc: false
  },
  {
    id: maxLTVColumnId,
    desc: false
  }
];

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
      setRecommendations(data ?? []);
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
            initialSortedColumns={initialSortedColumns}
          />
        </div>
      )}
    </div>
  );
};

export default RecommendationsWrapper;
