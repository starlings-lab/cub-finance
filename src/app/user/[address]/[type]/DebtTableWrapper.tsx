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
import {
  DebtPositionTableRow,
  RecommendedDebtDetailTableRow
} from "@/app/type/type";
import { ColumnSort } from "@tanstack/react-table";
import { getUserDebtPositionsHavingRefinanceOptions } from "../getUserDebtPositionsHavingRefinanceOptions";
import { useToast } from "../../../../components/ui/use-toast";

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
  let debtErrorMessage;
  let refinanceErrorMessage;
  let allDebtPositions: DebtPositionTableRow[] = [];
  try {
    const startTime = Date.now();
    allDebtPositions = await getUserDebtPositions(userAddress as Address);
    console.log(
      `Time taken to fetch debt positions: ${
        Date.now() - startTime
      } ms for user ${userAddress} with ${allDebtPositions.length} items`
    );
  } catch (error) {
    debtErrorMessage =
      "Failed to retrieve debt positions. Please try again using browser refresh button.";
  }
  let debtPositionsRefinanceOptions: Record<
    string,
    RecommendedDebtDetailTableRow[]
  > = {};
  try {
    const startTime = Date.now();
    debtPositionsRefinanceOptions =
      await getUserDebtPositionsHavingRefinanceOptions(allDebtPositions);
    console.log(
      `Time taken to fetch refinance options: ${
        Date.now() - startTime
      } ms for user ${userAddress}`
    );
  } catch (error) {
    refinanceErrorMessage =
      "Failed to retrieve refinance options. Please try again using browser refresh button.";
  }

  return (
    <div className="w-full mx-auto py-8">
      <DataTable
        columns={debtTableColumns}
        data={allDebtPositions}
        initialSortedColumns={initialSortedColumns}
        debtPositionsRefinanceOptions={debtPositionsRefinanceOptions}
        debtError={debtErrorMessage}
        refinanceError={refinanceErrorMessage}
      />
    </div>
  );
};

export default DebtTableWrapper;
