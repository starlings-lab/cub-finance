"use server";

import {
  BorrowRecommendationTableRow,
  Chain,
  CompoundV3RecommendedDebtDetail,
  MorphoBlueRecommendedDebtDetail,
  Protocol,
  RecommendedDebtDetail,
  Token,
  TokenAmount
} from "../type/type";
import { getBorrowRecommendations as getAaveBorrowRecommendations } from "./aaveV3Service";
import { getBorrowRecommendations as getSparkBorrowRecommendations } from "./sparkService";
import { getBorrowRecommendations as getCompoundBorrowRecommendations } from "./compoundV3Service";
import { getBorrowRecommendations as getMorphoBorrowRecommendations } from "./morphoBlueService";
import { Address } from "abitype";
import { ETH, WETH } from "../contracts/ERC20Tokens";

/**
 * Provides borrow recommendations by aggregating all borrow recommendations from supported protocols
 * @param debtTokens
 * @param collaterals
 * @returns
 */
export async function getBorrowRecommendations(
  chain: Chain,
  userAddress: Address,
  debtTokens: Token[],
  collaterals: TokenAmount[]
): Promise<BorrowRecommendationTableRow[]> {
  const start = Date.now();

  // If the user has ETH as a collateral, we need to get borrow recommendations as WETH
  const ethCollateral = collaterals.find(
    (collateral) => collateral.token.address === ETH.address
  );
  if (ethCollateral) {
    ethCollateral.token = {
      ...ETH,
      address: WETH.address
    };
  }

  // Call all protocol services to get debt recommendations
  return await Promise.all([
    getAaveBorrowRecommendations(chain, debtTokens, collaterals).then(
      (results) => {
        console.log(
          `Time taken to get AAVE v3 borrow recommendations for user ${userAddress}: ${
            Date.now() - start
          } ms`
        );
        return results;
      }
    ),
    getCompoundBorrowRecommendations(debtTokens, collaterals).then(
      (results) => {
        console.log(
          `Time taken to get Compound borrow recommendations for user ${userAddress}: ${
            Date.now() - start
          } ms`
        );
        return results;
      }
    ),
    getSparkBorrowRecommendations(chain, debtTokens, collaterals).then(
      (results) => {
        console.log(
          `Time taken to get Spark borrow recommendations for user ${userAddress}: ${
            Date.now() - start
          } ms`
        );
        return results;
      }
    ),
    getMorphoBorrowRecommendations(chain, debtTokens, collaterals).then(
      (results) => {
        console.log(
          `Time taken to get Morpho borrow recommendations for user ${userAddress}: ${
            Date.now() - start
          } ms`
        );
        return results;
      }
    )
  ])
    .then((recommendationResults) => {
      console.log(
        `Time taken to get all borrow recommendations for user ${userAddress}: ${
          Date.now() - start
        } ms`
      );
      const allRecommendations: (
        | RecommendedDebtDetail
        | MorphoBlueRecommendedDebtDetail
        | CompoundV3RecommendedDebtDetail
      )[] = [];

      const allRecommendationsConverted: BorrowRecommendationTableRow[] = [];

      // Filter out null or empty recommendations
      recommendationResults
        .filter(
          (recommendationResult) =>
            recommendationResult !== null && recommendationResult.length > 0
        )
        .forEach((recommendationResult) => {
          recommendationResult.forEach((r) => allRecommendations.push(r));
        });

      allRecommendations.forEach((result) => {
        if (result) {
          switch (result.protocol) {
            case Protocol.AaveV3:
            case Protocol.Spark:
              allRecommendationsConverted.push(
                convertAaveOrSparkBorrowRecommendation(
                  result as RecommendedDebtDetail
                )
              );
              break;
            case Protocol.CompoundV3:
              allRecommendationsConverted.push(
                convertCompoundBorrowRecommendation(
                  result as CompoundV3RecommendedDebtDetail
                )
              );
              break;
            case Protocol.MorphoBlue:
              allRecommendationsConverted.push(
                convertMorphoRecommendedDebtDetail(
                  result as MorphoBlueRecommendedDebtDetail
                )
              );
              break;
          }
        }
      });

      return allRecommendationsConverted;
    })
    .catch((error) => {
      console.error("Error fetching borrow recommendations: ", error);
      throw error;
    });
}

