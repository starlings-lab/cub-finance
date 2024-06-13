"use client";

import { useEffect, useState } from "react";
import { StoreContext } from "./context";
import { Tabs } from "@/components/ui/tabs";
import { IChain } from "../ChainSelect";
import { Chain } from "../type/type";

export default function StoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [selectedChain, setSelectedChain] = useState<IChain | undefined>();

  useEffect(() => {
    const selectedChainFromLocal = localStorage.getItem("selectedChain");
    if (selectedChainFromLocal) {
      setSelectedChain(JSON.parse(selectedChainFromLocal));
    } else {
      setSelectedChain({
        name: "Ethereum",
        value: Chain.EthMainNet
      });
    }
  }, []);

  useEffect(() => {
    if (selectedChain) {
      localStorage.setItem("selectedChain", JSON.stringify(selectedChain));
    }
  }, [selectedChain]);

  return (
    <StoreContext.Provider value={{ selectedChain, setSelectedChain }}>
      {children}
    </StoreContext.Provider>
  );
}
