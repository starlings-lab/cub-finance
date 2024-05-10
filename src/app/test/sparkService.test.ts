import { DAI, USDC, WETH } from "../contracts/ERC20Tokens";
import {
  baseSparkService,
  getBorrowRecommendations,
  getSupportedCollateralTokens,
  getSupportedDebtTokens
} from "../service/sparkService";
import { Protocol } from "../type/type";
import { verifyAaveOrSparkBorrowRecommendations } from "./testHelper";

describe("sparkService", () => {
  it("creates an instance of baseSparkService", () => {
    expect(baseSparkService).toBeDefined();
  });

  describe("getSupportedDebtTokens", () => {
    it("provides distinct list of supported debt tokens", async () => {
      const tokens = await getSupportedDebtTokens();
      // console.log("Supported debt tokens: ", tokens);

      expect(tokens).toBeDefined();
      expect(tokens.length).toBeGreaterThan(0);

      const uniqueAddresses = tokens.map((token) => token.address);
      const setOfAddresses = new Set(uniqueAddresses);

      expect(setOfAddresses.size).toBe(uniqueAddresses.length);
    });
  });

  describe("get supported collateral tokens", () => {
    it("provides distinct list of supported collateral tokens", async () => {
      const tokens = await getSupportedCollateralTokens();
      // console.log("Supported collateral tokens: ", tokens);

      expect(tokens).toBeDefined();
      expect(tokens.length).toBeGreaterThan(0);

      const uniqueAddresses = tokens.map((token) => token.address);
      const setOfAddresses = new Set(uniqueAddresses);

      expect(setOfAddresses.size).toBe(uniqueAddresses.length);
    });
  });

  describe("getBorrowRecommendations", () => {
    it("provides borrow recommendations for USDC debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH,
        amount: BigInt(1.1 * 10 ** WETH.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        [USDC],
        [wethCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyAaveOrSparkBorrowRecommendations(
        Protocol.Spark,
        borrowRecommendations,
        USDC,
        wethCollateralAmount
      );
    });

    it("provides borrow recommendations for DAI debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH,
        amount: BigInt(2.1 * 10 ** WETH.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        [DAI],
        [wethCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyAaveOrSparkBorrowRecommendations(
        Protocol.Spark,
        borrowRecommendations,
        DAI,
        wethCollateralAmount
      );
    });
  });
});
