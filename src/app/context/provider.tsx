"use client";

import { useState } from "react";
import { StoreContext } from "./context";
import { Tabs } from "@/components/ui/tabs";
import { IChain } from "../ChainSelect";
import { Chain } from "../type/type";

export default function StoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [selectedChain, setSelectedChain] = useState<IChain>({
    name: "Ethereum",
    value: Chain.EthMainNet
  });


  return (
    <StoreContext.Provider
      value={{ selectedChain, setSelectedChain }}
    >
      {children}
    </StoreContext.Provider>
  );
}
