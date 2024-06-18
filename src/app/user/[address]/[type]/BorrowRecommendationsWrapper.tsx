"use client";
import {
  BorrowRecommendationTableRow,
  TokenAmount,
  TokenDetail
} from "@/app/type/type";
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { getBorrowRecommendations } from "@/app/service/borrowRecommendationService";
import BorrowRecommendations from "./BorrowRecommendations";
import CollateralSelect from "./CollateralSelect";
import DebtSelect from "./DebtSelect";
import { useToast } from "../../../../components/ui/use-toast";
import { Address } from "abitype";
import ClickAwayListener from "@/components/ui/click-away-listener";
import { StoreContext } from "@/app/context/context";

const BorrowRecommendationsWrapper = ({
  collaterals,
  supportedDebtTokens,
  userAddress
}: {
  supportedDebtTokens: TokenDetail[];
  collaterals: TokenAmount[];
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

  const { selectedChain } = useContext(StoreContext);

  // add error state
  const [error, setError] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const fetchBorrowRecommendations = useCallback(
    async (collaterals: TokenAmount[]) => {
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
          collaterals &&
          collaterals.length > 0
        ) {
          borrowRecommendations = await getBorrowRecommendations(
            selectedChain!.value,
            userAddress,
            debtTokens,
            collaterals
          );
        }
        console.log(
          `Time taken to fetch all borrow recommendations: ${
            Date.now() - startTime
          }`
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
    },
    [selectedChain!.value]
  );

  useEffect(() => {
    const prevState = localStorage.getItem(
      `${userAddress}_activeBorrowSelections`
    );
    if (prevState) {
      const [selectedDebtTokens, selectedCollaterals] = prevState.split("_");
      const parsedDebtTokens = JSON.parse(selectedDebtTokens) as string[];
      const parsedCollateralTokens = JSON.parse(
        selectedCollaterals
      ) as string[];

      setSelectedDebtTokens(
        supportedDebtTokens.filter((debtTokens) =>
          parsedDebtTokens.includes(debtTokens.token.symbol)
        )
      );
      const filteredCollaterals = collaterals.filter((collateral) =>
        parsedCollateralTokens.includes(collateral.token.symbol)
      );
      setSelectedCollaterals(filteredCollaterals);

      fetchBorrowRecommendations(filteredCollaterals);
    }
  }, []);

  useEffect(() => {
    const prevState = localStorage.getItem(
      `${userAddress}_activeBorrowSelections`
    );
    if (!prevState) {
      fetchBorrowRecommendations(collaterals);
    }
  }, [fetchBorrowRecommendations, collaterals]);

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

  const handleDebtSelect = useCallback(
    (list: TokenDetail[]) => {
      setSelectedDebtTokens(list);
      localStorage.setItem(
        `${userAddress}_activeBorrowSelections`,
        `${JSON.stringify(
          list.map((debtToken) => debtToken.token.symbol)
        )}_${JSON.stringify(
          selectedCollaterals.map((collateral) => collateral.token.symbol)
        )}`
      );
    },
    [selectedCollaterals]
  );

  const handleCollateralSelect = useCallback(
    (list: TokenAmount[]) => {
      setSelectedCollaterals(list);
      localStorage.setItem(
        `${userAddress}_activeBorrowSelections`,
        `${JSON.stringify(
          selectedDebtTokens.map((debtToken) => debtToken.token.symbol)
        )}_${JSON.stringify(list.map((collateral) => collateral.token.symbol))}`
      );
      fetchBorrowRecommendations(list);
    },
    [selectedDebtTokens]
  );

  return (
    <div>
      <ClickAwayListener onClickAway={() => setActiveDropDown("")}>
        <div className="hidden sm:flex items-center mb-8 mx-auto justify-center">
          <div className="text-xl">I want to borrow</div>
          <DebtSelect
            activeDropDown={activeDropDown === "debt"}
            setActiveDropDown={setActiveDropDown}
            optionsList={supportedDebtTokens}
            currentList={selectedDebtTokens}
            setCurrentList={handleDebtSelect}
          />
          <div className="text-xl">against</div>
          <CollateralSelect
            activeDropDown={activeDropDown === "collateral"}
            setActiveDropDown={setActiveDropDown}
            optionsList={collaterals}
            currentList={selectedCollaterals}
            setCurrentList={handleCollateralSelect}
          />
        </div>
        <div className="flex sm:hidden flex-col mb-8 mx-auto justify-center">
          <div className="flex items-center justify-between flex-1">
            <div>I want to borrow</div>
            <div className="border border-slate-300 p-1 rounded-lg bg-white w-3/5 ml-2">
              <DebtSelect
                activeDropDown={activeDropDown === "debt"}
                setActiveDropDown={setActiveDropDown}
                optionsList={supportedDebtTokens}
                currentList={selectedDebtTokens}
                setCurrentList={handleDebtSelect}
              />
            </div>
          </div>

          <div className="  flex items-center justify-between flex-1 mt-4">
            <div>against</div>
            <div className="border border-slate-300 p-1 rounded-lg bg-white w-3/5 ml-2">
              <CollateralSelect
                activeDropDown={activeDropDown === "collateral"}
                setActiveDropDown={setActiveDropDown}
                optionsList={collaterals}
                currentList={selectedCollaterals}
                setCurrentList={handleCollateralSelect}
              />
            </div>
          </div>
        </div>
      </ClickAwayListener>

      <BorrowRecommendations
        isLoading={isLoading}
        borrowOptions={filteredBorrowRecommendations}
        error={error}
      />
    </div>
  );
};

export default memo(BorrowRecommendationsWrapper);
