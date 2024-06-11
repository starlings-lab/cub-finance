import { Address } from "abitype";
import { getTokenPrice } from "../service/defiLlamaDataService";
import {
  ETH,
  SUPPORTED_COLLATERAL_TOKENS_ARB_MAINNET,
  SUPPORTED_COLLATERAL_TOKENS_ETH_MAINNET
} from "../contracts/ERC20Tokens";
import { Chain } from "../type/type";

describe("defiLlamaDataService", () => {
  describe("getTokenPrice - ETH Mainnet", () => {
    it("should return token price map", async () => {
      const tokenAddresses = SUPPORTED_COLLATERAL_TOKENS_ETH_MAINNET.map(
        (token) => token.address
      );
      const tokenPriceMap = await getTokenPrice(
        Chain.EthMainNet,
        tokenAddresses
      );
      verifyTokenPriceMap(tokenPriceMap, tokenAddresses);
    });

    it("should return ETH price for ZERO address", async () => {
      const tokenPriceMap = await getTokenPrice(Chain.EthMainNet, [
        ETH.address
      ]);
      verifyTokenPriceMap(tokenPriceMap, [ETH.address]);
    });
  });

  describe("getTokenPrice - ARB Mainnet", () => {
    it("should return token price map", async () => {
      const tokenAddresses = SUPPORTED_COLLATERAL_TOKENS_ARB_MAINNET.map(
        (token) => token.address
      );
      const tokenPriceMap = await getTokenPrice(
        Chain.ArbMainNet,
        tokenAddresses
      );
      verifyTokenPriceMap(tokenPriceMap, tokenAddresses);
    });

    it("should return ETH price for ZERO address", async () => {
      const tokenPriceMap = await getTokenPrice(Chain.ArbMainNet, [
        ETH.address
      ]);
      verifyTokenPriceMap(tokenPriceMap, [ETH.address]);
    });
  });
});

function verifyTokenPriceMap(
  tokenPriceMap: Map<Address, number>,
  tokenAddresses: Address[]
) {
  expect(tokenPriceMap).toBeDefined();
  tokenAddresses.forEach((address) => {
    const addressLower = address.toLowerCase() as Address;
    expect(tokenPriceMap.has(addressLower)).toBeTruthy();
    expect(tokenPriceMap.get(addressLower)).toBeGreaterThan(0);
  });
}
