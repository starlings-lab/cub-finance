"use client";

import {
  ColumnDef,
  ExpandedState,
  Row,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
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
import { Fragment, useContext, useEffect, useState } from "react";
import { StoreContext } from "@/app/user/[address]/context";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data
}: DataTableProps<TData, TValue>) {
  const state = useContext(StoreContext);
  const [expanded, setExpanded] = useState<ExpandedState>({
    0: true
  });
  const [rowSelection, setRowSelected] = useState<RowSelectionState>({
    "0.0": true
  });
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableSubRowSelection: true,
    enableMultiRowSelection: false,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelected,
    getSubRows: ({ subRows }) => subRows,
    state: {
      expanded,
      rowSelection
    }
  });

  useEffect(() => {
    if (data?.length > 0 && table.getRow("0")) {
      table.getRow("0").toggleSelected();
      state?.setActiveDebtPosition(table.getRow("0").original);
    }
  }, [data]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-white">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="hover:bg-muted/50">
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  key={row.id}
                  onClick={(e) => {
                    if (row?.depth === 0) {
                      !row.getIsSelected() && state?.setActiveDebtPosition(null);
                      table.resetExpanded();
                      row.toggleExpanded();
                      if(!row.getCanExpand() && !row.getIsSelected()){
                        row.toggleSelected();
                        state?.setActiveDebtPosition(row.original);
                      }
                    }
                    if (row?.depth === 1) {
                      if(!row.getIsSelected()){
                        row.toggleSelected();
                        state?.setActiveDebtPosition(row.original);
                      }
                    }
                  }}
                  data-state={
                    ((row?.depth === 1 && row.getIsSelected()) || (row.depth === 0 && !row.getCanExpand() && row.getIsSelected())) && "selected"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-16 text-left sm:text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
