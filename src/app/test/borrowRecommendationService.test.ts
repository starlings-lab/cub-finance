import { ethers } from "ethers";
import { USDC, WETH, cbETH, wstETH } from "../contracts/ERC20Tokens";
import { getBorrowRecommendations } from "../service/borrowRecommendationService";
import { BorrowRecommendationTableRow, Protocol } from "../type/type";
import { verifyBorrowRecommendationTableRow } from "./testHelper";
import { Address } from "abitype";

describe("borrowRecommendationService", () => {
  describe("getBorrowRecommendations", () => {
    it("provides borrow recommendations for USDC debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH,
        amount: BigInt(1.1 * 10 ** WETH.decimals),
        amountInUSD: 0
      };

      const borrowRecommendations = await getBorrowRecommendations(
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
        ethers.ZeroAddress as Address,
        [WETH],
        [wstEthCollateralAmount]
      );

      expect(borrowRecommendations).toBeDefined();

      // there should be at least 1 recommendation from each protocol
      expect(borrowRecommendations.length).toBeGreaterThanOrEqual(4);

      verifyEachProtocolHasRecommendation(borrowRecommendations);

      borrowRecommendations.forEach((recommendation) => {
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
