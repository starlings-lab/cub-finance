"use client";
import { trackEvent } from "fathom-client";
import Image from "next/image";
import React, { useContext } from "react";
import { StoreContext } from "./context/context";

export const TickIconBox = ({ isSelected }: { isSelected: boolean }) => (
  <span
    className={`text-green inset-y-0 flex items-center justify-center h-6 w-6`}
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

export type IChain = {
  name: string;
  value: number;
};

const ChainSelect = ({
  chains,
  isOpen,
  setIsOpen
}: {
  chains: IChain[];
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { selectedChain, setSelectedChain } = useContext(StoreContext);
  return (
    <div className="relative sm:mx-4 cursor-pointer mr-2">
      <button
        type="button"
        className="relative flex items-center justify-between sm:justify-start w-full cursor-pointer bg-white py-0.5 text-left text-gray-900 sm:text-sm sm:leading-6"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-labelledby="listbox-label"
        onClick={() => {
          trackEvent("Switch Networks");
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex flex-row items-center">
          <Image
            src={`/${selectedChain!.name.toLowerCase()}.png`}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 flex-shrink-0 rounded-full"
          />
          <span className="text-xs sm:text-sm truncate min-w-12 sm:min-w-16 ml-2">
            {selectedChain!.name}
          </span>
        </div>

        <span className="pointer-events-none right-0 ml-3 flex items-center">
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </span>
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 mt-1 max-h-56 min-w-40 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm right-0"
          tabIndex={-1}
          role="listbox"
          aria-labelledby="listbox-label"
          aria-activedescendant="listbox-option-3"
        >
          {chains?.map((chain) => (
            <li
              key={chain.name}
              className="text-gray-900 relative select-none py-2 px-3 flex items-center justify-between"
              id="listbox-option-0"
              role="option"
              onClick={() => setSelectedChain(chain)}
            >
              <div className="flex items-center">
                <Image
                  src={`/${chain.name.toLowerCase()}.png`}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 flex-shrink-0 rounded-full"
                />

                <span className="font-normal ml-3 block truncate">
                  {chain.name}
                </span>
              </div>

              <TickIconBox isSelected={selectedChain!.name === chain.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChainSelect;
