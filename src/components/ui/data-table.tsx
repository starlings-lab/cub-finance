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
import { Fragment, Suspense, useContext, useEffect, useState } from "react";
import { StoreContext } from "@/app/user/[address]/[type]/context";
import Image from "next/image";
import Loading from "@/app/user/[address]/[type]/loadingTable";
import RecommendationsWrapper from "@/app/user/[address]/[type]/RecommendationsWrapper";

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

  const [showFullDebtTable, setShowFullDebtTable] = useState(true);
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

  const finalTable = showFullDebtTable
    ? table.getRowModel()
    : table.getSelectedRowModel();

  return (
    <div>
      <Table>
        <TableHeader className="bg-white">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="!rounded-md border bg-tbHeader hover:bg-tbHeader"
            >
              {headerGroup.headers.map((header) => {
                const isSortable = header.column.getCanSort();
                const classNameForSort = isSortable
                  ? "hover:bg-muted/50 cursor-pointer"
                  : "";
                return (
                  <TableHead key={header.id} className={classNameForSort}>
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
        <TableBody className="bg-white">
          <TableRow className="hover:bg-white">
            <TableCell
              colSpan={columns.length}
              className="h-16 w-max p-0 pb-4 pt-2 font-lg"
            >
              <div className="flex items-center mt-3  sm:mt-2 ">
                <div className="text-xl sm:text-2xl font-medium tracking-wide font-hkGrotesk mr-4">
                  Debt positions
                </div>
                <button
                  title="toggle debt positions"
                  onClick={() => setShowFullDebtTable(!showFullDebtTable)}
                >
                  <Image
                    src={showFullDebtTable ? `/collapse.svg` : "/expand.svg"}
                    alt={"expand debt row"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </button>
              </div>
            </TableCell>
          </TableRow>
          {finalTable.rows?.length ? (
            finalTable.rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow
                  className={`!rounded-md !border bg-white ${
                    row.getCanExpand() || row.getCanSelect()
                      ? "cursor-pointer"
                      : ""
                  }`}
                  key={row.id}
                  onClick={(e) => {
                    if (row?.depth === 0) {
                      setExpanded({
                        [row.id]: !row.getIsExpanded()
                      });
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
            <TableRow className="!rounded-md !border bg-white hover:bg-white">
              <TableCell
                colSpan={columns.length}
                className="h-16 text-left sm:text-center"
              >
                You have no debt positions.
              </TableCell>
            </TableRow>
          )}
          <Suspense
          fallback={
            <TableRow className="hover:bg-white">
              <TableCell
                colSpan={columns.length}
                className="h-16 w-max p-0 pb-4 pt-2 font-lg"
              >
                <Loading />
              </TableCell>
            </TableRow>
          }
        >
          <RecommendationsWrapper />
        </Suspense>
        </TableBody>
      </Table>
    </div>
  );
}
