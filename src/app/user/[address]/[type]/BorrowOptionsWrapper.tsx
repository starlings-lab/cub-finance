import React from "react";
import { Address } from "abitype";
import { Chain, TokenDetail } from "@/app/type/type";
import { getAllSupportedDebtTokens } from "../getAllSupportedDebtTokens";
import BorrowRecommendationsWrapper from "./BorrowRecommendationsWrapper";
import { getSupportedUserCollaterals } from "../getSupportedUserCollaterals";

const BorrowOptionsWrapper = async ({
  userAddress
}: {
  userAddress: string;
}) => {
  const allSupportedDebtTokens: TokenDetail[] = await getAllSupportedDebtTokens(
    Chain.EthMainNet
  );
  const typedUserAddress = userAddress as Address;
  const collaterals = await getSupportedUserCollaterals(typedUserAddress);

  return (
    <div className="w-full mx-auto">
      <BorrowRecommendationsWrapper
        userAddress={typedUserAddress}
        collaterals={collaterals}
        supportedDebtTokens={allSupportedDebtTokens}
      />
    </div>
  );
};

export default BorrowOptionsWrapper;
