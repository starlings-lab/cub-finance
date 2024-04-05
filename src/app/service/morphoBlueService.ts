import type { Address } from "abitype";
import { request, gql } from "graphql-request";
import { DebtPositionTableRow } from "../type/type";

const ENDPOINT = "https://blue-api.morpho.org/graphql";

export async function getDebtPositionTableRows(
  chainId: number,
  address: Address
): Promise<DebtPositionTableRow[]> {
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
          }
        }
      }
    }
  `;
  try {
    const queryResult = await request(ENDPOINT, query);
    const debtPositionTableRows = parseQueryResult(queryResult);
    return debtPositionTableRows;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

function parseQueryResult(queryResult: any): DebtPositionTableRow[] {
  const marketPositions = queryResult.userByAddress.marketPositions;
  const debtPositionTableRows: DebtPositionTableRow[] = marketPositions.map(
    (position: any) => {
      return {
        name: "MorphoBlue",
        debtToken: position.market.loanAsset,
        collateralTokens: position.market.collateralAsset,
        debtAmount: position.borrowAssets,
        collateralAmount: position.collateral,
        LTV: position.borrowAssetsUsd / position.collateralUsd,
        maxLTV: position.market.lltv,
        Trailing30DaysBorrowingAPY: position.market.monthlyApys.borrowApy
      };
    }
  );
  return debtPositionTableRows;
}
