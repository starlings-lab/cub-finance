"use client";

import { useState } from "react";
import { StoreContext } from "../context";
import { DebtPositionTableRow } from "@/app/type/type";

export default function StoreProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [activeDebtPosition, setActiveDebtPosition] = useState<DebtPositionTableRow| null>(null);

  return (
    <StoreContext.Provider
      value={{ activeDebtPosition, setActiveDebtPosition }}
    >
      {children}
    </StoreContext.Provider>
  );
}
