import {
  COMPOUND_V3_COLLATERALS_ARB_MAINNET,
  COMPOUND_V3_COLLATERALS_ETH_MAINNET,
  COMPOUND_V3_CUSDC_ADDRESS_ARB_MAINNET,
  COMPOUND_V3_CUSDC_BRIDGED_CONTRACT_ARB_MAINNET,
  COMPOUND_V3_CUSDC_CONTRACT,
  COMPOUND_V3_CUSDC_CONTRACT_ARB_MAINNET,
  COMPOUND_V3_CWETH_CONTRACT,
  COMPOUND_V3_DEBTS_ARB_MAINNET,
  COMPOUND_V3_DEBTS_ETH_MAINNET,
  getPriceFeedFromTokenSymbol
} from "../contracts/compoundV3";
import {
  USDC,
  USDC_ARB,
  USDC_BRIDGED_ARB,
  WBTC,
  WBTC_ARB,
  WETH,
  WETH_ARB,
  wstETH
} from "../contracts/ERC20Tokens";
import {
  calculateTokenAmount,
  getBorrowRecommendations,
  getSupportedCollateralTokens,
  getSupportedDebtTokens,
  getUtilizationRatioMapByDebtTokenAddress
} from "../service/compoundV3Service";

import dotenv from "dotenv";
import { verifyCompoundBorrowRecommendations } from "./testHelper";
import { Chain } from "../type/type";
import { Address } from "abitype";
dotenv.config();

