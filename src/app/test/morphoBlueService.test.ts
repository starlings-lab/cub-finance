import {
  MORPHO_SUPPORTED_DEBT_TOKEN_QUERY,
  MORPHO_SUPPORTED_COLLATERAL_TOKEN_QUERY
} from "../constants";
import {
  getMarkets,
  getSupportedTokens,
  getBorrowRecommendations
} from "../service/morphoBlueService";
import { DAI, USDT, WETH, WBTC } from "../contracts/ERC20Tokens";
import { Chain } from "../type/type";

describe("MorphoBlue Service Tests", () => {
  test("getMarkets function should return an array of MorphoBlueMarket", async () => {
    const markets = await getMarkets();
    expect(Array.isArray(markets)).toBe(true);
    markets.forEach((market) => {
      expect(market).toHaveProperty("marketId");
      expect(market).toHaveProperty("debtToken");
      expect(market).toHaveProperty("collateralToken");
      expect(market).toHaveProperty("trailing30DaysBorrowingAPY");
      expect(market).toHaveProperty("utilizationRatio");
      expect(market).toHaveProperty("maxLTV");
    });
  });

  describe("get supported debt tokens", () => {
    it("should ensure all returned tokens are unique", async () => {
      const tokens = await getSupportedTokens(
        MORPHO_SUPPORTED_DEBT_TOKEN_QUERY
      );
      // console.log("tokens in test", tokens);
      const uniqueAddresses = tokens.map((token) => token.address);
      const setOfAddresses = new Set(uniqueAddresses);

      expect(setOfAddresses.size).toBe(uniqueAddresses.length);
    });
  });

  describe("get supported collateral tokens", () => {
    it("should ensure all returned tokens are unique", async () => {
      const tokens = await getSupportedTokens(
        MORPHO_SUPPORTED_COLLATERAL_TOKEN_QUERY
      );
      // console.log("tokens in test", tokens);
      const uniqueAddresses = tokens.map((token) => token.address);
      const setOfAddresses = new Set(uniqueAddresses);

      expect(setOfAddresses.size).toBe(uniqueAddresses.length);
    });
  });

  describe("getBorrowRecommendations", () => {
    it("should return an array of recommendations with valid market details", async () => {
      const debtTokens = [DAI, USDT];
      const collaterals = [
        {
          token: WETH,
          amount: BigInt(5 * 10 ** WETH.decimals),
          amountInUSD: 14973
        },
        {
          token: WBTC,
          amount: BigInt(10 * 10 * WBTC.decimals),
          amountInUSD: 592698
        }
      ];

      const recommendations = await getBorrowRecommendations(
        Chain.EthMainNet,
        debtTokens,
        collaterals
      );
      // console.log("recommendations", recommendations);
      expect(Array.isArray(recommendations)).toBe(true);

      recommendations.forEach((recommendation) => {
        expect(recommendation).toHaveProperty("debt");
        expect(recommendation).toHaveProperty("market");
      });
    });
  });
});
