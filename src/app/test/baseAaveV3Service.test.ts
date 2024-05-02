import { USDC, WETH } from "../contracts/ERC20Tokens";
import { baseAaveService } from "../service/aaveV3Service";
import { Protocol, RecommendedDebtDetail } from "../type/type";

test("An instance of baseAaveService is created", () => {
  expect(baseAaveService).toBeDefined();
});

test("getBorrowRecommendations", async () => {
  const wethCollateralAmount = BigInt(1.1 * 10 ** 18);
  const borrowRecommendations = await baseAaveService.getBorrowRecommendations(
    [USDC],
    [
      {
        token: WETH,
        amount: wethCollateralAmount,
        amountInUSD: 0
      }
    ]
  );
  // console.dir(borrowRecommendations, { depth: null });

  verifyBorrowRecommendations(borrowRecommendations, wethCollateralAmount);
});

function verifyBorrowRecommendations(
  borrowRecommendations: RecommendedDebtDetail[],
  collateralAmount: bigint
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
  expect(debt.debts[0].token).toEqual(USDC);
  expect(debt.debts[0].amount).toBeGreaterThan(0);
  expect(debt.debts[0].amountInUSD).toBeGreaterThan(0);
  expect(debt.collaterals).toBeDefined();
  expect(debt.collaterals.length).toEqual(1);
  expect(debt.collaterals[0].token).toEqual(WETH);
  expect(debt.collaterals[0].amount).toEqual(collateralAmount);
  expect(debt.collaterals[0].amountInUSD).toBeGreaterThan(0);
}
