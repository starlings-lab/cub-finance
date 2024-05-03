import { USDC, WETH } from "../contracts/ERC20Tokens";
import { baseAaveService } from "../service/aaveV3Service";
import {
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";

describe("baseAaveService", () => {
  it("An instance of baseAaveService is created", () => {
    expect(baseAaveService).toBeDefined();
  });

  describe("getBorrowRecommendations", () => {
    it("Borrow recommendations for USDC debt against WETH collateral", async () => {
      const wethCollateralAmount = {
        token: WETH,
        amount: BigInt(1.1 * 10 ** 18),
        amountInUSD: 0
      };
      const borrowRecommendations =
        await baseAaveService.getBorrowRecommendations(
          [USDC],
          [wethCollateralAmount]
        );
      // console.dir(borrowRecommendations, { depth: null });

      verifyBorrowRecommendations(
        borrowRecommendations,
        USDC,
        wethCollateralAmount
      );
    });
  });
});

function verifyBorrowRecommendations(
  borrowRecommendations: RecommendedDebtDetail[],
  debtToken: Token,
  collateralAmount: TokenAmount
) {
  expect(borrowRecommendations).toBeDefined();
  expect(borrowRecommendations.length).toBe(1);
  const recommendation = borrowRecommendations[0];
  expect(recommendation).toBeDefined();
  expect(recommendation.protocol).toEqual(Protocol.AaveV3);
  const debt = recommendation.debt;
  expect(debt).toBeDefined();
  expect(debt.maxLTV).toBeGreaterThan(0);
  expect(debt.LTV).toEqual(debt.maxLTV);
  expect(debt.debts).toBeDefined();
  expect(debt.debts.length).toEqual(1);
  expect(debt.debts[0].token).toEqual(debtToken);
  expect(debt.debts[0].amount).toBeGreaterThan(0);
  expect(debt.debts[0].amountInUSD).toBeGreaterThan(0);
  expect(debt.collaterals).toBeDefined();
  expect(debt.collaterals.length).toEqual(1);
  expect(debt.collaterals[0].token).toEqual(collateralAmount.token);
  expect(debt.collaterals[0].amount).toEqual(collateralAmount.amount);
  expect(debt.collaterals[0].amountInUSD).toBeGreaterThan(0);
}
