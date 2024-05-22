"use client";
import { BorrowRecommendationTableRow } from "@/app/type/type";
import React from "react";
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

  return (
    <Table>
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
  );
};

export default BorrowRecommendations;
