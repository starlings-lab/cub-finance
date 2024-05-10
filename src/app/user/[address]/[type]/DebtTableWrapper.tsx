import React from "react";
import { getUserDebtPositions } from "../../../service/userDebtPositions";
import { Address } from "abitype";
import { DataTable } from "@/components/ui/data-table";
import {
  debtTableColumns,
  maxLTVColumnId,
  totalDebtAmountInUSDColumnId,
  trailing30DaysBorrowingAPYColumnId,
  trailing30DaysLendingAPYColumnId,
  trailing30DaysNetBorrowingAPYColumnId
} from "./debtTableColumns";
import { DebtPositionTableRow } from "@/app/type/type";
import { ColumnSort } from "@tanstack/react-table";

// Sort debts by ascending order of trailing30DaysNetBorrowingAPY and descending order of totalDebtAmountInUSD
const initialSortedColumns: ColumnSort[] = [
  {
    id: trailing30DaysNetBorrowingAPYColumnId,
    // We want to display the lowest APY first,
    // because negative APY means the user is paying interest.
    desc: false
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

const DebtTableWrapper = async ({ userAddress }: { userAddress: string }) => {
  const startTime = Date.now();
  const allDebtPositions: DebtPositionTableRow[] = await getUserDebtPositions(
    userAddress as Address
  );
  console.log(
    `Time taken to fetch debt positions: ${
      Date.now() - startTime
    } ms for user ${userAddress} with ${allDebtPositions.length} items`
  );

  return (
    <div className="max-w-screen-xl mx-auto py-8">
      <DataTable
        columns={debtTableColumns}
        data={allDebtPositions}
        initialSortedColumns={initialSortedColumns}
      />
    </div>
  );
};

export default DebtTableWrapper;
