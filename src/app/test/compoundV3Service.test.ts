import { TEST_DEBT_POSITION_ADDRESSES } from "../constants";
import {
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_CUSDC_CONTRACT,
  COMPOUND_V3_CWETH_CONTRACT,
  COMPOUND_V3_CUSDC_COLLATERALS,
  COMPOUND_V3_CWETH_COLLATERALS
} from "../contracts/compoundV3";
import { USDC, WBTC, WETH, wstETH } from "../contracts/ERC20Tokens";
import {
  getUtilizationRatio,
  getCollateralsByUserAddress,
  getBorrowBalance,
  getSupportedCollateralByMarket,
  getCollateralBalance,
  calculateTokenAmount,
  getPriceFeedFromTokenSymbol,
  getBorrowRecommendations
} from "../service/compoundV3Service";

import dotenv from "dotenv";
import { verifyCompoundBorrowRecommendations } from "./testHelper";
dotenv.config();

describe("compoundV3Service", () => {
  test("getUtilizationRatio function should return the utilization ratio for a given debt token address", async () => {
    const cusdcUtilizationRatio = await getUtilizationRatio(USDC.address);
    const cwethUtilizationRatio = await getUtilizationRatio(WETH.address);

    expect(typeof cusdcUtilizationRatio).toBe("number");
    expect(typeof cwethUtilizationRatio).toBe("number");
  });

  test("getCollateralsByUserAddress function should return an array of TokenAmount for for CUSDC contract", async () => {
    const collaterals = await getCollateralsByUserAddress(
      COMPOUND_V3_CUSDC_CONTRACT,
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );

    expect(Array.isArray(collaterals)).toBe(true);
    collaterals.forEach((collateral) => {
      expect(collateral).toHaveProperty("token");
      expect(collateral).toHaveProperty("amount");
      expect(collateral).toHaveProperty("amountInUSD");
    });
  });

  test("getCollateralsByUserAddress function should return an array of TokenAmount for CWETH contract", async () => {
    const collaterals = await getCollateralsByUserAddress(
      COMPOUND_V3_CWETH_CONTRACT,
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );
    expect(Array.isArray(collaterals)).toBe(true);
    collaterals.forEach((collateral) => {
      expect(collateral).toHaveProperty("token");
      expect(collateral).toHaveProperty("amount");
      expect(collateral).toHaveProperty("amountInUSD");
    });
  });

  test("getBorrowBalance function should return a bigint value for CUSDC contract", async () => {
    const borrowBalanceCUSDC = await getBorrowBalance(
      COMPOUND_V3_CUSDC_CONTRACT,
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );
    expect(typeof borrowBalanceCUSDC).toBe("bigint");
  });

  test("getBorrowBalance function should return a bigint value for CWETH contract", async () => {
    const borrowBalanceCWETH = await getBorrowBalance(
      COMPOUND_V3_CWETH_CONTRACT,
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );
    expect(typeof borrowBalanceCWETH).toBe("bigint");
  });

  test("getSupportedCollateralByMarket function should return an array of Token for CUSDC and CWETH", () => {
    const supportedCollateralsCUSDC = getSupportedCollateralByMarket(
      COMPOUND_V3_CUSDC_ADDRESS
    );
    expect(Array.isArray(supportedCollateralsCUSDC)).toBe(true);
    supportedCollateralsCUSDC.forEach((collateral) => {
      expect(collateral).toHaveProperty("address");
      expect(collateral).toHaveProperty("symbol");
      expect(collateral).toHaveProperty("decimals");
      expect(collateral).toHaveProperty("name");
    });

    const supportedCollateralsCWETH = getSupportedCollateralByMarket(
      COMPOUND_V3_CWETH_ADDRESS
    );
    expect(Array.isArray(supportedCollateralsCWETH)).toBe(true);
    supportedCollateralsCWETH.forEach((collateral) => {
      expect(collateral).toHaveProperty("address");
      expect(collateral).toHaveProperty("symbol");
      expect(collateral).toHaveProperty("decimals");
      expect(collateral).toHaveProperty("name");
    });
  });

  test("getCollateralBalance function should return a bigint value for CUSDC contract", async () => {
    const collateralBalancesCUSDC = [];
    for (const collateral of COMPOUND_V3_CUSDC_COLLATERALS) {
      const collateralBalance = await getCollateralBalance(
        COMPOUND_V3_CUSDC_CONTRACT,
        TEST_DEBT_POSITION_ADDRESSES.compoundUser2,
        collateral.address
      );
      collateralBalancesCUSDC.push(collateralBalance);
      expect(typeof collateralBalance).toBe("bigint");
    }
    expect(
      collateralBalancesCUSDC.every((balance) => typeof balance === "bigint")
    ).toBe(true);
  });

  test("getCollateralBalance function should return a bigint value for CWETH contract", async () => {
    const collateralBalancesCWETH = [];
    for (const collateral of COMPOUND_V3_CWETH_COLLATERALS) {
      const collateralBalance = await getCollateralBalance(
        COMPOUND_V3_CWETH_CONTRACT,
        TEST_DEBT_POSITION_ADDRESSES.compoundUser2,
        collateral.address
      );
      collateralBalancesCWETH.push(collateralBalance);
      expect(typeof collateralBalance).toBe("bigint");
    }
    expect(
      collateralBalancesCWETH.every((balance) => typeof balance === "bigint")
    ).toBe(true);
  });

  it("should calculate correct USDC amount", async () => {
    const amount: bigint = await calculateTokenAmount(
      COMPOUND_V3_CUSDC_CONTRACT,
      getPriceFeedFromTokenSymbol("USDC"),
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
      getPriceFeedFromTokenSymbol("WETH"),
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
