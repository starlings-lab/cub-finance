"use client";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Address } from "abitype";
import { Chain, TokenAmount, TokenDetail } from "@/app/type/type";
import { getAllSupportedDebtTokens } from "../getAllSupportedDebtTokens";
import BorrowRecommendationsWrapper from "./BorrowRecommendationsWrapper";
import { getSupportedUserCollaterals } from "../getSupportedUserCollaterals";
import { toast } from "@/components/ui/use-toast";
import { StoreContext } from "@/app/context/context";

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
    fetchAllDebtTokens(selectedChain.value);
    fetchAllCollaterals(selectedChain.value, typedUserAddress);
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
      {collaterals &&
      allSupportedDebtTokens &&
      !(isDebtTokensLoading || isCollateralsLoading) ? (
        <BorrowRecommendationsWrapper
          userAddress={typedUserAddress}
          collaterals={collaterals}
          supportedDebtTokens={allSupportedDebtTokens}
        />
      ) : (
        <div className="text-xs justify-center flex mt-20 text-center">
          Loading...
        </div>
      )}
    </div>
  );
};

export default BorrowOptionsWrapper;
