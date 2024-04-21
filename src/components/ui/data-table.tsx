"use client";

import {
  ColumnDef,
  ExpandedState,
  Row,
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
    0:true
  });
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row: Row<TData>) => true,
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.subRows,
    state: {
      expanded
    }
  });

  useEffect(() => {
    console.log(data, expanded);
  }, [data, expanded]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
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
          {/* TODO: find a more neat way to add images in the cell*/}
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  key={row.id}
                  onClick={(e) => {
                    row.toggleExpanded();
                  }}
                  data-state={row.getIsSelected() && "selected"}
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
                {row.getIsExpanded() && (
                  <TableRow
                    key={row.id + "expanded"}
                    onClick={() => state?.setActiveDebtPosition(row.original)}
                    data-state={row.getIsExpanded() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      // TODO: add sub rows logic here
                      <TableCell key={cell.id}>
                        {cell.column.id === "protocol" ? (
                          <div className="ml-3 flex min-w-max items-center">
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
                            </svg>{" "}
                            {row.original?.protocol}
                          </div>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
