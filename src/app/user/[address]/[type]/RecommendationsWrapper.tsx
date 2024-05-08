"use client";
import { getRefinanceRecommendations } from "@/app/service/refiananceRecommendationService";
import { RecommendedDebtDetailTableRow } from "@/app/type/type";
import React, { Fragment, useContext, useEffect, useState } from "react";
import { StoreContext } from "./context";
import Loading from "./loadingTable";
import {
  maxLTVColumnId,
  recommendedTableColumns,
  totalDebtAmountInUSDColumnId,
  trailing30DaysBorrowingAPYColumnId,
  trailing30DaysLendingAPYColumnId,
  trailing30DaysNetBorrowingAPYColumnId
} from "./debtTableColumns";
import {
  ColumnSort,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { TableCell, TableRow } from "@/components/ui/table";

// Sort debts by descending order of trailing30DaysNetBorrowingAPY and descending order of totalDebtAmountInUSD
const initialSortedColumns: ColumnSort[] = [
  {
    id: trailing30DaysNetBorrowingAPYColumnId,
    // We want to display the highest APY first,
    // because positive APY means the user is earning interest for borrowing.
    // And negative APY means the user is paying interest.
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

const RecommendationsWrapper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<
    RecommendedDebtDetailTableRow[]
  >([]);

  const state = useContext(StoreContext);

  const recommendationTable = useReactTable({
    data: recommendations,
    columns: recommendedTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), //provide a sorting row model
    initialState: {
      sorting: initialSortedColumns
    }
  });

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);

      const startTime = Date.now();
      const data = await getRefinanceRecommendations(
        state!.activeDebtPosition?.protocol!,
        state!.activeDebtPosition?.debtPosition!
      );
      console.log(
        `Time taken to fetch recommendations: ${Date.now() - startTime} ms`
      );

      setRecommendations(data ?? []);
      setIsLoading(false);
    };
    if (state?.activeDebtPosition) {
      fetchRecommendations();
    }
  }, [state]);

  if (!state?.activeDebtPosition) {
    return;
  }

  return (
    <Fragment>
      <TableRow className="!border-b-0 hover:bg-white">
        <TableCell
          colSpan={recommendedTableColumns.length}
          className="h-16 w-max p-0 pb-4 pt-8 font-lg"
        >
          <div className="mt-3 sm:mt-3 text-xl sm:text-2xl font-medium tracking-wide font-hkGrotesk">
            Refinance Options
          </div>
        </TableCell>
      </TableRow>
      {isLoading ? (
        <TableRow className="hover:bg-white !border-b-0">
          <TableCell
            colSpan={recommendedTableColumns.length}
            className="h-16 w-max p-0 pb-4 font-lg"
          >
            <Loading showHeader={false} />
          </TableCell>
        </TableRow>
      ) : recommendationTable.getRowModel().rows?.length ? (
        recommendationTable.getRowModel().rows.map((row) => (
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
        <TableRow className="rounded border hover:bg-white">
          <TableCell
            colSpan={recommendedTableColumns.length}
            className="h-16 text-left sm:text-center"
          >
            Your existing positions look good! Try choosing another debt
            position.
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
};

export default RecommendationsWrapper;
