"use client";
import {
  DebtPositionTableRow,
  RecommendedDebtDetailTableRow
} from "@/app/type/type";
import ImageWrapper from "@/components/ui/image-wrapper";
import PopoverWrapper from "@/components/ui/popover";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Fragment } from "react";

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
        <Image
          src={`/${row.original.protocol}.png`}
          alt={row.original.protocol}
          width={20}
          height={20}
          className="mr-2 rounded-full"
        />
        {getValue<boolean>()}
      </div>
    )
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
    )
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
    )
  },
  {
    header: () => (
      <Fragment>
        <PopoverWrapper
          title={
            <div className="flex">
              <div className="mr-2">{"Net Borrowing APY"}</div>
              <Image
                src={"/info.svg"}
                alt={"Trailing 30 days Net Borrowing APY"}
                width={20}
                height={20}
              />
            </div>
          }
          content={
            <div className="text-sm text-slate-800">
              {"Trailing 30 days Net Borrowing APY"}
            </div>
          }
        />
      </Fragment>
    ),
    accessorKey: "trailing30DaysNetAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysNetAPY * 100).toFixed(2)}%`;
    }
  },
  {
    header: "Debt Amount",
    // accessorKey: "totalDebtAmountInUSD"
    accessorFn: (originalRow) => {
      return USDollar.format(originalRow.totalDebtAmountInUSD);
    }
  },
  {
    header: () => (
      <Fragment>
        <PopoverWrapper
          title={
            <div className="flex">
              <div className="mr-2">{"Borrowing APY"}</div>
              <Image
                src={"/info.svg"}
                alt={"Trailing 30 days Borrowing APY"}
                width={20}
                height={20}
              />
            </div>
          }
          content={
            <div className="text-sm text-slate-800">
              {"Trailing 30 days Borrowing APY"}
            </div>
          }
        />
      </Fragment>
    ),
    accessorKey: "trailing30DaysBorrowingAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysBorrowingAPY * 100).toFixed(2)}%`;
    }
  },
  {
    header: "Collateral Amount",
    // accessorKey: "totalCollateralAmountInUSD",
    accessorFn: (originalRow) => {
      return USDollar.format(originalRow.totalCollateralAmountInUSD);
    }
  },
  {
    header: () => (
      <Fragment>
        <PopoverWrapper
          title={
            <div className="flex">
              <div className="mr-2">{"Lending APY"}</div>
              <Image
                src={"/info.svg"}
                alt={"Trailing 30 days Lending APY"}
                width={20}
                height={20}
              />
            </div>
          }
          content={
            <div className="text-sm text-slate-800">
              {"Trailing 30 days Lending APY"}
            </div>
          }
        />
      </Fragment>
    ),
    accessorKey: "trailing30DaysLendingAPY",
    accessorFn: (originalRow) => {
      return `${(originalRow.trailing30DaysLendingAPY * 100).toFixed(2)}%`;
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
      )
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
      )
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
      )
    },
    {
      header: "Total Debt Amount",
      // accessorKey: "totalDebtAmountInUSD"
      accessorFn: (originalRow) => {
        return USDollar.format(originalRow.totalDebtAmountInUSD);
      }
    },
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
    {
      header: () => (
        <Fragment>
          <PopoverWrapper
            title={
              <div className="flex">
                <div className="mr-2">{"Net Borrowing APY"}</div>
                <Image
                  src={"/info.svg"}
                  alt={"Trailing 30 days Net Borrowing APY"}
                  width={20}
                  height={20}
                />
              </div>
            }
            content={
              <div className="text-sm text-slate-800">
                {"Trailing 30 days Net Borrowing APY"}
              </div>
            }
          />
        </Fragment>
      ),
      accessorKey: "trailing30DaysNetAPY",
      accessorFn: (originalRow) => {
        return `${(originalRow.trailing30DaysNetAPY * 100).toFixed(2)}%`;
      }
    },
    {
      header: () => (
        <Fragment>
          <PopoverWrapper
            title={
              <div className="flex">
                <div className="mr-2">{"Lending APY"}</div>
                <Image
                  src={"/info.svg"}
                  alt={"Trailing 30 days Lending APY"}
                  width={20}
                  height={20}
                />
              </div>
            }
            content={
              <div className="text-sm text-slate-800">
                {"Trailing 30 days Lending APY"}
              </div>
            }
          />
        </Fragment>
      ),
      accessorKey: "trailing30DaysLendingAPY",
      accessorFn: (originalRow) => {
        return `${(originalRow.trailing30DaysLendingAPY * 100).toFixed(2)}%`;
      }
    },
    {
      header: () => (
        <Fragment>
          <PopoverWrapper
            title={
              <div className="flex">
                <div className="mr-2">{"Borrowing APY"}</div>
                <Image
                  src={"/info.svg"}
                  alt={"Trailing 30 days Borrowing APY"}
                  width={20}
                  height={20}
                />
              </div>
            }
            content={
              <div className="text-sm text-slate-800">
                {"Trailing 30 days Borrowing APY"}
              </div>
            }
          />
        </Fragment>
      ),
      accessorKey: "trailing30DaysBorrowingAPY",
      accessorFn: (originalRow) => {
        return `${(originalRow.trailing30DaysBorrowingAPY * 100).toFixed(2)}%`;
      }
    }
  ];
