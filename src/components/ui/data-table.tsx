"use client";

import {
  ColumnDef,
  ColumnSort,
  ExpandedState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
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
import { Fragment, useContext, useEffect, useState } from "react";
import { StoreContext } from "@/app/user/[address]/context";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialSortedColumns: ColumnSort[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialSortedColumns
}: DataTableProps<TData, TValue>) {
  const state = useContext(StoreContext);
  const [expanded, setExpanded] = useState<ExpandedState>({
    0: false
  });
  const [rowSelection, setRowSelected] = useState<RowSelectionState>({
    "0.0": true
  });
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(), //provide a sorting row model
    enableSubRowSelection: true,
    enableMultiRowSelection: false,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelected,
    getSubRows: ({ subRows }: any) => subRows,
    state: {
      expanded,
      rowSelection
    },
    initialState: {
      sorting: initialSortedColumns
    }
  });

  useEffect(() => {
    if (data?.length > 0) {
      const allRows = table.getRowModel().rows;
      const rowOne = allRows[0];
      if (rowOne.subRows.length > 0) {
        setExpanded({
          0: true
        });
        const firstSubRow = allRows[0].subRows[0];
        if (!firstSubRow.getIsSelected()) {
          firstSubRow.toggleSelected();
        }
        state?.setActiveDebtPosition(firstSubRow.original);
      } else {
        rowOne.toggleSelected();
        state?.setActiveDebtPosition(rowOne.original);
      }
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
                className={(row.getCanExpand() || row.getCanSelect()) ? 'cursor-pointer' : ''}
                  key={row.id}
                  onClick={(e) => {
                    if (row?.depth === 0) {
                      setExpanded({
                        [row.id] : !row.getIsExpanded()
                      })
                      if (!row.getCanExpand() && !row.getIsSelected()) {
                        row.toggleSelected();
                        state?.setActiveDebtPosition(row.original);
                      }
                    }
                    if (row?.depth === 1) {
                      if (!row.getIsSelected()) {
                        row.toggleSelected();
                        state?.setActiveDebtPosition(row.original);
                      }
                    }
                  }}
                  data-state={
                    ((row?.depth === 1 && row.getIsSelected()) ||
                      (row.depth === 0 &&
                        !row.getCanExpand() &&
                        row.getIsSelected())) &&
                    "selected"
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
            <TableRow className="hover:bg-white">
              <TableCell
                colSpan={columns.length}
                className="h-16 text-left sm:text-center"
              >
                You have no debt positions.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
