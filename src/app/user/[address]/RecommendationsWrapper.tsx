"use client";
import { getRefinanceRecommendations } from "@/app/service/refiananceRecommendationService";
import { RecommendedDebtDetailTableRow } from "@/app/type/type";
import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "./context";
import Loading from "./loading";
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
import {
  Table,
  TableBody,
  TableCell,
  TableRow
} from "@/components/ui/table";

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
      const data = await getRefinanceRecommendations(
        state!.activeDebtPosition?.protocol!,
        state!.activeDebtPosition?.debtPosition!
      );
      console.log("Recommendations: ", data);
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
    <div>
      <div className="mt-3 sm:mt-3 text-xl sm:text-2xl font-medium tracking-wide font-hkGrotesk">
        Refinance Options
      </div>
      {isLoading ? (
        <Loading showHeader={false}/>
      ) : (
        <div className="rounded-md border bg-white mt-4">
          <Table>
            <TableBody>
              {recommendationTable.getRowModel().rows?.length ? (
                recommendationTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-white">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={`${
                          cell.column.id === "protocol" ? "flex" : ""
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-white">
                  <TableCell
                    colSpan={recommendedTableColumns.length}
                    className="h-16 text-left sm:text-center"
                  >
                    Your existing positions look good!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default RecommendationsWrapper;
