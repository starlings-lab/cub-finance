"use client";
import { StoreContext } from "@/app/user/[address]/context";
import * as React from "react";

enum Tabs {
  "Borrow",
  "Refinance"
}

const options = [
  {
    display: "Borrow",
    value: Tabs.Borrow
  },
  {
    display: "Refinance",
    value: Tabs.Refinance
  }
];

const optionsSubHeading = {
  [Tabs.Borrow]:
    "Borrowing options based on your token holdings as collateral.",
  [Tabs.Refinance]: "Refinance options based on your debt positions."
};

const TabsWrapper = () => {
  const state = React.useContext(StoreContext);

  const selectedClassNames = "text-2xl sm:text-4xl min-w-40 sm:min-w-52 border-b-2 border-gray-900";
  const unSelectedClassNames = "text-xl sm:text-3xl text-slate-600 min-w-32 sm:min-w-36 border-b";

  return (
    <div>
      <div className="flex font-hkGrotesk cursor-pointer items-end w-fit mx-auto mt-12 text-center mb-4 sm:mb-0">
        {options.map((option) => (
          <div
            key={option.value}
            className={`transition-colors ease-linear ${
              state!.activeTab === option.value
                ? selectedClassNames
                : unSelectedClassNames
            }`}
            onClick={() => state!.setActiveTab(option.value)}
          >
            {option.display}
          </div>
        ))}
      </div>
      <div className="mt-1 sm:mt-4 text-sm sm:text-md text-gray-500 font-notoSerif text-center">
        {optionsSubHeading[state!.activeTab]}
      </div>
    </div>
  );
};

export { Tabs, TabsWrapper };
