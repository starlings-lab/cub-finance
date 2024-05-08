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
import { DebtPositionTableRow, Token } from "@/app/type/type";
import { ColumnSort } from "@tanstack/react-table";
import { getAllSupportedDebtTokens } from "../getAllSupportedDebtTokens";
import BorrowRecommendationsWrapper from "./BorrowRecommendationsWrapper";

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

  const allSupportedDebtTokens: Token[] = await getAllSupportedDebtTokens();

  const filteredDebtTokens = allSupportedDebtTokens?.filter((debtToken) => DEBT_TOKEN_LIST.includes(debtToken.symbol))

  const collaterals = allDebtPositions
    .map((debtPosition) => debtPosition.collaterals)
    .flat();

  return (
    <div className="max-w-screen-xl mx-auto py-8">
      <BorrowRecommendationsWrapper
        columns={borrowTableColumns}
        debtPositions={allDebtPositions}
        collaterals={collaterals}
        supportedDebtTokens={filteredDebtTokens}
        initialSortedColumns={initialSortedColumns}
      />
    </div>
  );
};

export default BorrowOptionsWrapper;
