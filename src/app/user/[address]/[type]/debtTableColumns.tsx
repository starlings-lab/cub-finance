"use client";
import { BorrowRecommendationTableRow } from "@/app/type/type";
import { getFormattedTokenAmount } from "@/app/utils/utils";
import ImageWrapper from "@/components/ui/image-wrapper";
import PopoverWrapper from "@/components/ui/popover";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";

let USDollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export const trailing30DaysNetBorrowingAPYColumnId =
  "trailing30DaysNetBorrowingAPY";
export const totalDebtAmountInUSDColumnId = "totalDebtAmountInUSD";
export const trailing30DaysBorrowingAPYColumnId = "trailing30DaysBorrowingAPY";
export const trailing30DaysLendingAPYColumnId = "trailing30DaysLendingAPY";
export const trailing30DaysRewardAPYColumnId = "trailing30DaysRewardAPY";
export const maxLTVColumnId = "maxLTV";

const sortByTrailing30DaysNetBorrowingAPY = (
  rowA: any,
  rowB: any,
  columnId: any
) => {
  return (
    rowA.original.trailing30DaysNetBorrowingAPY -
    rowB.original.trailing30DaysNetBorrowingAPY
  );
};

const sortByTrailing30DaysBorrowingAPY = (
  rowA: any,
  rowB: any,
  columnId: any
) => {
  return (
    rowA.original.trailing30DaysBorrowingAPY -
    rowB.original.trailing30DaysBorrowingAPY
  );
};

const sortByTrailing30DaysLendingAPY = (
  rowA: any,
  rowB: any,
  columnId: any
) => {
  return (
    rowA.original.trailing30DaysLendingAPY -
    rowB.original.trailing30DaysLendingAPY
  );
};

const sortByTrailing30DaysRewardAPY = (rowA: any, rowB: any, columnId: any) => {
  return (
    rowA.original.trailing30DaysRewardAPY -
    rowB.original.trailing30DaysRewardAPY
  );
};

const sortByMaxLTV = (rowA: any, rowB: any, columnId: any) => {
  return rowA.original.maxLTV - rowB.original.maxLTV;
};

const SortIcon = ({ row }: { row: any }) => (
  <div
    className="w-8 h-4"
    onClick={() => {
      if (row.column.getNextSortingOrder()) {
        row.column.toggleSorting();
      } else {
        const initialSortOrder = row.column.getFirstSortDir();
        row.column.toggleSorting(initialSortOrder === "desc");
      }
    }}
  >
    <Image src={"/sort.svg"} alt={"Sort Max LTV"} width={15} height={20} />
  </div>
);

