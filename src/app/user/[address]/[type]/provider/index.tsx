"use client";

import { useState } from "react";
import { StoreContext } from "../context";
import { DebtPositionTableRow } from "@/app/type/type";
import { Tabs } from "@/components/ui/tabs";

export default function StoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [activeDebtPosition, setActiveDebtPosition] = useState<DebtPositionTableRow| null>(null);
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.Refinance);

  return (
    <StoreContext.Provider
      value={{ activeDebtPosition, activeTab, setActiveDebtPosition, setActiveTab }}
    >
      {children}
    </StoreContext.Provider>
  );
}
