import React, { Suspense } from "react";
import Loading from "./loading";
import DebtTableWrapper from "./DebtTableWrapper";
import RecommendationsWrapper from "./RecommendationsWrapper";

const RefinanceOptions = ({ userAddress }: { userAddress: string }) => {
  return (
    <div>
      <div className="sm:pt-5">
        <Suspense fallback={<Loading />}>
          <DebtTableWrapper userAddress={userAddress} />
        </Suspense>
      </div>
      <div className="pt-2 sm:pt-5">
        <Suspense fallback={<Loading />}>
          <RecommendationsWrapper />
        </Suspense>
      </div>
    </div>
  );
};

export default RefinanceOptions;
