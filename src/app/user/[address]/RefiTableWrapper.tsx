"use client";

import {
  DebtPositionTableRow,
  RecommendedDebtDetailTableRow
} from "@/app/type/type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnSort,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import React from "react";

interface RefiTableWrapperProps {
  debtColumns: ColumnDef<DebtPositionTableRow>[];
  activeDebtPositionData: DebtPositionTableRow[];
  recommendedColumns: ColumnDef<RecommendedDebtDetailTableRow>[];
  recommendationsData: RecommendedDebtDetailTableRow[];
  initialSortedColumns: ColumnSort[];
}

export function RefiTableWrapper({
  debtColumns,
  activeDebtPositionData,
  recommendedColumns,
  recommendationsData,
  initialSortedColumns
}: RefiTableWrapperProps) {
  const debtSelectedTable = useReactTable({
    data: activeDebtPositionData,
    columns: debtColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), //provide a sorting row model
    initialState: {
      sorting: initialSortedColumns
    }
  });

  const recommendationTable = useReactTable({
    data: recommendationsData,
    columns: recommendedColumns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {debtSelectedTable.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-white">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="py-2 hover:bg-muted/50">
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
          <TableRow className="hover:bg-white">
            <TableCell
              colSpan={recommendedColumns.length}
              className="h-16 w-max p-4 font-medium"
            >
              Selected debt position
            </TableCell>
          </TableRow>
          {debtSelectedTable.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={"selected"}
              className="data-[state=selected]:hover:bg-muted"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

        <TableBody>
          <TableRow className="hover:bg-white">
            <TableCell
              colSpan={recommendedColumns.length}
              className="h-16 w-max p-4 font-medium"
            >
              Refinancing options
            </TableCell>
          </TableRow>
          {recommendationTable.getRowModel().rows?.length ? (
            recommendationTable.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-white">
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
            <TableRow className="hover:bg-white">
              <TableCell
                colSpan={recommendedColumns.length}
                className="h-16 text-left sm:text-center"
              >
                Your existing positions look good!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
