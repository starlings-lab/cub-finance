import { USDC, USDC_ARB, WETH, WETH_ARB } from "../contracts/ERC20Tokens";
import {
  baseAaveServiceArbMainNet,
  baseAaveServiceEthMainNet,
  getBorrowRecommendations,
  getSupportedCollateralTokens,
  getSupportedDebtTokens
} from "../service/aaveV3Service";
import { Protocol, Chain } from "../type/type";
import { verifyAaveOrSparkBorrowRecommendations } from "./testHelper";

describe("aaveService - EthMainNet", () => {
  it("creates an instance of baseAaveService", () => {
    expect(baseAaveServiceEthMainNet).toBeDefined();
  });

  describe("getSupportedDebtTokens", () => {
    it("provides distinct list of supported debt tokens", async () => {
      const tokens = await getSupportedDebtTokens(Chain.EthMainNet);
      const uniqueAddresses = tokens.map((token) => token.address);
      const setOfAddresses = new Set(uniqueAddresses);

      expect(setOfAddresses.size).toBe(uniqueAddresses.length);
    });
  });

  describe("get supported collateral tokens", () => {
    it("provides distinct list of supported collateral tokens", async () => {
      const tokens = await getSupportedCollateralTokens(Chain.EthMainNet);
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
        Chain.EthMainNet,
        [WETH],
        [usdcCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyAaveOrSparkBorrowRecommendations(
        Protocol.AaveV3,
        borrowRecommendations,
        WETH,
        usdcCollateralAmount
      );
    });
  });
});

describe("aaveService - ArbMainNet", () => {
  it("creates an instance of baseAaveService", () => {
    expect(baseAaveServiceArbMainNet).toBeDefined();
  });

  describe("getSupportedDebtTokens", () => {
    it("provides distinct list of supported debt tokens", async () => {
      const tokens = await getSupportedDebtTokens(Chain.ArbMainNet);
      const uniqueAddresses = tokens.map((token) => token.address);
      const setOfAddresses = new Set(uniqueAddresses);

      expect(setOfAddresses.size).toBe(uniqueAddresses.length);
    });
  });

  describe("get supported collateral tokens", () => {
    it("provides distinct list of supported collateral tokens", async () => {
      const tokens = await getSupportedCollateralTokens(Chain.ArbMainNet);
      // console.dir(tokens, { depth: null });
      const uniqueAddresses = tokens.map((token) => token.address);
      const setOfAddresses = new Set(uniqueAddresses);

      expect(setOfAddresses.size).toBe(uniqueAddresses.length);
    });
  });

  describe("getBorrowRecommendations", () => {
    it("provides borrow recommendations for USDC debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH_ARB,
        amount: BigInt(1.1 * 10 ** WETH_ARB.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.ArbMainNet,
        [USDC_ARB],
        [wethCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyAaveOrSparkBorrowRecommendations(
        Protocol.AaveV3,
        borrowRecommendations,
        USDC_ARB,
        wethCollateralAmount
      );
    });

    it("provides borrow recommendations for WETH debt against USDC collateral", async () => {
      const usdcCollateralAmount = {
        token: USDC_ARB,
        amount: BigInt(10_000 * 10 ** USDC_ARB.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.ArbMainNet,
        [WETH_ARB],
        [usdcCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyAaveOrSparkBorrowRecommendations(
        Protocol.AaveV3,
        borrowRecommendations,
        WETH_ARB,
        usdcCollateralAmount
      );
    });
  });
});
