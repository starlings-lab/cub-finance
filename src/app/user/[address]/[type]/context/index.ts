import { DebtPositionTableRow } from "@/app/type/type";
import { Tabs } from "@/components/ui/tabs";
import { Dispatch, SetStateAction, createContext } from "react";

interface IContext {
  activeDebtPosition: DebtPositionTableRow | null;
  activeTab: Tabs;

  setActiveDebtPosition: Dispatch<SetStateAction<DebtPositionTableRow | null>>;
  setActiveTab: Dispatch<SetStateAction<Tabs>>;
};

export const StoreContext = createContext<IContext | null>(null);
