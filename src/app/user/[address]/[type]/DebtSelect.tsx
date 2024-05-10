"use client";
import { Token, TokenDetail } from "@/app/type/type";
import Image from "next/image";
import React from "react";

const TickIconBox = () => (
  <span className="text-green absolute inset-y-0 right-0 flex items-center pr-4">
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
  </span>
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
  setCurrentList: React.Dispatch<React.SetStateAction<TokenDetail[]>>;
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
      const stableCoins = optionsList.filter((item) =>
        stableCoinList.includes(item.token?.symbol)
      );
      setCurrentList([...currentList, ...stableCoins]);
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
    <div className="relative mr-4 sm:mx-4 cursor-pointer">
      <button
        type="button"
        className="relative flex items-center w-full cursor-default bg-white py-0.5 text-left text-gray-900 sm:text-sm sm:leading-6 border-b border-black"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-labelledby="listbox-label"
        onClick={() => {
          setActiveDropDown(activeDropDown ? "" : "debt");
        }}
      >
        <span className="truncate">{displayValueOfDebt}</span>
        <span className="pointer-events-none right-0 ml-3 flex items-center">
          {activeDropDown ? (
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.5 17.5L12 9.25L6.5 17.5L5 16.5L12 6L19 16.5L17.5 17.5Z"
                fill="black"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.50024 6.5L12.0002 14.75L17.5002 6.5L19.0002 7.5L12.0002 18L5.00024 7.5L6.50024 6.5Z"
                fill="black"
              />
            </svg>
          )}
        </span>
      </button>

      {activeDropDown && (
        <ul
          className="absolute z-10 mt-1 max-h-56 min-w-56 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          tabIndex={-1}
          role="listbox"
          aria-labelledby="listbox-label"
          aria-activedescendant="listbox-option-3"
        >
          <li
            className="text-gray-900 relative select-none py-2 pl-3 pr-9"
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

            {currentList?.length === optionsList?.length && <TickIconBox />}
          </li>

          <li
            className="text-gray-900 relative select-none py-2 pl-3 pr-9"
            id="listbox-option-0"
            role="option"
            onClick={toggleStableCoins}
          >
            <div className="flex items-center">
              <span className="font-normal block truncate">Stable Coins</span>
            </div>

            {isStableTokenSelected() && <TickIconBox />}
          </li>

          {optionsList?.map((selectedDebt) => (
            <li
              key={selectedDebt.token?.symbol}
              className="text-gray-900 relative select-none py-2 pl-3 pr-9"
              id="listbox-option-0"
              role="option"
              onClick={() => handleOptionClick(selectedDebt)}
            >
              <div className="flex items-center">
                <Image
                  src={`/${selectedDebt.token?.symbol}.png`}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                />

                <span className="font-normal ml-3 block truncate">
                  {selectedDebt.token?.symbol}
                </span>
              </div>

              {isTokenSelected(selectedDebt) && <TickIconBox />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DebtSelect;
