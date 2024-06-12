import { Dispatch, SetStateAction, createContext } from "react";
import { IChain } from "../ChainSelect";
import { Chain } from "../type/type";

interface IContext {
  selectedChain: IChain;
  setSelectedChain: Dispatch<SetStateAction<IChain>>;
}

export const StoreContext = createContext<IContext>({
  selectedChain: {
    name: "Ethereum",
    value: Chain.EthMainNet
  },
  setSelectedChain: () => {}
});