export const borrowTableColumns: ColumnDef<BorrowRecommendationTableRow>[] = [
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
        <Image
          src={`/${row.original.protocol.toLowerCase()}.png`}
          alt={row.original.protocol}
          width={20}
          height={20}
          className="mr-2 rounded-full"
        />
        {getValue<boolean>()}
      </div>
    ),
    enableSorting: false
  },
  {
    header: "Debt Tokens",
    accessorKey: "debt",
    cell: ({ row, getValue }) => (
      <div
        className="flex w-max"
        style={{
          paddingLeft: `${row.depth * 1}rem`
        }}
      >
        <PopoverWrapper
          key={row.original.debt.token.name}
          title={
            <ImageWrapper
              key={row.original.debt.token.name}
              src={`/${row.original.debt.token.symbol.toLowerCase()}.png`}
              alt={row.original.debt.token.symbol}
              width={"20"}
              height={"20"}
              className="mr-1 rounded-full"
            />
          }
          content={
            <div className="text-sm text-slate-800">
              {getFormattedTokenAmount(
                row.original.debt.token,
                row.original.debt.amount
              )}{" "}
              {row.original.debt.token.symbol}
            </div>
          }
        />
      </div>
    ),
    enableSorting: false
  },
  {
    header: "Collateral Tokens",
    accessorKey: "collaterals",
    cell: ({ row, getValue }) => (
      <div
        className="flex w-max"
        style={{
          paddingLeft: `${row.depth * 1}rem`
        }}
      >
        {row.original.collaterals.map((collateral) => (
          <PopoverWrapper
            key={collateral.token.name}
            title={
              <ImageWrapper
                key={collateral.token.name}
                src={`/${collateral.token.symbol.toLowerCase()}.png`}
                alt={collateral.token.symbol}
                width={"20"}
                height={"20"}
                className="mr-1 rounded-full"
              />
            }
            content={
              <div className="text-sm text-slate-800">
                {getFormattedTokenAmount(collateral.token, collateral.amount)}{" "}
                {collateral.token.symbol}
              </div>
            }
          />
        ))}
      </div>
    ),
    enableSorting: false
  },
  {
    id: trailing30DaysNetBorrowingAPYColumnId, // id is required for sorting
    header: (row) => (
      <div className="flex items-center">
        <PopoverWrapper
          title={
            <div className="flex">
              <div className="mr-2">
                Net Borrowing APY<span className="ml-2 text-sm">ⓘ</span>
              </div>
            </div>
          }
          content={
            <div>
              <div className="text-sm text-slate-800">
                {
                  "Trailing 30 days Net Borrowing APY = (Lending Interest - Borrowing Interest) / Debt Amount"
                }
              </div>
              <div className="text-sm text-slate-800">
                {
                  "Positive value means user will earn interest and negative value means user will pay interest."
                }
              </div>
            </div>
          }
        />
        <SortIcon row={row} />
      </div>
    ),
    accessorKey: "trailing30DaysNetBorrowingAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysNetBorrowingAPY * 100).toFixed(2)}%`;
    },
    enableSorting: true,
    sortingFn: sortByTrailing30DaysNetBorrowingAPY
  },
  {
    id: totalDebtAmountInUSDColumnId, // id is required for sorting
    header: "Debt Amount",
    // accessorKey: "totalDebtAmountInUSD"
    accessorFn: (originalRow) => {
      return USDollar.format(originalRow.maxDebtAmountInUSD);
    },
    enableSorting: false
  },
  {
    id: trailing30DaysBorrowingAPYColumnId,
    header: (row) => (
      <div className="flex items-center">
        <PopoverWrapper
          title={
            <div className="flex">
              <div className="mr-2">
                {"Borrowing APY"} <span className="ml-2 text-sm">ⓘ</span>
              </div>
            </div>
          }
          content={
            <div className="text-sm text-slate-800">
              {"Trailing 30 days Borrowing APY You Pay For Your Debt"}
            </div>
          }
        />
        <SortIcon row={row} />
      </div>
    ),
    accessorKey: "trailing30DaysBorrowingAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysBorrowingAPY * 100).toFixed(2)}%`;
    },
    enableSorting: true,
    sortingFn: sortByTrailing30DaysBorrowingAPY
  },
  {
    header: "Collateral Amount",
    // accessorKey: "totalCollateralAmountInUSD",
    accessorFn: (originalRow) => {
      return USDollar.format(originalRow.totalCollateralAmountInUSD);
    },
    enableSorting: false
  },
  {
    id: trailing30DaysLendingAPYColumnId,
    header: (row) => (
      <div className="flex items-center">
        <PopoverWrapper
          title={
            <div className="flex">
              <div className="mr-2">
                {"Collateral APY"}
                <span className="ml-2 text-sm">ⓘ</span>
              </div>
            </div>
          }
          content={
            <div className="text-sm text-slate-800">
              {
                "Trailing 30 Days Collateral APY For Collateral, Weighted Avg In Case of Multiple Collaterals"
              }
            </div>
          }
        />
        <SortIcon row={row} />
      </div>
    ),
    accessorKey: "trailing30DaysLendingAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysLendingAPY * 100).toFixed(2)}%`;
    },
    enableSorting: true,
    sortingFn: sortByTrailing30DaysLendingAPY
  },
  {
    id: trailing30DaysRewardAPYColumnId,
    header: (row) => (
      <div className="flex items-center">
        <PopoverWrapper
          title={
            <div className="flex">
              <div className="mr-2">
                {"Reward APY"}
                <span className="ml-2 text-sm">ⓘ</span>
              </div>
            </div>
          }
          content={
            <div className="text-sm text-slate-800">
              {
                "Trailing 30 Days Reward APY For Reward, Weighted Avg In Case of Multiple Reward"
              }
            </div>
          }
        />
        <SortIcon row={row} />
      </div>
    ),
    accessorKey: "trailing30DaysRewardAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysRewardAPY * 100).toFixed(2)}%`;
    },
    enableSorting: true,
    sortingFn: sortByTrailing30DaysRewardAPY
  },
  // {
  //   header: "LTV",
  //   accessorKey: "LTV",
  //   accessorFn: (originalRow) => {
  //     return `${(originalRow.LTV * 100).toFixed(2)}%`;
  //   },
  //   enableSorting: false
  // },
  {
    id: maxLTVColumnId,
    header: (row) => (
      <div className="flex items-center">
        <div className="mr-2">Max LTV</div>
        <SortIcon row={row} />
      </div>
    ),
    accessorKey: "maxLTV",
    accessorFn: (originalRow) => {
      return `${(originalRow.maxLTV * 100).toFixed(2)}%`;
    },
    enableSorting: true,
    sortingFn: sortByMaxLTV
  }
];
