"use client";
import { BorrowRecommendationTableRow } from "@/app/type/type";
import React, { useState } from "react";
import {
  ColumnSort,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Loading from "./loadingTable";
import {
  borrowTableColumns,
  maxLTVColumnId,
  totalDebtAmountInUSDColumnId,
  trailing30DaysBorrowingAPYColumnId,
  trailing30DaysLendingAPYColumnId,
  trailing30DaysNetBorrowingAPYColumnId
} from "./debtTableColumns";
import BorrowCard, {
  BorrowCardLoading
} from "@/app/user/[address]/[type]/BorrowCard";
import SortOptions, { IItem } from "./SortOptions";
import ClickAwayListener from "@/components/ui/click-away-listener";

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

const sortOptions = [
  {
    title: "Net Borrowing APY",
    value: "trailing30DaysNetBorrowingAPY"
  },
  {
    title: "Borrowing APY",
    value: "trailing30DaysBorrowingAPY"
  },
  {
    title: "Collateral APY",
    value: "trailing30DaysLendingAPY"
  },
  {
    title: "Rewards APY",
    value: "trailing30DaysRewardAPY"
  },
  {
    title: "Max LTV",
    value: "maxLTV"
  }
];

const BorrowRecommendations = ({
  isLoading,
  borrowOptions,
  error
}: {
  isLoading: boolean;
  borrowOptions: BorrowRecommendationTableRow[];
  error?: string;
}) => {
  const borrowTable = useReactTable({
    data: borrowOptions,
    columns: borrowTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), //provide a sorting row model
    initialState: {
      sorting: initialSortedColumns
    }
  });

  const [sortingOption, setSortingOption] = useState<IItem>({
    title: "Net Borrowing APY",
    value: "trailing30DaysNetBorrowingAPY"
  });
  const [sortingDir, setSortingDir] = useState("asc");
  const [isOpen, setIsOpen] = useState(false);

  const sortingFn = (rowA: any, rowB: any) => {
    return sortingDir === "asc"
      ? rowA[sortingOption.value] - rowB[sortingOption.value]
      : rowB[sortingOption.value] - rowA[sortingOption.value];
  };

  return (
    <div>
      <div className="block sm:hidden">
        <div className="flex justify-between items-center">
          <div className="text-slate-400 text-sm flex items-center">
            Showing{" "}
            {isLoading ? (
              <div className="animate-pulse h-3 w-5 rounded-full bg-gray-300 mx-1.5" />
            ) : (
              borrowOptions.length
            )}{" "}
            options
          </div>
          <div className="w-7/12">
            <div className="border border-slate-300 p-1 rounded-lg bg-white flex items-center justify-between flex-1">
              <ClickAwayListener
                className="flex-1"
                onClickAway={() => setIsOpen(false)}
              >
                <SortOptions
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  value={sortingOption}
                  setValue={setSortingOption}
                  dir={sortingDir}
                  setDir={setSortingDir}
                  items={sortOptions}
                />
              </ClickAwayListener>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {isLoading ? (
            <BorrowCardLoading />
          ) : (
            borrowOptions
              .sort(sortingFn)
              .map((borrowOption, index) => (
                <BorrowCard key={index} optionDetails={borrowOption} />
              ))
          )}
        </div>
      </div>
      <Table className="hidden sm:block">
        <TableHeader className="bg-white">
          {borrowTable.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="!rounded-md border bg-tbHeader hover:bg-white"
            >
              {headerGroup.headers.map((header) => {
                const isSortable = header.column.getCanSort();
                const classNameForSort = isSortable
                  ? "hover:bg-muted/50 cursor-pointer"
                  : "";
                return (
                  <TableHead
                    key={header.id}
                    className={`${classNameForSort} font-bold`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow className="hover:bg-white !border-b-0 !mt-2">
              <TableCell
                colSpan={borrowTableColumns.length}
                className="h-16 w-max p-0 pb-4 font-lg"
              >
                <Loading showHeader={false} />
              </TableCell>
            </TableRow>
          ) : borrowTable.getRowModel().rows?.length ? (
            borrowTable.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="!rounded-md !border bg-white hover:bg-white"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`${cell.column.id === "protocol" ? "flex" : ""}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="!rounded !border bg-white hover:bg-white">
              <TableCell
                colSpan={borrowTableColumns.length}
                className="h-16 text-left sm:text-center"
              >
                {error ??
                  "You don't have borrow options because you have no supported collaterals."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default BorrowRecommendations;
