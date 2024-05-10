"use server";

import { Address } from "abitype";
import { getUserDebtDetails as getAaveDebtDetails } from "@/app/service/aaveV3Service";
import { getUserDebtDetails as getSparkDebtDetails } from "@/app/service/sparkService";
import { getCompoundV3UserDebtDetails as getCompoundV3DebtDetails } from "@/app/service/compoundV3Service";
import { getMorphoBlueUserDebtDetails as getMorphoBlueDebtDetails } from "@/app/service/morphoBlueService";
import {
  CompoundV3Market,
  CompoundV3UserDebtDetails,
  DebtPositionTableRow,
  Market,
  MorphoBlueMarket,
  MorphoBlueUserDebtDetails,
  Protocol,
  UserDebtDetails
} from "@/app/type/type";

export async function getUserDebtPositions(address: Address) {
  console.log("Getting debt positions for address: ", address);
  if (!address) {
    throw new Error("User address is required to get debt positions");
  }

  // Call all protocol services to get user debt positions
  return await Promise.all([
    getAaveDebtDetails(address),
    getSparkDebtDetails(address),
    getCompoundV3DebtDetails(address),
    getMorphoBlueDebtDetails(1, address)
  ]).then((results) => {
    const allDebtPositions: DebtPositionTableRow[] = [];

    // Filter out null debt positions
    results.forEach((result) => {
      if (result && result.debtPositions.length > 0) {
        switch (result.protocol) {
          case Protocol.AaveV3:
            allDebtPositions.push(
              ...convertAaveOrSparkDebtPositions(result as UserDebtDetails)
            );
            break;
          case Protocol.Spark:
            allDebtPositions.push(
              ...convertAaveOrSparkDebtPositions(result as UserDebtDetails)
            );
            break;
          case Protocol.CompoundV3:
            allDebtPositions.push(
              ...convertCompoundDebtPositions(
                result as CompoundV3UserDebtDetails
              )
            );
            break;
          case Protocol.MorphoBlue:
            allDebtPositions.push(
              ...convertMorphoDebtPositions(result as MorphoBlueUserDebtDetails)
            );
            break;
        }
      }
    });

    return allDebtPositions;
  });
}

function convertAaveOrSparkDebtPositions(
  userDebtDetails: UserDebtDetails
): DebtPositionTableRow[] {
  const marketMap: Map<string, Market> = userDebtDetails.markets.reduce(
    (map, market) => {
      map.set(market.underlyingAsset.address.toLowerCase(), market);
      return map;
    },
    new Map<string, Market>()
  );

  const debtPositionTableRows: DebtPositionTableRow[] =
    userDebtDetails.debtPositions.map((debtPosition, index) => {
      const debtMarket = marketMap.get(
        debtPosition.debts[0].token.address.toLowerCase()
      )!;

      const uniqueId =
        userDebtDetails.protocol +
        debtPosition.debts.map((debtToken) => debtToken.token.symbol).join("") +
        debtPosition.collaterals
          .map((collateral) => collateral.token.symbol)
          .join("");

      return {
        id: uniqueId,
        protocol: userDebtDetails.protocol,
        debtPosition: debtPosition,
        debtToken: debtPosition.debts.map((debt) => debt.token),
        collaterals: debtPosition.collaterals,
        collateralTokens: debtPosition.collaterals.map(
          (collateral) => collateral.token
        ),
        totalDebtAmountInUSD: debtPosition.debts.reduce(
          (sum, debt) => sum + debt.amountInUSD,
          0
        ),
        totalCollateralAmountInUSD: debtPosition.collaterals.reduce(
          (sum, collateral) => sum + collateral.amountInUSD,
          0
        ),
        LTV: debtPosition.LTV,
        maxLTV: debtPosition.maxLTV,
        trailing30DaysNetBorrowingAPY:
          debtPosition.trailing30DaysNetBorrowingAPY,
        trailing30DaysLendingAPY:
          debtPosition.weightedAvgTrailing30DaysLendingAPY,
        trailing30DaysBorrowingAPY: debtMarket.trailing30DaysBorrowingAPY,
        trailing30DaysRewardAPY:
          debtMarket.trailing30DaysBorrowingRewardAPY +
          debtPosition.weightedAvgTrailing30DaysLendingRewardAPY
      };
    });

  // if Aave3 has multiple debt positions, then 1st one is aggregated debt position
  // and rest are individual debt positions
  const aggregatedDebtPosition = debtPositionTableRows[0];
  if (debtPositionTableRows.length > 1) {
    aggregatedDebtPosition.subRows = debtPositionTableRows.splice(1);
  }

  return [aggregatedDebtPosition];
}

