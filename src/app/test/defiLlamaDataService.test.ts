import { Address } from "abitype";
import { getTokenPrice } from "../service/defiLlamaDataService";
import { ETH, SUPPORTED_COLLATERAL_TOKENS } from "../contracts/ERC20Tokens";

describe("defiLlamaDataService", () => {
  describe("getTokenPrice", () => {
    it("should return token price map", async () => {
      const tokenAddresses = SUPPORTED_COLLATERAL_TOKENS.map(
        (token) => token.address
      );
      const tokenPriceMap = await getTokenPrice(tokenAddresses);
      expect(tokenPriceMap).toBeDefined();
      tokenAddresses.forEach((address) => {
        const addressLower = address.toLowerCase() as Address;
        expect(tokenPriceMap.has(addressLower)).toBeTruthy();
        expect(tokenPriceMap.get(addressLower)).toBeGreaterThan(0);
      });
    });

    it("should return ETH price for ZERO address", async () => {
      const tokenPriceMap = await getTokenPrice([ETH.address]);
      expect(tokenPriceMap).toBeDefined();
      expect(tokenPriceMap.size).toBe(1);
      expect(tokenPriceMap.has(ETH.address)).toBeTruthy();
      expect(tokenPriceMap.get(ETH.address)).toBeGreaterThan(0);
    });
  });
});
