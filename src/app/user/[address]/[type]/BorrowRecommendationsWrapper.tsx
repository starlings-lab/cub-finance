"use client";
import {
  BorrowRecommendationTableRow,
  TokenAmount,
  TokenDetail
} from "@/app/type/type";
import React, { useEffect, useState } from "react";
import { ColumnDef, ColumnSort } from "@tanstack/react-table";
import { getBorrowRecommendations } from "@/app/service/borrowRecommendationService";
import BorrowRecommendations from "./BorrowRecommendations";
import CollateralSelect from "./CollateralSelect";
import DebtSelect from "./DebtSelect";
import { useToast } from "../../../../components/ui/use-toast";
import { Address } from "abitype";

const BorrowRecommendationsWrapper = ({
  columns,
  collaterals,
  supportedDebtTokens,
  initialSortedColumns,
  userAddress
}: {
  columns: ColumnDef<BorrowRecommendationTableRow>[];
  supportedDebtTokens: TokenDetail[];
  collaterals: TokenAmount[];
  initialSortedColumns: ColumnSort[];
  userAddress: Address;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeDropDown, setActiveDropDown] = useState<
    "debt" | "collateral" | ""
  >("");
  const [borrowRecommendations, setBorrowRecommendations] = useState<
    BorrowRecommendationTableRow[]
  >([]);
  const [filteredBorrowRecommendations, setFilteredBorrowRecommendations] =
    useState<BorrowRecommendationTableRow[]>([]);

  const [selectedDebtTokens, setSelectedDebtTokens] =
    useState<TokenDetail[]>(supportedDebtTokens);
  const [selectedCollaterals, setSelectedCollaterals] =
    useState<TokenAmount[]>(collaterals);

  // add error state
  const [error, setError] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedDebtTokens(supportedDebtTokens);
    setSelectedCollaterals(collaterals);
  }, [collaterals, supportedDebtTokens]);

  useEffect(() => {
    const debtTokenSymbolsMap = selectedDebtTokens.map(
      (selectedDebtToken) => selectedDebtToken.token.symbol
    );
    const filterBorrowRecommendations = borrowRecommendations?.filter(
      (borrowRecommendation) =>
        debtTokenSymbolsMap.includes(borrowRecommendation.debtToken.symbol)
    );
    setFilteredBorrowRecommendations(filterBorrowRecommendations);
  }, [selectedDebtTokens, borrowRecommendations]);

  useEffect(() => {
    const fetchBorrowRecommendations = async () => {
      try {
        setError(undefined);
        setIsLoading(true);
        const debtTokens = supportedDebtTokens?.map(
          (debtToken) => debtToken.token
        );

        const startTime = Date.now();
        let borrowRecommendations: BorrowRecommendationTableRow[] = [];

        if (
          debtTokens &&
          debtTokens.length > 0 &&
          selectedCollaterals &&
          selectedCollaterals.length > 0
        ) {
          borrowRecommendations = await getBorrowRecommendations(
            userAddress,
            debtTokens,
            selectedCollaterals
          );
        }
        console.log(
          "Time taken to fetch all borrow recommendations: ",
          Date.now() - startTime
        );

        setBorrowRecommendations(borrowRecommendations);
        setFilteredBorrowRecommendations(borrowRecommendations);
        setIsLoading(false);
      } catch (error) {
        const errorMessage =
          "Failed to retrieve borrow recommendations. Please try again using browser refresh button.";
        toast({
          title: "Data Fetching Error",
          description: errorMessage,
          variant: "destructive"
        });
        setIsLoading(false);
        setError(errorMessage);
      }
    };

    fetchBorrowRecommendations();
  }, [selectedCollaterals, supportedDebtTokens, toast]);

  return (
    <div>
      <div className="hidden sm:flex items-center mb-8 mx-auto justify-center">
        <div className="text-xl">I want to borrow</div>
        <DebtSelect
          activeDropDown={activeDropDown === "debt"}
          setActiveDropDown={setActiveDropDown}
          optionsList={supportedDebtTokens}
          currentList={selectedDebtTokens}
          setCurrentList={setSelectedDebtTokens}
        />
        <div className="text-xl">against</div>
        <CollateralSelect
          activeDropDown={activeDropDown === "collateral"}
          setActiveDropDown={setActiveDropDown}
          optionsList={collaterals}
          currentList={selectedCollaterals}
          setCurrentList={setSelectedCollaterals}
        />
      </div>
      <div className="flex sm:hidden flex-col mb-8 mx-auto justify-center">
        <div className="mb-2">I want to borrow</div>
        <DebtSelect
          activeDropDown={activeDropDown === "debt"}
          setActiveDropDown={setActiveDropDown}
          optionsList={supportedDebtTokens}
          currentList={selectedDebtTokens}
          setCurrentList={setSelectedDebtTokens}
        />
        <div className="my-2">against</div>
        <CollateralSelect
          activeDropDown={activeDropDown === "collateral"}
          setActiveDropDown={setActiveDropDown}
          optionsList={collaterals}
          currentList={selectedCollaterals}
          setCurrentList={setSelectedCollaterals}
        />
      </div>
      <BorrowRecommendations
        isLoading={isLoading}
        columns={columns}
        borrowOptions={filteredBorrowRecommendations}
        initialSortedColumns={initialSortedColumns}
        error={error}
      />
    </div>
  );
};

export default BorrowRecommendationsWrapper;
