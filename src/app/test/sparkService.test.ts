import { DAI, USDC, WETH } from "../contracts/ERC20Tokens";
import {
  baseSparkServiceEthMainNet,
  getBorrowRecommendations,
  getSupportedCollateralTokens,
  getSupportedDebtTokens
} from "../service/sparkService";
import { Chain, Protocol } from "../type/type";
import { verifyAaveOrSparkBorrowRecommendations } from "./testHelper";

describe("sparkService - ETH Mainnet", () => {
  it("creates an instance of baseSparkService", () => {
    expect(baseSparkServiceEthMainNet).toBeDefined();
  });

  describe("getSupportedDebtTokens", () => {
    it("provides distinct list of supported debt tokens", async () => {
      const tokens = await getSupportedDebtTokens(Chain.EthMainNet);
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
      const tokens = await getSupportedCollateralTokens(Chain.EthMainNet);
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
        Chain.EthMainNet,
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
        Chain.EthMainNet,
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

describe("sparkService - ARB Mainnet", () => {
  describe("getSupportedDebtTokens", () => {
    it("provides empty list of debt tokens", async () => {
      const tokens = await getSupportedDebtTokens(Chain.ArbMainNet);
      // console.log("Supported debt tokens: ", tokens);

      expect(tokens).toBeDefined();
      expect(tokens.length).toBe(0);
    });
  });

  describe("get supported collateral tokens", () => {
    it("provides empty list of collateral tokens", async () => {
      const tokens = await getSupportedCollateralTokens(Chain.ArbMainNet);
      // console.log("Supported collateral tokens: ", tokens);

      expect(tokens).toBeDefined();
      expect(tokens.length).toBe(0);
    });
  });

  describe("getBorrowRecommendations", () => {
    it("provides no borrow recommendations for USDC debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH,
        amount: BigInt(1.1 * 10 ** WETH.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.ArbMainNet,
        [USDC],
        [wethCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      expect(borrowRecommendations.length).toBe(0);
    });

    it("provides no borrow recommendations for DAI debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH,
        amount: BigInt(2.1 * 10 ** WETH.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.ArbMainNet,
        [DAI],
        [wethCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      expect(borrowRecommendations.length).toBe(0);
    });
  });
});
