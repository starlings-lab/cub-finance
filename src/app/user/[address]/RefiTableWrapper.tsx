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
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import React from "react";

interface RefiTableWrapperProps {
  debtColumns: ColumnDef<DebtPositionTableRow>[];
  activeDebtPositionData: DebtPositionTableRow[];
  recommendedColumns: ColumnDef<RecommendedDebtDetailTableRow>[];
  recommendationsData: RecommendedDebtDetailTableRow[];
}

export function RefiTableWrapper({
  debtColumns,
  activeDebtPositionData,
  recommendedColumns,
  recommendationsData
}: RefiTableWrapperProps) {
  const debtSelectedTable = useReactTable({
    data: activeDebtPositionData,
    columns: debtColumns,
    getCoreRowModel: getCoreRowModel()
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
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="py-2">
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
            <div className="w-max p-4 font-medium">Selected debt position</div>
          </TableRow>
          {debtSelectedTable.getRowModel().rows.map((row) => (
            <TableRow key={row.id} data-state={"selected"}>
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
            <div className="w-max p-4 font-medium">Refinancing options</div>
          </TableRow>
          {recommendationTable.getRowModel().rows?.length ? (
            recommendationTable.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`${cell.column.id === "protocol" ? "flex" : ""}`}
                  >
                    {cell.column.id === "protocol" ? (
                      <div className="mx-2">•</div>
                    ) : (
                      ""
                    )}
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={recommendedColumns.length}
                className="h-24 text-center"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
