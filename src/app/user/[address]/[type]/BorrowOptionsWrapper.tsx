import React from "react";
import { Address } from "abitype";
import {
  borrowTableColumns,
  maxLTVColumnId,
  totalDebtAmountInUSDColumnId,
  trailing30DaysBorrowingAPYColumnId,
  trailing30DaysLendingAPYColumnId,
  trailing30DaysNetBorrowingAPYColumnId
} from "./debtTableColumns";
import { TokenDetail } from "@/app/type/type";
import { ColumnSort } from "@tanstack/react-table";
import { getAllSupportedDebtTokens } from "../getAllSupportedDebtTokens";
import BorrowRecommendationsWrapper from "./BorrowRecommendationsWrapper";
import { getSupportedUserCollaterals } from "../getSupportedUserCollaterals";

// Sort debts by ascending order of trailing30DaysNetBorrowingAPY and descending order of totalDebtAmountInUSD
const initialSortedColumns: ColumnSort[] = [
  {
    id: trailing30DaysNetBorrowingAPYColumnId,
    // We want to display the lowest APY first,
    // because negative APY means the user is paying interest.
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

const BorrowOptionsWrapper = async ({
  userAddress
}: {
  userAddress: string;
}) => {
  const allSupportedDebtTokens: TokenDetail[] =
    await getAllSupportedDebtTokens();
  const typedUserAddress = userAddress as Address;
  const collaterals = await getSupportedUserCollaterals(typedUserAddress);

  return (
    <div className="w-full mx-auto">
      <BorrowRecommendationsWrapper
        userAddress={typedUserAddress}
        columns={borrowTableColumns}
        collaterals={collaterals}
        supportedDebtTokens={allSupportedDebtTokens}
        initialSortedColumns={initialSortedColumns}
      />
    </div>
  );
};

export default BorrowOptionsWrapper;
