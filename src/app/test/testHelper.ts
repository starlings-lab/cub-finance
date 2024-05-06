import { expect } from "@jest/globals";
import {
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";

export function verifyBorrowRecommendations(
  expectedProtocol: Protocol,
  borrowRecommendations: RecommendedDebtDetail[],
  debtToken: Token,
  collateralAmount: TokenAmount
) {
  expect(borrowRecommendations).toBeDefined();
  expect(borrowRecommendations.length).toBe(1);
  const recommendation = borrowRecommendations[0];
  expect(recommendation).toBeDefined();
  expect(recommendation.protocol).toEqual(expectedProtocol);
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
