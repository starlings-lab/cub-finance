"use client";

import { useState } from "react";
import { StoreContext } from "../context";
import { Tabs } from "@/components/ui/tabs";

export default function StoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [activeDebtId, setActiveDebtId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tabs>(Tabs.Borrow);

  return (
    <StoreContext.Provider
      value={{ activeDebtId, activeTab, setActiveDebtId, setActiveTab }}
    >
      {children}
    </StoreContext.Provider>
  );
}
