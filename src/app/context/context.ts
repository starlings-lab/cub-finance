import { Dispatch, SetStateAction, createContext } from "react";
import { IChain } from "../ChainSelect";

interface IContext {
  selectedChain: IChain | undefined;
  setSelectedChain: Dispatch<SetStateAction<IChain | undefined>>;
}

export const StoreContext = createContext<IContext>({
  selectedChain: undefined,
  setSelectedChain: () => {}
});
