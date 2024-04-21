"use client";
import { getRecommendations } from "@/app/service/refiananceRecommendationService";
import { Protocol } from "@/app/type/type";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "./context";
import Loading from "./loading";

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
      // const data = await getRecommendations(
      //   activeDebtPosition?.protocol,
      //   activeDebtPosition?.debtPositions?.[0]
      // );

      //   setRecommendations(data);
    };
    if (state?.activeDebtPosition) {
      fetchRecommendations();
    }
  }, [state?.activeDebtPosition]);

  if (!state?.activeDebtPosition) {
    return;
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="max-w-screen-xl mx-auto py-2">Show recommendation data</div>
  );
};

export default RecommendationsWrapper;