describe("compoundV3Service - ETH Mainnet", () => {
  test("getSupportedDebtTokens function should return the supported debt tokens", async () => {
    const supportedDebtTokens = await getSupportedDebtTokens(Chain.EthMainNet);
    expect(supportedDebtTokens.length).toEqual(
      COMPOUND_V3_DEBTS_ETH_MAINNET.length
    );
    COMPOUND_V3_DEBTS_ETH_MAINNET.forEach((debtToken) => {
      expect(supportedDebtTokens).toContain(debtToken);
    });
  });

  test("getSupportedCollateralTokens function should return the supported collateral tokens", async () => {
    const supportedCollateralTokens = await getSupportedCollateralTokens(
      Chain.EthMainNet
    );
    expect(supportedCollateralTokens.length).toEqual(
      COMPOUND_V3_COLLATERALS_ETH_MAINNET.length
    );
    COMPOUND_V3_COLLATERALS_ETH_MAINNET.forEach((collateralToken) => {
      expect(supportedCollateralTokens).toContain(collateralToken);
    });
  });

  test("getUtilizationRatioMapByDebtTokenAddress function should return the utilization ratio for a given debt token address", async () => {
    const supportedDebtTokens = await getSupportedDebtTokens(Chain.EthMainNet);
    const utilizationRatioMap = await getUtilizationRatioMapByDebtTokenAddress(
      Chain.EthMainNet,
      supportedDebtTokens
    );
    // console.log(utilizationRatioMap);

    supportedDebtTokens.forEach((debtToken) => {
      const utilizationRatio = utilizationRatioMap.get(
        debtToken.address.toLowerCase() as Address
      );
      expect(utilizationRatio).toBeLessThanOrEqual(1);
    });
  });

  it("should calculate correct USDC amount", async () => {
    const amount: bigint = await calculateTokenAmount(
      COMPOUND_V3_CUSDC_CONTRACT,
      getPriceFeedFromTokenSymbol(Chain.EthMainNet, "USDC"),
      1000,
      USDC
    );
    const expectedAmount = Number(amount / BigInt(10 ** USDC.decimals));
    expect(expectedAmount).toBeGreaterThanOrEqual(999);
    expect(expectedAmount).toBeLessThan(1001);
  });

  it("should calculate correct WETH amount", async () => {
    const amount: bigint = await calculateTokenAmount(
      COMPOUND_V3_CWETH_CONTRACT,
      getPriceFeedFromTokenSymbol(Chain.EthMainNet, "WETH"),
      3200, // amount in USD
      WETH
    );
    expect(amount).toBeGreaterThan(0);
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

      verifyCompoundBorrowRecommendations(borrowRecommendations, USDC, [
        wethCollateralAmount
      ]);
    });

    it("provides borrow recommendations for WETH debt against wstETH collateral", async () => {
      const wstEthCollateralAmount = {
        token: wstETH,
        amount: BigInt(10 * 10 ** wstETH.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.EthMainNet,
        [WETH],
        [wstEthCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyCompoundBorrowRecommendations(borrowRecommendations, WETH, [
        wstEthCollateralAmount
      ]);
    });

    it("provides borrow recommendations for USDC debt against WETH & WBTC collateral", async () => {
      const wethCollateralAmount = {
        token: WETH,
        amount: BigInt(1.1 * 10 ** WETH.decimals),
        amountInUSD: 0
      };

      const wbtcCollateralAmount = {
        token: WBTC,
        amount: BigInt(2.1 * 10 ** WBTC.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.EthMainNet,
        [USDC],
        [wethCollateralAmount, wbtcCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyCompoundBorrowRecommendations(borrowRecommendations, USDC, [
        wethCollateralAmount,
        wbtcCollateralAmount
      ]);
    });
  });
});

describe("compoundV3Service - ARB Mainnet", () => {
  test("getSupportedDebtTokens function should return the supported debt tokens", async () => {
    const supportedDebtTokens = await getSupportedDebtTokens(Chain.ArbMainNet);
    expect(supportedDebtTokens.length).toEqual(
      COMPOUND_V3_DEBTS_ARB_MAINNET.length
    );
    COMPOUND_V3_DEBTS_ARB_MAINNET.forEach((debtToken) => {
      expect(supportedDebtTokens).toContain(debtToken);
    });
  });

  test("getSupportedCollateralTokens function should return the supported collateral tokens", async () => {
    const supportedCollateralTokens = await getSupportedCollateralTokens(
      Chain.ArbMainNet
    );
    expect(supportedCollateralTokens.length).toEqual(
      COMPOUND_V3_COLLATERALS_ARB_MAINNET.length
    );
    COMPOUND_V3_COLLATERALS_ARB_MAINNET.forEach((collateralToken) => {
      expect(supportedCollateralTokens).toContain(collateralToken);
    });
  });

  test("getUtilizationRatioMapByDebtTokenAddress function should return the utilization ratio for a given debt token address", async () => {
    const supportedDebtTokens = await getSupportedDebtTokens(Chain.ArbMainNet);
    const utilizationRatioMap = await getUtilizationRatioMapByDebtTokenAddress(
      Chain.ArbMainNet,
      supportedDebtTokens
    );
    // console.log(utilizationRatioMap);
    supportedDebtTokens.forEach((debtToken) => {
      const utilizationRatio = utilizationRatioMap.get(
        debtToken.address.toLowerCase() as Address
      );
      expect(utilizationRatio).toBeLessThanOrEqual(1);
    });
  });

  it("should calculate correct USDC amount", async () => {
    const amount: bigint = await calculateTokenAmount(
      COMPOUND_V3_CUSDC_CONTRACT_ARB_MAINNET,
      getPriceFeedFromTokenSymbol(Chain.ArbMainNet, USDC_ARB.symbol),
      1000,
      USDC_ARB
    );
    const expectedAmount = Number(amount / BigInt(10 ** USDC_ARB.decimals));
    expect(expectedAmount).toBeGreaterThanOrEqual(999);
    expect(expectedAmount).toBeLessThan(1001);
  });

  it("should calculate correct USDC Bridged amount", async () => {
    const amount: bigint = await calculateTokenAmount(
      COMPOUND_V3_CUSDC_BRIDGED_CONTRACT_ARB_MAINNET,
      getPriceFeedFromTokenSymbol(Chain.ArbMainNet, USDC_BRIDGED_ARB.symbol),
      1000,
      USDC_BRIDGED_ARB
    );
    const expectedAmount = Number(
      amount / BigInt(10 ** USDC_BRIDGED_ARB.decimals)
    );
    expect(expectedAmount).toBeGreaterThanOrEqual(999);
    expect(expectedAmount).toBeLessThan(1001);
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

      verifyCompoundBorrowRecommendations(borrowRecommendations, USDC_ARB, [
        wethCollateralAmount
      ]);
    });

    it("provides borrow recommendations for USDC Bridged debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH_ARB,
        amount: BigInt(1.1 * 10 ** WETH_ARB.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.ArbMainNet,
        [USDC_BRIDGED_ARB],
        [wethCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyCompoundBorrowRecommendations(
        borrowRecommendations,
        USDC_BRIDGED_ARB,
        [wethCollateralAmount]
      );
    });

    it("provides borrow recommendations for USDC debt against WETH & WBTC collateral", async () => {
      const wethCollateralAmount = {
        token: WETH_ARB,
        amount: BigInt(1.1 * 10 ** WETH_ARB.decimals),
        amountInUSD: 0
      };

      const wbtcCollateralAmount = {
        token: WBTC_ARB,
        amount: BigInt(2.1 * 10 ** WBTC_ARB.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.ArbMainNet,
        [USDC_ARB],
        [wethCollateralAmount, wbtcCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      verifyCompoundBorrowRecommendations(borrowRecommendations, USDC_ARB, [
        wethCollateralAmount,
        wbtcCollateralAmount
      ]);
    });
  });
});
