"use client";
import { Token, TokenDetail } from "@/app/type/type";
import Image from "next/image";
import React from "react";

export const TickIconBox = ({ isSelected }: { isSelected: boolean }) => (
  <span
    className={`text-green inset-y-0 flex items-center justify-center border border-slate-200 h-6 w-6`}
  >
    {isSelected && (
      <svg
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clipRule="evenodd"
        />
      </svg>
    )}
  </span>
);

export const ChevronDown = () => (
  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20">
    <path
      fill="currentColor"
      d="M15.854 7.646a.5.5 0 0 1 .001.707l-5.465 5.484a.55.55 0 0 1-.78 0L4.147 8.353a.5.5 0 1 1 .708-.706L10 12.812l5.147-5.165a.5.5 0 0 1 .707-.001"
    />
  </svg>
);

export const ChevronUp = () => (
  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 32 32">
    <path
      fill="currentColor"
      d="M5.293 20.707a1 1 0 0 0 1.414 0L16 11.414l9.293 9.293a1 1 0 0 0 1.414-1.414l-10-10a1 1 0 0 0-1.414 0l-10 10a1 1 0 0 0 0 1.414"
    />
  </svg>
);

const DebtSelect = ({
  optionsList,
  currentList,
  activeDropDown,
  setActiveDropDown,
  setCurrentList
}: {
  optionsList: TokenDetail[];
  currentList: TokenDetail[];
  activeDropDown: boolean;
  setActiveDropDown: React.Dispatch<
    React.SetStateAction<"debt" | "collateral" | "">
  >;
  setCurrentList: (list: TokenDetail[]) => void;
}) => {
  const stableCoinList = optionsList
    .filter((option) => option.stable)
    .map((option) => option?.token?.symbol);

  const handleOptionClick = (selectedDebt: TokenDetail) => {
    const findIndexOfSelectedDebt = currentList?.findIndex(
      (item) => item?.token?.symbol === selectedDebt.token?.symbol
    );
    if (findIndexOfSelectedDebt > -1) {
      const updatedFilters = currentList?.filter(
        (item) => item.token?.symbol !== selectedDebt.token?.symbol
      );
      setCurrentList(updatedFilters);
    } else {
      setCurrentList([...currentList, selectedDebt]);
    }
  };

  const toggleStableCoins = () => {
    if (isStableTokenSelected()) {
      setCurrentList(
        currentList.filter(
          (item) => !stableCoinList.includes(item.token?.symbol)
        )
      );
    } else {
      const stableCoins = optionsList.filter((option) => option.stable);
      const listWithoutStableCoins = currentList.filter(
        (option) => !option.stable
      );
      setCurrentList([...listWithoutStableCoins, ...stableCoins]);
    }
  };

  const isTokenSelected = (selectedDebt: TokenDetail) =>
    currentList?.findIndex(
      (item) => item.token?.symbol === selectedDebt.token?.symbol
    ) > -1;

  const isStableTokenSelected = () =>
    currentList?.filter((item) => stableCoinList.includes(item.token?.symbol))
      ?.length === stableCoinList?.length;

  const displayValueOfDebt =
    currentList?.length === optionsList?.length
      ? "All Tokens"
      : currentList?.length > 0
      ? currentList?.length < 3
        ? currentList
            .map((selectedDebt) => selectedDebt?.token?.symbol)
            .join(", ")
        : `${currentList?.length} tokens selected`
      : "Select token";

  return (
    <div className="relative sm:mx-4 cursor-pointer">
      <button
        type="button"
        className="relative flex items-center justify-between sm:justify-start w-full cursor-default bg-white py-0.5 text-left text-gray-900 sm:text-sm sm:leading-6 sm:border-b border-black"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-labelledby="listbox-label"
        onClick={() => {
          setActiveDropDown(activeDropDown ? "" : "debt");
        }}
      >
        <span className="text-md sm:text-xl truncate min-w-32 sm:min-w-40">
          {displayValueOfDebt}
        </span>
        <span className="pointer-events-none right-0 ml-3 flex items-center">
          {activeDropDown ? <ChevronUp /> : <ChevronDown />}
        </span>
      </button>

      {activeDropDown && (
        <ul
          className="absolute z-10 mt-1 max-h-56 min-w-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          tabIndex={-1}
          role="listbox"
          aria-labelledby="listbox-label"
          aria-activedescendant="listbox-option-3"
        >
          <li
            className="text-gray-900 relative select-none py-2 px-3 flex items-center justify-between"
            id="listbox-option-0"
            role="option"
            onClick={() =>
              setCurrentList(
                currentList?.length !== optionsList?.length ? optionsList : []
              )
            }
          >
            <div className="flex items-center">
              <span className="font-normal block truncate">All Tokens</span>
            </div>

            <TickIconBox
              isSelected={currentList?.length === optionsList?.length}
            />
          </li>

          <li
            className="text-gray-900 relative select-none py-2 px-3 flex items-center justify-between"
            id="listbox-option-0"
            role="option"
            onClick={toggleStableCoins}
          >
            <div className="flex items-center">
              <span className="font-normal block truncate">Stable Coins</span>
            </div>

            <TickIconBox isSelected={isStableTokenSelected()} />
          </li>

          {optionsList?.map((selectedDebt) => (
            <li
              key={selectedDebt.token?.symbol}
              className="text-gray-900 relative select-none py-2 px-3 flex items-center justify-between"
              id="listbox-option-0"
              role="option"
              onClick={() => handleOptionClick(selectedDebt)}
            >
              <div className="flex items-center">
                <Image
                  src={`/${selectedDebt.token?.symbol.toLowerCase()}.png`}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                />

                <span className="font-normal ml-3 block truncate">
                  {selectedDebt.token?.symbol}
                </span>
              </div>

              <TickIconBox isSelected={isTokenSelected(selectedDebt)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DebtSelect;