function convertCompoundDebtPositions(
  userDebtDetails: CompoundV3UserDebtDetails
): DebtPositionTableRow[] {
  const debtMarketsMap: Map<string, CompoundV3Market> =
    userDebtDetails.markets.reduce((map, market) => {
      map.set(market.debtToken.address.toLowerCase(), market);
      return map;
    }, new Map<string, CompoundV3Market>());

  return userDebtDetails.debtPositions.map((debtPosition) => {
    const debtMarket = debtMarketsMap.get(
      debtPosition.debt.token.address.toLowerCase()
    )!;
    const uniqueId =
      userDebtDetails.protocol +
      debtPosition.debt.token.symbol +
      debtPosition.collaterals
        .map((collateral) => collateral.token.symbol)
        .join("");

    const data = {
      id: uniqueId,
      protocol: userDebtDetails.protocol,
      debtPosition: debtPosition,
      debtToken: [debtPosition.debt.token],
      collaterals: debtPosition.collaterals,
      collateralTokens: debtPosition.collaterals.map(
        (collateral) => collateral.token
      ),
      totalDebtAmountInUSD: debtPosition.debt.amountInUSD,
      totalCollateralAmountInUSD: debtPosition.collaterals.reduce(
        (sum, collateral) => sum + collateral.amountInUSD,
        0
      ),
      LTV: debtPosition.LTV,
      maxLTV: debtPosition.maxLTV,
      trailing30DaysNetBorrowingAPY: debtPosition.trailing30DaysNetBorrowingAPY,
      trailing30DaysLendingAPY: 0,
      trailing30DaysBorrowingAPY: debtMarket.trailing30DaysBorrowingAPY,
      trailing30DaysRewardAPY: debtMarket.trailing30DaysBorrowingRewardAPY
    };
    return {
      ...data,
      subRows: undefined
    };
  });
}

function convertMorphoDebtPositions(
  userDebtDetails: MorphoBlueUserDebtDetails
): DebtPositionTableRow[] {
  const debtMarketsMap: Map<string, MorphoBlueMarket> =
    userDebtDetails.markets.reduce((map, market) => {
      map.set(market.marketId, market);
      return map;
    }, new Map<string, MorphoBlueMarket>());

  return userDebtDetails.debtPositions.map((debtPosition) => {
    const debtMarket = debtMarketsMap.get(debtPosition.marketId)!;
    const uniqueId =
      userDebtDetails.protocol +
      debtPosition.debt.token.symbol +
      debtPosition.collateral.token.symbol;

    const data = {
      id: uniqueId,
      protocol: userDebtDetails.protocol,
      debtPosition: debtPosition,
      debtToken: [debtPosition.debt.token],
      collaterals: [debtPosition.collateral],
      collateralTokens: [debtPosition.collateral.token],
      totalDebtAmountInUSD: debtPosition.debt.amountInUSD,
      totalCollateralAmountInUSD: debtPosition.collateral.amountInUSD,
      LTV: debtPosition.LTV,
      maxLTV: debtPosition.maxLTV,
      trailing30DaysNetBorrowingAPY: debtPosition.trailing30DaysNetBorrowingAPY,
      trailing30DaysLendingAPY: 0,
      trailing30DaysBorrowingAPY: debtMarket.trailing30DaysBorrowingAPY,
      trailing30DaysRewardAPY: debtMarket.trailing30DaysBorrowingRewardAPY
    };

    return {
      ...data,
      subRows: undefined
    };
  });
}