function convertAaveOrSparkBorrowRecommendation(
  borrowRecommendation: RecommendedDebtDetail
): BorrowRecommendationTableRow {
  const tableRow: BorrowRecommendationTableRow = {
    protocol: borrowRecommendation.protocol,
    debt: borrowRecommendation.debt.debts[0],
    debtToken: borrowRecommendation.debt.debts[0].token,
    collaterals: borrowRecommendation.debt.collaterals,
    collateralTokens: borrowRecommendation.debt.collaterals.map(
      (collateral) => collateral.token
    ),
    maxDebtAmountInUSD: borrowRecommendation.debt.debts.reduce(
      (sum, debt) => sum + debt.amountInUSD,
      0
    ),
    totalCollateralAmountInUSD: borrowRecommendation.debt.collaterals.reduce(
      (sum, collateral) => sum + collateral.amountInUSD,
      0
    ),
    maxLTV: borrowRecommendation.debt.maxLTV,
    trailing30DaysNetBorrowingAPY:
      borrowRecommendation.debt.trailing30DaysNetBorrowingAPY,
    trailing30DaysLendingAPY:
      borrowRecommendation.debt.weightedAvgTrailing30DaysLendingAPY,
    trailing30DaysBorrowingAPY:
      borrowRecommendation.market.trailing30DaysBorrowingAPY,
    trailing30DaysRewardAPY:
      borrowRecommendation.market.trailing30DaysBorrowingRewardAPY +
      borrowRecommendation.debt.weightedAvgTrailing30DaysLendingRewardAPY
  };

  return tableRow;
}

function convertCompoundBorrowRecommendation(
  borrowRecommendation: CompoundV3RecommendedDebtDetail
): BorrowRecommendationTableRow {
  const tableRow: BorrowRecommendationTableRow = {
    protocol: borrowRecommendation.protocol,
    debt: borrowRecommendation.debt.debt,
    debtToken: borrowRecommendation.debt.debt.token,
    collaterals: borrowRecommendation.debt.collaterals,
    collateralTokens: borrowRecommendation.debt.collaterals.map(
      (collateral) => collateral.token
    ),
    maxDebtAmountInUSD: borrowRecommendation.debt.debt.amountInUSD,
    totalCollateralAmountInUSD: borrowRecommendation.debt.collaterals.reduce(
      (sum, collateral) => sum + collateral.amountInUSD,
      0
    ),
    maxLTV: borrowRecommendation.debt.maxLTV,
    trailing30DaysNetBorrowingAPY:
      borrowRecommendation.debt.trailing30DaysNetBorrowingAPY,
    trailing30DaysLendingAPY: 0,
    trailing30DaysBorrowingAPY:
      borrowRecommendation.market.trailing30DaysBorrowingAPY,
    trailing30DaysRewardAPY:
      borrowRecommendation.market.trailing30DaysBorrowingRewardAPY
  };

  return tableRow;
}

function convertMorphoRecommendedDebtDetail(
  borrowRecommendation: MorphoBlueRecommendedDebtDetail
): BorrowRecommendationTableRow {
  const tableRow: BorrowRecommendationTableRow = {
    protocol: borrowRecommendation.protocol,
    debt: borrowRecommendation.debt.debt,
    debtToken: borrowRecommendation.debt.debt.token,
    collaterals: [borrowRecommendation.debt.collateral],
    collateralTokens: [borrowRecommendation.debt.collateral.token],
    maxDebtAmountInUSD: borrowRecommendation.debt.debt.amountInUSD,
    totalCollateralAmountInUSD:
      borrowRecommendation.debt.collateral.amountInUSD,
    maxLTV: borrowRecommendation.debt.maxLTV,
    trailing30DaysNetBorrowingAPY:
      borrowRecommendation.debt.trailing30DaysNetBorrowingAPY,
    trailing30DaysLendingAPY: 0,
    trailing30DaysBorrowingAPY:
      borrowRecommendation.market.trailing30DaysBorrowingAPY,
    trailing30DaysRewardAPY:
      borrowRecommendation.market.trailing30DaysBorrowingRewardAPY
  };

  return tableRow;
}
