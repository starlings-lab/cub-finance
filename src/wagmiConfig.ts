import { http, createConfig } from "@wagmi/core";
import { mainnet } from "@wagmi/core/chains";
import { Config } from "@wagmi/core";
import { ALCHEMY_API_URL } from "./app/constants";

const wagmiConfig: Config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(ALCHEMY_API_URL)
  }
});

export { wagmiConfig };
