import { ethers } from "ethers";
import {
  USDC,
  USDC_ARB,
  WETH,
  WETH_ARB,
  cbETH,
  wstETH,
  wstETH_ARB
} from "../contracts/ERC20Tokens";
import { getBorrowRecommendations } from "../service/borrowRecommendationService";
import { BorrowRecommendationTableRow, Chain, Protocol } from "../type/type";
import { verifyBorrowRecommendationTableRow } from "./testHelper";
import { Address } from "abitype";

describe("borrowRecommendationService - EthMainNet", () => {
  describe("getBorrowRecommendations", () => {
    it("provides borrow recommendations for USDC debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH,
        amount: BigInt(1.1 * 10 ** WETH.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.EthMainNet,
        ethers.ZeroAddress as Address,
        [USDC],
        [wethCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      expect(borrowRecommendations).toBeDefined();

      // there should be at least 1 recommendation from each protocol
      expect(borrowRecommendations.length).toBeGreaterThanOrEqual(4);

      verifyEachProtocolHasRecommendation(borrowRecommendations);

      borrowRecommendations.forEach((recommendation) => {
        verifyBorrowRecommendationTableRow(recommendation, USDC, [
          wethCollateralAmount
        ]);
      });
    });

    it("provides borrow recommendations for WETH debt against wstETH collateral", async () => {
      const wstEthCollateralAmount = {
        token: wstETH,
        amount: BigInt(10 * 10 ** wstETH.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.EthMainNet,
        ethers.ZeroAddress as Address,
        [WETH],
        [wstEthCollateralAmount]
      );

      expect(borrowRecommendations).toBeDefined();

      // there should be at least 1 recommendation from each protocol
      expect(borrowRecommendations.length).toBeGreaterThanOrEqual(4);

      verifyEachProtocolHasRecommendation(borrowRecommendations);

      borrowRecommendations.forEach((recommendation) => {
        // console.dir(recommendation, { depth: null });
        verifyBorrowRecommendationTableRow(recommendation, WETH, [
          wstEthCollateralAmount
        ]);
      });
    });

    // it("provides borrow recommendations for USDC debt against WETH & WBTC collateral", async () => {
    //   const wethCollateralAmount = {
    //     token: WETH,
    //     amount: BigInt(1.1 * 10 ** WETH.decimals),
    //     amountInUSD: 0
    //   };

    //   const wbtcCollateralAmount = {
    //     token: WBTC,
    //     amount: BigInt(2.1 * 10 ** WBTC.decimals),
    //     amountInUSD: 0
    //   };

    //   const borrowRecommendations = await getBorrowRecommendations(
    //     [USDC],
    //     [wethCollateralAmount, wbtcCollateralAmount]
    //   );
    //   // console.dir(borrowRecommendations, { depth: null });

    //   verifyCompoundBorrowRecommendations(borrowRecommendations, USDC, [
    //     wethCollateralAmount,
    //     wbtcCollateralAmount
    //   ]);
    // });
  });
});

describe("borrowRecommendationService - ArbMainNet", () => {
  describe("getBorrowRecommendations", () => {
    it("provides borrow recommendations for USDC debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH_ARB,
        amount: BigInt(1.1 * 10 ** WETH_ARB.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.ArbMainNet,
        ethers.ZeroAddress as Address,
        [USDC_ARB],
        [wethCollateralAmount]
      );
      // console.dir(borrowRecommendations, { depth: null });

      expect(borrowRecommendations).toBeDefined();

      // there should be 2 recommendations, from Aave V3 and Compound V3 protocol
      expect(borrowRecommendations.length).toBe(2);
      expect(
        borrowRecommendations.find((r) => r.protocol === Protocol.AaveV3)
      ).toBeDefined();
      expect(
        borrowRecommendations.find((r) => r.protocol === Protocol.CompoundV3)
      ).toBeDefined();

      borrowRecommendations.forEach((recommendation) => {
        verifyBorrowRecommendationTableRow(recommendation, USDC_ARB, [
          wethCollateralAmount
        ]);
      });
    });

    it("provides borrow recommendations for WETH debt against wstETH collateral", async () => {
      const wstEthCollateralAmount = {
        token: wstETH_ARB,
        amount: BigInt(10 * 10 ** wstETH_ARB.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
        Chain.ArbMainNet,
        ethers.ZeroAddress as Address,
        [WETH_ARB],
        [wstEthCollateralAmount]
      );

      expect(borrowRecommendations).toBeDefined();

      // there should be only 1 recommendation, from Aave V3 protocol
      expect(borrowRecommendations.length).toBe(1);
      expect(
        borrowRecommendations.find((r) => r.protocol === Protocol.AaveV3)
      ).toBeDefined();

      borrowRecommendations.forEach((recommendation) => {
        // console.dir(recommendation, { depth: null });
        verifyBorrowRecommendationTableRow(recommendation, WETH_ARB, [
          wstEthCollateralAmount
        ]);
      });
    });

    // it("provides borrow recommendations for USDC debt against WETH & WBTC collateral", async () => {
    //   const wethCollateralAmount = {
    //     token: WETH,
    //     amount: BigInt(1.1 * 10 ** WETH.decimals),
    //     amountInUSD: 0
    //   };

    //   const wbtcCollateralAmount = {
    //     token: WBTC,
    //     amount: BigInt(2.1 * 10 ** WBTC.decimals),
    //     amountInUSD: 0
    //   };

    //   const borrowRecommendations = await getBorrowRecommendations(
    //     [USDC],
    //     [wethCollateralAmount, wbtcCollateralAmount]
    //   );
    //   // console.dir(borrowRecommendations, { depth: null });

    //   verifyCompoundBorrowRecommendations(borrowRecommendations, USDC, [
    //     wethCollateralAmount,
    //     wbtcCollateralAmount
    //   ]);
    // });
  });
});

function verifyEachProtocolHasRecommendation(
  borrowRecommendations: BorrowRecommendationTableRow[]
) {
  [
    Protocol.AaveV3,
    Protocol.CompoundV3,
    Protocol.Spark,
    Protocol.MorphoBlue
  ].forEach((protocol) => {
    expect(
      borrowRecommendations.find((r) => r.protocol === protocol)
    ).toBeDefined();
  });
}
