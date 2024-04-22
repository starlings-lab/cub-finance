import { DebtPositionTableRow } from "@/app/type/type";
import { Dispatch, SetStateAction, createContext } from "react";

interface IContext {
  activeDebtPosition: DebtPositionTableRow | null;
  setActiveDebtPosition: Dispatch<SetStateAction<DebtPositionTableRow | null>>;
};

export const StoreContext = createContext<IContext | null>(null);
