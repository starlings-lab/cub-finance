import type { Address } from "abitype";
import { request, gql } from "graphql-request";
import {
  DebtPosition,
  MorphoBlueDebtPosition,
  CompoundV3DebtPosition,
  MorphoBlueMarket,
  MorphoBlueUserDebtDetails,
  Protocol,
  MorphoBlueRecommendedDebtDetail,
  TokenAmount
} from "../type/type";
import { MORPHO_GRAPHQL_URL } from "../constants";

export async function getMorphoBlueUserDebtDetails(
  chainId: number,
  address: Address
): Promise<MorphoBlueUserDebtDetails> {
  const query = gql`
    query {
      userByAddress(chainId: ${chainId}, address: "${address}") {
        marketPositions {
          market {
            uniqueKey
          }
          borrowAssets
          borrowAssetsUsd
          collateral
          collateralUsd
          healthFactor
          market {
            lltv
            loanAsset {
              address
              name
              decimals
              symbol
            }
            collateralAsset {
              address
              name
              decimals
              symbol
            }
            monthlyApys {
              borrowApy
            }
            state {
              utilization
            }          
          }
        }
      }
    }
  `;

  return request(MORPHO_GRAPHQL_URL, query)
    .then((queryResult) =>
      parseMarketPositionsQueryResult(queryResult, address)
    )
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

function parseMarketPositionsQueryResult(
  queryResult: any,
  address: Address
): MorphoBlueUserDebtDetails {
  // Parse out the debt positions and markets
  const markets: Map<string, MorphoBlueMarket> = new Map();
  const debtPositions: MorphoBlueDebtPosition[] = [];
  queryResult.userByAddress.marketPositions.forEach((position: any) => {
    const market: MorphoBlueMarket = {
      marketId: position.market.uniqueKey,
      utilizationRatio: position.market.state.utilization,
      maxLTV: Number(position.market.lltv / 10 ** 18),
      debtToken: position.market.loanAsset,
      collateralToken: position.market.collateralAsset,
      trailing30DaysBorrowingAPY: position.market.monthlyApys.borrowApy
    };
    markets.set(market.marketId, market);

    debtPositions.push({
      maxLTV: position.market.lltv / 10 ** 18,
      LTV: position.borrowAssetsUsd / position.collateralUsd,
      marketId: position.market.uniqueKey,
      debt: {
        token: position.market.loanAsset,
        amount: position.borrowAssets,
        amountInUSD: position.borrowAssetsUsd
      },
      collateral: {
        token: position.market.collateralAsset,
        amount: position.collateral,
        amountInUSD: position.collateralUsd
      }
    });
  });

  return {
    protocol: Protocol.MorphoBlue,
    userAddress: address,
    markets: Array.from(markets.values()),
    debtPositions
  };
}

function getMarkets(): Promise<MorphoBlueMarket[]> {
  const query = gql`
    query {
      markets {
        items {
          uniqueKey
          lltv
          loanAsset {
            address
            name
            decimals
            symbol
          }
          collateralAsset {
            address
            name
            decimals
            symbol
          }
          state {
            utilization
          }
          monthlyApys {
            borrowApy
          }
        }
      }
    }
  `;

  return request(MORPHO_GRAPHQL_URL, query)
    .then((queryResult) => parseMarketsQueryResult(queryResult))
    .catch((error) => {
      console.error(error);
      throw error;
    });
}

function parseMarketsQueryResult(queryResult: any): MorphoBlueMarket[] {
  const markets: MorphoBlueMarket[] = [];
  queryResult.markets.items.forEach((market: any) => {
    markets.push({
      marketId: market.uniqueKey,
      debtToken: market.loanAsset,
      collateralToken: market.collateralAsset,
      trailing30DaysBorrowingAPY: market.monthlyApys.borrowApy,
      utilizationRatio: market.state.utilization,
      maxLTV: Number(market.lltv / 10 ** 18)
    });
  });

  return markets;
}

export async function getRecommendedDebtDetail(
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition,
  protocol: Protocol
): Promise<MorphoBlueRecommendedDebtDetail[] | null> {
  const markets: MorphoBlueMarket[] = await getMarkets();

  // check if the debt token is in the markets
  const debtTokenMatchedMarkets = markets.filter((market) => {
    if (protocol === Protocol.AaveV3 || protocol === Protocol.Spark) {
      return (debtPosition.debt as TokenAmount[]).some(
        (debt) => market.debtToken.address === debt.token.address
      );
    }
    return (
      market.debtToken.address ===
      (debtPosition.debt as TokenAmount).token.address
    );
  });

  // check if the collateral tokens are in the markets
  let collateralTokenMatchedMarkets: MorphoBlueMarket[] = [];
  if (debtTokenMatchedMarkets.length > 0) {
    collateralTokenMatchedMarkets = debtTokenMatchedMarkets.filter(
      (debtTokenMatchedMarket) => {
        if (
          protocol === Protocol.AaveV3 ||
          protocol === Protocol.Spark ||
          protocol === Protocol.CompoundV3
        ) {
          return (
            (debtPosition as DebtPosition) ||
            (debtPosition as CompoundV3DebtPosition)
          ).collaterals.some(
            (collateral) =>
              debtTokenMatchedMarket.collateralToken.address ===
              collateral.token.address
          );
        }
        return (
          debtTokenMatchedMarket.collateralToken.address ===
          (debtPosition as MorphoBlueDebtPosition).collateral.token.address
        );
      }
    );
  } else if (debtTokenMatchedMarkets.length === 0) {
    return null;
  }

  if (collateralTokenMatchedMarkets.length === 0) {
    return null;
  }
  return [];
}
