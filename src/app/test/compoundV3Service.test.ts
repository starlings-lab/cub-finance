import {
  COMPOUND_V3_COLLATERALS_ETH_MAINNET,
  COMPOUND_V3_CUSDC_CONTRACT,
  COMPOUND_V3_CWETH_CONTRACT,
  COMPOUND_V3_DEBTS_ETH_MAINNET,
  getPriceFeedFromTokenSymbol
} from "../contracts/compoundV3";
import { USDC, WBTC, WETH, wstETH } from "../contracts/ERC20Tokens";
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

    const cusdcUtilizationRatio = utilizationRatioMap.get(
      USDC.address.toLowerCase() as Address
    );
    const cwethUtilizationRatio = utilizationRatioMap.get(
      WETH.address.toLowerCase() as Address
    );

    expect(cusdcUtilizationRatio).toBeLessThanOrEqual(1);
    expect(cwethUtilizationRatio).toBeLessThanOrEqual(1);
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
