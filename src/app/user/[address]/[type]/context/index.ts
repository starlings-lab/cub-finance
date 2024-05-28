import { Tabs } from "@/components/ui/tabs";
import { Dispatch, SetStateAction, createContext } from "react";

interface IContext {
  activeDebtId: number | null;
  activeTab: Tabs;

  setActiveDebtId: Dispatch<SetStateAction<number | null>>;
  setActiveTab: Dispatch<SetStateAction<Tabs>>;
}

export const StoreContext = createContext<IContext>({
  activeDebtId: null,
  activeTab: Tabs.Refinance,
  setActiveDebtId: () => {},
  setActiveTab: () => {}
});
