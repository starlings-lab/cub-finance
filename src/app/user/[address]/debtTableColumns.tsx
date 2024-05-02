"use client";
import {
  DebtPositionTableRow,
  RecommendedDebtDetailTableRow
} from "@/app/type/type";
import ImageWrapper from "@/components/ui/image-wrapper";
import PopoverWrapper from "@/components/ui/popover";
import { ColumnDef, ColumnSort } from "@tanstack/react-table";
import Image from "next/image";
import { Fragment } from "react";

let USDollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export const trailing30DaysNetBorrowingAPYColumnId =
  "trailing30DaysNetBorrowingAPY";
export const totalDebtAmountInUSDColumnId = "totalDebtAmountInUSD";
export const trailing30DaysBorrowingAPYColumnId = "trailing30DaysBorrowingAPY";
export const trailing30DaysLendingAPYColumnId = "trailing30DaysLendingAPY";
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

const sortByMaxLTV = (rowA: any, rowB: any, columnId: any) => {
  return rowA.original.maxLTV - rowB.original.maxLTV;
};

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
          <div className="mr-5" />
        ) : (
          ""
        )}{" "}
        <Image
          src={`/${row.original.protocol}.png`}
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
    accessorKey: "debtToken",
    cell: ({ row, getValue }) => (
      <div
        className="flex w-max"
        style={{
          paddingLeft: `${row.depth * 1}rem`
        }}
      >
        {row.original.debtToken.map((debtToken) => (
          <PopoverWrapper
            key={debtToken.name}
            title={
              <ImageWrapper
                key={debtToken.name}
                src={`/${debtToken.symbol}.png`}
                alt={debtToken.symbol}
                width={"20"}
                height={"20"}
                className="mr-1 rounded-full"
              />
            }
            content={
              <div className="text-sm text-slate-800">{debtToken.symbol}</div>
            }
          />
        ))}
      </div>
    ),
    enableSorting: false
  },
  {
    header: "Collateral Tokens",
    accessorKey: "collateralTokens",
    cell: ({ row, getValue }) => (
      <div
        className="flex w-max"
        style={{
          paddingLeft: `${row.depth * 1}rem`
        }}
      >
        {row.original.collateralTokens.map((collateralToken) => (
          <PopoverWrapper
            key={collateralToken.name}
            title={
              <ImageWrapper
                key={collateralToken.name}
                src={`/${collateralToken.symbol}.png`}
                alt={collateralToken.symbol}
                width={"20"}
                height={"20"}
                className="mr-1 rounded-full"
              />
            }
            content={
              <div className="text-sm text-slate-800">
                {collateralToken.symbol}
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
        <div
          className="w-4 h-4"
          onClick={() => {
            if (row.column.getNextSortingOrder()) {
              row.column.toggleSorting();
            } else {
              const initialSortOrder = row.column.getFirstSortDir();
              row.column.toggleSorting(initialSortOrder === "desc");
            }
          }}
        >
          <Image
            src={"/sort.svg"}
            alt={"Sort Trailing 30 days Net Borrowing APY"}
            width={15}
            height={20}
          />
        </div>
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
      return USDollar.format(originalRow.totalDebtAmountInUSD);
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
        <div
          className="w-4 h-4"
          onClick={() => {
            if (row.column.getNextSortingOrder()) {
              row.column.toggleSorting();
            } else {
              const initialSortOrder = row.column.getFirstSortDir();
              row.column.toggleSorting(initialSortOrder === "desc");
            }
          }}
        >
          <Image
            src={"/sort.svg"}
            alt={"Sort Trailing 30 days Borrowing APY"}
            width={15}
            height={20}
          />
        </div>
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
                {"Lending APY"}
                <span className="ml-2 text-sm">ⓘ</span>
              </div>
            </div>
          }
          content={
            <div className="text-sm text-slate-800">
              {
                "Trailing 30 Days Lending APY For Collateral, Weighted Avg In Case of Multiple Collaterals"
              }
            </div>
          }
        />
        <div
          className="w-4 h-4"
          onClick={() => {
            if (row.column.getNextSortingOrder()) {
              row.column.toggleSorting();
            } else {
              const initialSortOrder = row.column.getFirstSortDir();
              row.column.toggleSorting(initialSortOrder === "desc");
            }
          }}
        >
          <Image
            src={"/sort.svg"}
            alt={"Sort Trailing 30 days Lending APY"}
            width={15}
            height={20}
          />
        </div>
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
    header: "LTV",
    accessorKey: "LTV",
    accessorFn: (originalRow) => {
      return `${(originalRow.LTV * 100).toFixed(2)}%`;
    },
    enableSorting: false
  },
  {
    id: maxLTVColumnId,
    header: (row) => (
      <div className="flex items-center">
        <div className="mr-2">Max LTV</div>
        <div
          className="w-4 h-4"
          onClick={() => {
            if (row.column.getNextSortingOrder()) {
              row.column.toggleSorting();
            } else {
              const initialSortOrder = row.column.getFirstSortDir();
              row.column.toggleSorting(initialSortOrder === "desc");
            }
          }}
        >
          <Image
            src={"/sort.svg"}
            alt={"Sort Max LTV"}
            width={15}
            height={20}
          />
        </div>
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

export const recommendedTableColumns: ColumnDef<RecommendedDebtDetailTableRow>[] =
  [
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
            src={`/${row.original.protocol}.png`}
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
      accessorKey: "debtToken",
      cell: ({ row, getValue }) => (
        <div
          className="flex w-max"
          style={{
            paddingLeft: `${row.depth * 1}rem`
          }}
        >
          {row.original.debtToken.map((debtToken) => (
            <PopoverWrapper
              key={debtToken.name}
              title={
                <ImageWrapper
                  key={debtToken.name}
                  src={`/${debtToken.symbol}.png`}
                  alt={debtToken.symbol}
                  width={"20"}
                  height={"20"}
                  className="mr-1 rounded-full"
                />
              }
              content={
                <div className="text-sm text-slate-800">{debtToken.symbol}</div>
              }
            />
          ))}
        </div>
      ),
      enableSorting: false
    },
    {
      header: "Collateral Tokens",
      accessorKey: "collateralTokens",
      cell: ({ row, getValue }) => (
        <div
          className="flex w-max"
          style={{
            paddingLeft: `${row.depth * 1}rem`
          }}
        >
          {row.original.collateralTokens.map((collateralToken) => (
            <PopoverWrapper
              key={collateralToken.name}
              title={
                <ImageWrapper
                  key={collateralToken.name}
                  src={`/${collateralToken.symbol}.png`}
                  alt={collateralToken.symbol}
                  width={"20"}
                  height={"20"}
                  className="mr-1 rounded-full"
                />
              }
              content={
                <div className="text-sm text-slate-800">
                  {collateralToken.symbol}
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
              <div className="text-sm text-slate-800">
                {"Trailing 30 days Net Borrowing APY"}
              </div>
            }
          />
          <div
            className="w-4 h-4"
            onClick={() => {
              if (row.column.getNextSortingOrder()) {
                row.column.toggleSorting();
              } else {
                const initialSortOrder = row.column.getFirstSortDir();
                row.column.toggleSorting(initialSortOrder === "desc");
              }
            }}
          >
            <Image
              src={"/sort.svg"}
              alt={"Sort Trailing 30 days Net Borrowing APY"}
              width={15}
              height={20}
            />
          </div>
        </div>
      ),
      accessorKey: "trailing30DaysNetBorrowingAPY",
      accessorFn: (originalRow) => {
        return `${(originalRow.trailing30DaysNetBorrowingAPY * 100).toFixed(
          2
        )}%`;
      },
      enableSorting: true,
      sortingFn: sortByTrailing30DaysNetBorrowingAPY
    },
    {
      id: totalDebtAmountInUSDColumnId, // id is required for sorting
      header: "Debt Amount",
      // accessorKey: "totalDebtAmountInUSD"
      accessorFn: (originalRow) => {
        return USDollar.format(originalRow.totalDebtAmountInUSD);
      },
      enableSorting: true
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
                {"Trailing 30 days Borrowing APY"}
              </div>
            }
          />
          <div
            className="w-4 h-4"
            onClick={() => {
              if (row.column.getNextSortingOrder()) {
                row.column.toggleSorting();
              } else {
                const initialSortOrder = row.column.getFirstSortDir();
                row.column.toggleSorting(initialSortOrder === "desc");
              }
            }}
          >
            <Image
              src={"/sort.svg"}
              alt={"Sort Trailing 30 days Borrowing APY"}
              width={15}
              height={20}
            />
          </div>
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
                  {"Lending APY"}
                  <span className="ml-2 text-sm">ⓘ</span>
                </div>
              </div>
            }
            content={
              <div className="text-sm text-slate-800">
                {"Trailing 30 days Lending APY"}
              </div>
            }
          />
          <div
            className="w-4 h-4"
            onClick={() => {
              if (row.column.getNextSortingOrder()) {
                row.column.toggleSorting();
              } else {
                const initialSortOrder = row.column.getFirstSortDir();
                row.column.toggleSorting(initialSortOrder === "desc");
              }
            }}
          >
            <Image
              src={"/sort.svg"}
              alt={"Sort Trailing 30 days Lending APY"}
              width={15}
              height={20}
            />
          </div>
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
      header: "LTV",
      accessorKey: "LTV",
      accessorFn: (originalRow) => {
        return `${(originalRow.LTV * 100).toFixed(2)}%`;
      },
      enableSorting: false
    },
    {
      id: maxLTVColumnId,
      header: (row) => (
        <div className="flex items-center">
          <div className="mr-2">Max LTV</div>
          <div
            className="w-4 h-4"
            onClick={() => {
              if (row.column.getNextSortingOrder()) {
                row.column.toggleSorting();
              } else {
                const initialSortOrder = row.column.getFirstSortDir();
                row.column.toggleSorting(initialSortOrder === "desc");
              }
            }}
          >
            <Image
              src={"/sort.svg"}
              alt={"Sort Max LTV"}
              width={15}
              height={20}
            />
          </div>
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
