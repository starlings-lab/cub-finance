"use client";
import React, { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "./DebtSelect";

export type IItem = {
  value: string;
  title: string | ReactNode;
};

const SortOptions = ({
  isOpen,
  items,
  value,
  setValue,
  dir,
  setDir,
  setIsOpen
}: {
  isOpen: boolean;
  value: IItem;
  setValue: React.Dispatch<React.SetStateAction<IItem>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dir: string;
  setDir: React.Dispatch<React.SetStateAction<string>>;
  items: IItem[];
}) => {
  return (
    <div className="relative sm:ml-4 cursor-pointer">
      <button
        type="button"
        className="relative flex items-center justify-between sm:justify-start w-full cursor-default bg-white py-0.5 text-left text-gray-900 sm:text-sm sm:leading-6 sm:border-b border-black"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-labelledby="listbox-label"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <div className="text-xs mr-2 text-slate-400">Sort by:</div>
        <div className="flex items-center justify-between flex-1">
          <span className="text-xs">{value.title}</span>
          <span className="pointer-events-none right-0 flex items-center">
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </span>
        </div>
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 mt-1 max-h-56 min-w-36 w-full sm:min-w-56 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          tabIndex={-1}
          role="listbox"
          aria-labelledby="listbox-label"
          aria-activedescendant="listbox-option-3"
        >
          {items?.map((item) => (
            <li
              key={item.value}
              className="text-gray-900 relative select-none py-2 px-3 flex items-center justify-between"
              id="listbox-option-0"
              role="option"
              onClick={() => {
                if (item.value === value.value) {
                  setDir(dir === "asc" ? "desc" : "asc");
                } else {
                  setValue(item);
                  setDir("asc");
                }
              }}
            >
              <div className="flex items-center">
                <span className="font-normal block text-sm">{item.title}</span>
              </div>
              {value.value === item.value &&
                (dir === "asc" ? <ChevronUp /> : <ChevronDown />)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SortOptions;
