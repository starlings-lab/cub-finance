import React from "react";
import { getUserDebtPositions } from "./getUserDebtPositions";
import { Address } from "abitype";
import { DataTable } from "@/components/ui/data-table";
import {
  debtTableColumns,
  totalDebtAmountInUSDColumnId,
  trailing30DaysNetAPYColumnId
} from "./debtTableColumns";
import { DebtPositionTableRow } from "@/app/type/type";
import { ColumnSort } from "@tanstack/react-table";

// Sort debts by ascending order of trailing30DaysNetAPY and descending order of totalDebtAmountInUSD
const initialSortedColumns: ColumnSort[] = [
  {
    id: trailing30DaysNetAPYColumnId,
    // We want to display the lowest APY first,
    // because negative APY means the user is paying interest.
    desc: false
  },
  {
    id: totalDebtAmountInUSDColumnId,
    // We want to display the highest debt amount first.
    desc: true
  }
];

const DebtTableWrapper = async ({ userAddress }: { userAddress: string }) => {
  const allDebtPositions: DebtPositionTableRow[] = await getUserDebtPositions(
    userAddress as Address
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
