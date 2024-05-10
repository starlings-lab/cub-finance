import React from "react";
import { getUserDebtPositions } from "../../../service/userDebtPositions";
import { Address } from "abitype";
import {
  borrowTableColumns,
  maxLTVColumnId,
  totalDebtAmountInUSDColumnId,
  trailing30DaysBorrowingAPYColumnId,
  trailing30DaysLendingAPYColumnId,
  trailing30DaysNetBorrowingAPYColumnId
} from "./debtTableColumns";
import { DebtPositionTableRow, TokenDetail } from "@/app/type/type";
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

const DEBT_TOKEN_LIST = ['ETH', 'WBTC','USDT', 'USDC']

const BorrowOptionsWrapper = async ({
  userAddress
}: {
  userAddress: string;
}) => {
  const allDebtPositions: DebtPositionTableRow[] = await getUserDebtPositions(
    userAddress as Address
  );

  const allSupportedDebtTokens: TokenDetail[] = await getAllSupportedDebtTokens();


  const collaterals = await getSupportedUserCollaterals(userAddress as Address);

  return (
    <div className="max-w-screen-xl mx-auto py-8">
      <BorrowRecommendationsWrapper
        columns={borrowTableColumns}
        debtPositions={allDebtPositions}
        collaterals={collaterals}
        supportedDebtTokens={allSupportedDebtTokens}
        initialSortedColumns={initialSortedColumns}
      />
    </div>
  );
};

export default BorrowOptionsWrapper;
