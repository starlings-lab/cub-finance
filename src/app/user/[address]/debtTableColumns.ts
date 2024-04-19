"use client";
import { DebtPositionTableRow } from "@/app/type/type";
import { ColumnDef } from "@tanstack/react-table";

// Define columns for the table to render DebtPositionTableRow
export const debtTableColumns: ColumnDef<DebtPositionTableRow>[] = [
  {
    header: "Protocol",
    accessorKey: "protocol"
  },
  {
    header: "Debt Tokens",
    // accessorKey: "debtToken"
    accessorFn: (originalRow) => {
      return originalRow.debtToken.map((token) => token.symbol).join(", ");
    }
  },
  {
    header: "Collateral Tokens",
    // accessorKey: "collateralTokens"
    accessorFn: (originalRow) => {
      return originalRow.collateralTokens
        .map((token) => token.symbol)
        .join(", ");
    }
  },
  {
    header: "Total Debt Amount",
    accessorKey: "totalDebtAmountInUSD"
  },
  {
    header: "Total Collateral Amount",
    accessorKey: "totalCollateralAmountInUSD"
  },
  {
    header: "LTV",
    accessorKey: "LTV"
  },
  {
    header: "Max LTV",
    accessorKey: "maxLTV"
  },
  {
    header: "Trailing 30 Days Net APY",
    accessorKey: "trailing30DaysNetAPY"
  },
  {
    header: "Trailing 30 Days Lending APY",
    accessorKey: "trailing30DaysLendingAPY"
  },
  {
    header: "Trailing 30 Days Borrowing APY",
    accessorKey: "trailing30DaysBorrowingAPY"
  }
];
