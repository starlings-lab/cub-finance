"use client";
import { Token } from "@/app/type/type";
import Image from "next/image";
import React, { useState } from "react";

const DebtSelect = ({
  optionsList,
  currentList,
  setCurrentList
}: {
  optionsList: Token[];
  currentList: Token[];
  setCurrentList: React.Dispatch<React.SetStateAction<Token[]>>;
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const displayValueOfDebt =
    currentList?.length === optionsList?.length
      ? "All Tokens"
      : currentList?.length > 0
      ? currentList.map((selectedDebt) => selectedDebt?.symbol).join(", ")
      : "Select token";

  const handleOptionClick = (selectedDebt: Token) => {
    const findIndexOfSelectedDebt = currentList?.findIndex(
      (item) => item.symbol === selectedDebt.symbol
    );
    if (findIndexOfSelectedDebt > -1) {
      const updatedFilters = currentList?.filter(
        (item) => item.symbol !== selectedDebt.symbol
      );
      setCurrentList(updatedFilters);
    } else {
      setCurrentList([...currentList, selectedDebt]);
    }
  };

  const toggleStableCoins = () => {
    if (isStableTokenSelected()) {
      setCurrentList(
        currentList.filter((item) => !["USDT", "USDC"].includes(item.symbol))
      );
    } else {
      const stableCoins = optionsList.filter((item) =>
        ["USDT", "USDC"].includes(item.symbol)
      );
      setCurrentList([...currentList, ...stableCoins]);
    }
  };

  const isTokenSelected = (selectedDebt: Token) =>
    currentList?.findIndex((item) => item.symbol === selectedDebt.symbol) > -1;

  const isStableTokenSelected = () =>
    currentList?.filter((item) => ["USDT", "USDC"].includes(item.symbol))
      ?.length === 2;

  return (
    <div className="relative mr-4 sm:mx-4 min-w-36 sm:min-w-64 cursor-pointer">
      <button
        type="button"
        className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-green sm:text-sm sm:leading-6"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-labelledby="listbox-label"
        onClick={() => {
          setShowOptions(!showOptions);
        }}
      >
        <span className="block truncate">{displayValueOfDebt}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
          <svg
            className="h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
      </button>

      {showOptions && (
        <ul
          className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
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

            {currentList?.length === optionsList?.length && (
              <span className="text-green absolute inset-y-0 right-0 flex items-center pr-4">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
            )}
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

            {isStableTokenSelected() && (
              <span className="text-green absolute inset-y-0 right-0 flex items-center pr-4">
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
            )}
          </li>

          {optionsList?.map((selectedDebt) => (
            <li
              key={selectedDebt.symbol}
              className="text-gray-900 relative select-none py-2 pl-3 pr-9"
              id="listbox-option-0"
              role="option"
              onClick={() => handleOptionClick(selectedDebt)}
            >
              <div className="flex items-center">
                <Image
                  src={`/${selectedDebt.symbol}.png`}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                />

                <span className="font-normal ml-3 block truncate">
                  {selectedDebt.symbol}
                </span>
              </div>

              {isTokenSelected(selectedDebt) && (
                <span className="text-[#12BB4F] absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DebtSelect;
