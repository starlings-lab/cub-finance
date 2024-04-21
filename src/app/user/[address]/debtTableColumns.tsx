"use client";
import { DebtPositionTableRow } from "@/app/type/type";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";

let USDollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

// Define columns for the table to render DebtPositionTableRow
export const debtTableColumns: ColumnDef<DebtPositionTableRow>[] = [
  {
    header: "Protocol",
    accessorKey: "protocol",
    cell: ({ row, getValue }) => (
      <div
        className="flex items-center"
        style={{
          paddingLeft: `${row.depth * 1}rem`
        }}
      >
        {row.getCanExpand() ? (
          <div>
            {row.getIsExpanded() ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="2rem"
                height="2rem"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m7 10l5 5m0 0l5-5"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="2rem"
                height="2rem"
                viewBox="0 0 24 24"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m10 17l5-5m0 0l-5-5"
                />
              </svg>
            )}
          </div>
        ) : row.depth === 1 ? (
          <svg
            className="mr-3"
            xmlns="http://www.w3.org/2000/svg"
            width="1rem"
            height="1rem"
            viewBox="0 0 256 256"
          >
            <path
              fill="currentColor"
              d="m224.49 136.49l-72 72a12 12 0 0 1-17-17L187 140H40a12 12 0 0 1 0-24h147l-51.49-51.52a12 12 0 0 1 17-17l72 72a12 12 0 0 1-.02 17.01"
            />
          </svg>
        ) : (
          ""
        )}{" "}
        {getValue<boolean>()}
      </div>
    )
  },
  {
    header: "Debt Tokens",
    accessorKey: "debtToken",
    cell: ({ row, getValue }) => (
      <div
        className="flex"
        style={{
          paddingLeft: `${row.depth * 1}rem`
        }}
      >
        {row.original.debtToken.map((debtToken) => (
          <Image
            key={debtToken.name}
            src={`/${debtToken.symbol}.png`}
            alt="USDT"
            width={"20"}
            height={"20"}
            className="mr-1"
          />
        ))}
      </div>
    )
  },
  {
    header: "Collateral Tokens",
    accessorKey: "collateralTokens",
    cell: ({ row, getValue }) => (
      <div
        className="flex"
        style={{
          paddingLeft: `${row.depth * 1}rem`
        }}
      >
        {row.original.collateralTokens.map((collateralToken) => (
          <Image
            key={collateralToken.name}
            src={`/${collateralToken.symbol}.png`}
            alt="USDT"
            width={"20"}
            height={"20"}
            className="mr-1"
          />
        ))}
      </div>
    )
  },
  // TODO: check if we can shorten the header name
  {
    header: "Total Debt Amount",
    // accessorKey: "totalDebtAmountInUSD"
    accessorFn: (originalRow) => {
      return USDollar.format(originalRow.totalDebtAmountInUSD);
    }
  },
  // TODO: check if we can shorten the header name
  {
    header: "Total Collateral Amount",
    // accessorKey: "totalCollateralAmountInUSD",
    accessorFn: (originalRow) => {
      return USDollar.format(originalRow.totalCollateralAmountInUSD);
    }
  },
  {
    header: "LTV",
    accessorKey: "LTV",
    accessorFn: (originalRow) => {
      return `${(originalRow.LTV * 100).toFixed(2)}%`;
    }
  },
  {
    header: "Max LTV",
    // accessorKey: "maxLTV",
    accessorFn: (originalRow) => {
      return `${(originalRow.maxLTV * 100).toFixed(2)}%`;
    }
  },
  // TODO: check if we can shorten the header name
  {
    header: "Trailing 30 Days Net APY",
    // accessorKey: "trailing30DaysNetAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysNetAPY * 100).toFixed(2)}%`;
    }
  },
  // TODO: check if we can shorten the header name
  {
    header: "Trailing 30 Days Lending APY",
    // accessorKey: "trailing30DaysLendingAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysLendingAPY * 100).toFixed(2)}%`;
    }
  },
  // TODO: check if we can shorten the header name
  {
    header: "Trailing 30 Days Borrowing APY",
    // accessorKey: "trailing30DaysBorrowingAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysBorrowingAPY * 100).toFixed(2)}%`;
    }
  }
];
