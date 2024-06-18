"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Address } from "abitype";
import { Chain, TokenAmount, TokenDetail } from "@/app/type/type";
import { getAllSupportedDebtTokens } from "../getAllSupportedDebtTokens";
import BorrowRecommendationsWrapper from "./BorrowRecommendationsWrapper";
import { getSupportedUserCollaterals } from "../getSupportedUserCollaterals";
import { toast } from "@/components/ui/use-toast";
import { StoreContext } from "@/app/context/context";
import { BorrowCardLoading } from "./BorrowCard";
import Loading from "./loadingTable";

const BorrowOptionsWrapper = ({ userAddress }: { userAddress: string }) => {
  const typedUserAddress = userAddress as Address;

  const [allSupportedDebtTokens, setAllSupportedDebtTokens] =
    useState<TokenDetail[]>();

  const { selectedChain } = useContext(StoreContext);

  const [debtTokensError, setDebtTokensError] = useState("");
  const [isDebtTokensLoading, setIsDebtTokensLoading] = useState(false);

  const [collaterals, setCollaterals] = useState<TokenAmount[]>();

  const [collateralsError, setCollateralsError] = useState("");
  const [isCollateralsLoading, setIsCollateralsLoading] = useState(false);

  const fetchAllDebtTokens = useCallback(async (chain: Chain) => {
    try {
      setDebtTokensError("");
      setIsDebtTokensLoading(true);

      const startTime = Date.now();

      const res = await getAllSupportedDebtTokens(chain);
      console.log(
        `Time taken to fetch all support debt tokens ${Date.now() - startTime}`
      );

      setAllSupportedDebtTokens(res);
      setIsDebtTokensLoading(false);
    } catch (error) {
      const errorMessage =
        "Failed to retrieve support debt tokens. Please try again using browser refresh button.";
      toast({
        title: "Data Fetching Error",
        description: errorMessage,
        variant: "destructive"
      });
      setIsDebtTokensLoading(false);
      setDebtTokensError(errorMessage);
    }
  }, []);

  const fetchAllCollaterals = useCallback(
    async (chain: Chain, typedUserAddress: Address) => {
      try {
        setCollateralsError("");
        setIsCollateralsLoading(true);

        const startTime = Date.now();

        const res = await getSupportedUserCollaterals(chain, typedUserAddress);

        console.log(
          `Time taken to fetch all collaterals ${Date.now() - startTime}`
        );

        setCollaterals(res);
        setIsCollateralsLoading(false);
      } catch (error) {
        const errorMessage =
          "Failed to retrieve collaterals. Please try again using browser refresh button.";
        toast({
          title: "Data Fetching Error",
          description: errorMessage,
          variant: "destructive"
        });
        setIsCollateralsLoading(false);
        setCollateralsError(errorMessage);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedChain) {
      fetchAllDebtTokens(selectedChain.value);
      fetchAllCollaterals(selectedChain.value, typedUserAddress);
    }
  }, [
    typedUserAddress,
    selectedChain,
    fetchAllDebtTokens,
    fetchAllCollaterals
  ]);

  if (collateralsError || debtTokensError) {
    return (
      <div className="text-xs justify-center flex mt-20 text-center">
        {collateralsError ?? debtTokensError}
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <div className="text-3xl hidden sm:flex items-center mb-12 mx-auto justify-center">
        Find the best borrowing terms
      </div>
      {collaterals &&
      allSupportedDebtTokens &&
      !(isDebtTokensLoading || isCollateralsLoading) ? (
        <BorrowRecommendationsWrapper
          userAddress={typedUserAddress}
          collaterals={collaterals}
          supportedDebtTokens={allSupportedDebtTokens}
        />
      ) : (
        <div className="text-xs justify-center text-center">
          <div className="hidden sm:flex items-center mb-8 mx-auto mt-10 justify-center">
            <div className="text-xl">I want to borrow</div>
            <div className="animate-pulse h-7 w-40 bg-gray-200 rounded  mx-4" />
            <div className="text-xl">against</div>
            <div className="animate-pulse h-7 w-40 rounded bg-gray-200  ml-4" />
          </div>
          <div className="flex sm:hidden flex-col mb-8 mx-auto justify-center">
            <div className="flex items-center justify-between flex-1">
              <div>I want to borrow</div>
              <div className="animate-pulse h-7 w-3/5 bg-gray-300 rounded" />
            </div>

            <div className="flex items-center justify-between flex-1 mt-4">
              <div>against</div>
              <div className="animate-pulse h-7 w-3/5 bg-gray-300 rounded" />
            </div>
          </div>
          <div className="block sm:hidden">
            <BorrowCardLoading />
          </div>
          <div className="hidden sm:flex">
            <Loading />
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowOptionsWrapper;
