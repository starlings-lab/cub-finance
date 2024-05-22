"use client";
import { TokenAmount } from "@/app/type/type";
import { getFormattedTokenAmount } from "@/app/utils/utils";
import Image from "next/image";
import React, { useState } from "react";
import { TickIconBox } from "./DebtSelect";

const CollateralSelect = ({
  optionsList,
  currentList,
  activeDropDown,
  setActiveDropDown,
  setCurrentList
}: {
  optionsList: TokenAmount[];
  currentList: TokenAmount[];
  activeDropDown: boolean;
  setActiveDropDown: React.Dispatch<
    React.SetStateAction<"debt" | "collateral" | "">
  >;
  setCurrentList: React.Dispatch<React.SetStateAction<TokenAmount[]>>;
}) => {
  const displayValueOfCollateral =
    currentList?.length === optionsList?.length
      ? "All Collaterals"
      : currentList?.length > 0
      ? currentList
          .map((selectedCollateral) => selectedCollateral?.token.symbol)
          .join(", ")
      : "Select collaterals";

  const handleOptionClick = (selectedCollateral: TokenAmount) => {
    const findIndexOfSelectedCollateral = currentList?.findIndex(
      (item) => item.token.symbol === selectedCollateral.token.symbol
    );
    if (findIndexOfSelectedCollateral > -1) {
      const updatedFilters = currentList?.filter(
        (item) => item.token.symbol !== selectedCollateral.token.symbol
      );
      setCurrentList(updatedFilters);
    } else {
      setCurrentList([...currentList, selectedCollateral]);
    }
  };

  const isTokenSelected = (selectedCollateral: TokenAmount) =>
    currentList?.findIndex(
      (item) => item.token.symbol === selectedCollateral.token.symbol
    ) > -1;

  return (
    <div className="relative sm:ml-4 cursor-pointer">
      <button
        type="button"
        className="relative flex items-center justify-between sm:justify-start w-full cursor-default bg-white py-0.5 text-left text-gray-900 sm:text-sm sm:leading-6 border-b border-black"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-labelledby="listbox-label"
        onClick={() => {
          setActiveDropDown(activeDropDown ? "" : "collateral");
        }}
      >
        <span className="text-lg sm:text-xl truncate min-w-32">
          {displayValueOfCollateral}
        </span>
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
          className="absolute z-10 mt-1 max-h-56 min-w-36 sm:min-w-56 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
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
              <span className="font-normal block truncate">
                All Collaterals
              </span>
            </div>
            <TickIconBox
              isSelected={currentList?.length === optionsList?.length}
            />
          </li>
          {optionsList?.map((selectedCollateral) => (
            <li
              key={`${selectedCollateral.amountInUSD}${selectedCollateral.token.symbol}`}
              className="text-gray-900 relative select-none py-2 px-3 flex items-center justify-between"
              id="listbox-option-0"
              role="option"
              onClick={() => handleOptionClick(selectedCollateral)}
            >
              <div className="flex items-center">
                <Image
                  src={`/${selectedCollateral.token.symbol}.png`}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                />

                <span className="font-normal ml-3 block truncate">
                  {getFormattedTokenAmount(
                    selectedCollateral.token,
                    selectedCollateral.amount
                  )}{" "}
                  {selectedCollateral.token.symbol}
                </span>
              </div>
              <TickIconBox isSelected={isTokenSelected(selectedCollateral)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CollateralSelect;
