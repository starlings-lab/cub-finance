import type { Address } from "abitype";
import { request, gql } from "graphql-request";
import {
  MorphoBlueDebtPosition,
  MorphoBlueMarket,
  MorphoBlueUserDebtDetails,
  Protocol
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

