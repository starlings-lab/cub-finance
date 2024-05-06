import { USDC, WETH } from "../contracts/ERC20Tokens";
import {
  baseAaveService,
  getBorrowRecommendations,
  getSupportedCollateralTokens,
  getSupportedDebtTokens
} from "../service/aaveV3Service";
import {
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";
import { verifyBorrowRecommendations } from "./testHelper";

describe("aaveService", () => {
  it("creates an instance of baseAaveService", () => {
    expect(baseAaveService).toBeDefined();
  });

  describe("getSupportedDebtTokens", () => {
    it("provides distinct list of supported debt tokens", async () => {
      const tokens = await getSupportedDebtTokens();
      const uniqueAddresses = tokens.map((token) => token.address);
      const setOfAddresses = new Set(uniqueAddresses);

      expect(setOfAddresses.size).toBe(uniqueAddresses.length);
    });
  });

  describe("get supported collateral tokens", () => {
    it("provides distinct list of supported collateral tokens", async () => {
      const tokens = await getSupportedCollateralTokens();
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

      verifyBorrowRecommendations(
        Protocol.AaveV3,
        borrowRecommendations,
        USDC,
        wethCollateralAmount
      );
    });

    it("provides borrow recommendations for WETH debt against USDC collateral", async () => {
      const usdcCollateralAmount = {
        token: USDC,
        amount: BigInt(10_000 * 10 ** USDC.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        [WETH],
        [usdcCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyBorrowRecommendations(
        Protocol.AaveV3,
        borrowRecommendations,
        WETH,
        usdcCollateralAmount
      );
    });
  });
});
