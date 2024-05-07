import { http, createConfig } from "@wagmi/core";
import { mainnet } from "@wagmi/core/chains";
import { ALCHEMY_API_URL } from "./app/constants";

export const ensConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(ALCHEMY_API_URL)
  }
});
