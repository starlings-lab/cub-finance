import { request, gql } from "graphql-request";
import {
  DebtPosition,
  MorphoBlueDebtPosition,
  CompoundV3DebtPosition,
  MorphoBlueMarket,
  Protocol,
  MorphoBlueRecommendedDebtDetail,
  TokenAmount,
  Token
} from "../type/type";
import { isZeroOrNegative, isZeroOrPositive } from "../utils/utils";
import {
  MORPHO_GRAPHQL_URL,
  MORPHO_SUPPORTED_COLLATERAL_TOKEN_QUERY,
  MORPHO_SUPPORTED_DEBT_TOKEN_QUERY
} from "../constants";

export async function getMarkets(): Promise<MorphoBlueMarket[]> {
  const query = gql`
    query {
      markets(where: { chainId_in: [1] }) {
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
            rewards {
              borrowApy
            }
          }
          monthlyApys {
            borrowApy
          }
        }
      }
    }
  `;

  try {
    const queryResult = await request(MORPHO_GRAPHQL_URL, query);
    return parseMarketsQueryResult(queryResult);
  } catch (error) {
    console.error(error);
    return [];
  }
}

function parseMarketsQueryResult(queryResult: any): MorphoBlueMarket[] {
  return queryResult.markets.items
    .filter((market: any) => market.collateralAsset !== null)
    .map((market: any) => {
      return {
        marketId: market.uniqueKey,
        debtToken: market.loanAsset,
        collateralToken: market.collateralAsset,
        trailing30DaysBorrowingAPY: market.monthlyApys.borrowApy,
        utilizationRatio: market.state.utilization,
        maxLTV: market.lltv / 10 ** 18,
        trailing30DaysLendingRewardAPY: 0, // MorphoBlue doesn't pay interest on collateral
        trailing30DaysBorrowingRewardAPY: calculateRewards(market.state.rewards) // we pass the borrowApy directly under the assumption that reward APY doesn't fluctuate
      };
    });
}

function calculateRewards(rewards: any[]): number {
  return rewards
    .filter((reward) => reward.borrowApy !== null && reward.borrowApy !== 0)
    .reduce((acc, reward) => acc + reward, 0);
}

function isUtilizationRatioSmallEnough(utilizationRatio: number): boolean {
  return utilizationRatio < 0.98 && utilizationRatio > 0;
}

function filterByNetBorrowingAPY(
  matchedMarkets: MorphoBlueMarket[],
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition,
  borrowingAPYTolerance: number
): MorphoBlueMarket[] {
  return matchedMarkets.filter((matchedMarket) => {
    if (isZeroOrNegative(debtPosition.trailing30DaysNetBorrowingAPY)) {
      const newNetBorrowingAPY = matchedMarket.trailing30DaysBorrowingAPY;
      const oldNetBorrowingAPY = Math.abs(
        debtPosition.trailing30DaysNetBorrowingAPY
      );

      // New borrowing cost is lower than the old borrowing cost within tolerance
      return newNetBorrowingAPY <= oldNetBorrowingAPY - borrowingAPYTolerance;
    } else if (isZeroOrPositive(debtPosition.trailing30DaysNetBorrowingAPY)) {
      return false;
    }
  });
}

export async function getSupportedTokens(query: any): Promise<Token[]> {
  try {
    const queryResult: any = await request(MORPHO_GRAPHQL_URL, query);
    const convertedTokenArray: Token[] = queryResult.markets.items.map(
      (token: any) => {
        return Object.values(token)[0];
      }
    );
    return removeDuplicateTokens(convertedTokenArray);
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getSupportedDebtTokens(): Promise<Token[]> {
  return getSupportedTokens(MORPHO_SUPPORTED_DEBT_TOKEN_QUERY);
}

export async function getSupportedCollateralTokens(): Promise<Token[]> {
  return getSupportedTokens(MORPHO_SUPPORTED_COLLATERAL_TOKEN_QUERY);
}

function removeDuplicateTokens(tokens: Token[]): Token[] {
  const uniqueTokensMap = new Map();

  tokens.forEach((token: Token) => {
    const tokenAddress = token ? token.address : null;
    if (tokenAddress && !uniqueTokensMap.has(tokenAddress)) {
      uniqueTokensMap.set(tokenAddress, token);
    }
  });

  const uniqueTokens: Token[] = Array.from(uniqueTokensMap.values());
  return uniqueTokens;
}

export async function getBorrowRecommendations(
  debtTokens: Token[],
  collaterals: TokenAmount[]
): Promise<MorphoBlueRecommendedDebtDetail[]> {
  const markets = await getMarkets();

  // Create all possible debtToken-collateral combos
  const debtTokenCollateralCombo: {
    debtToken: Token;
    collateral: TokenAmount;
  }[] = [];
  debtTokens.forEach((debtToken) => {
    collaterals.forEach((collateral) => {
      debtTokenCollateralCombo.push({
        debtToken: debtToken,
        collateral: collateral
      });
    });
  });

  // Find all markets that match the debtToken-collateral combos
  const marketCollateralMap = new Map<MorphoBlueMarket, TokenAmount>();
  debtTokenCollateralCombo.forEach((combo) => {
    const matchingMarkets = markets.filter(
      (market) =>
        market.debtToken.address === combo.debtToken.address &&
        market.collateralToken.address === combo.collateral.token.address
    );

    matchingMarkets.forEach((market) => {
      marketCollateralMap.set(market, combo.collateral);
    });
  });

  // check if the utilization ratio is small enough and non-zero
  const matchedMarkets = Array.from(marketCollateralMap.entries()).filter(
    ([matchedMarket, collateral]) => {
      return isUtilizationRatioSmallEnough(matchedMarket.utilizationRatio);
    }
  );

  // construct an array of MorphoBlueRecommendedDebtDetail[] for recommendations
  const recommendations: MorphoBlueRecommendedDebtDetail[] = await Promise.all(
    matchedMarkets.map(async ([market, collateral]) => {
      const collateralAmountInUSD = await getUsdAmount(
        collateral.token,
        Number(collateral.amount) / 10 ** collateral.token.decimals
      );
      const debtAmountInUSD: number = collateralAmountInUSD * market.maxLTV;
      const debtAmount: number = await getTokenAmount(
        market.debtToken,
        debtAmountInUSD
      );
      const debtPosition: MorphoBlueDebtPosition = {
        marketId: market.marketId,
        maxLTV: market.maxLTV,
        LTV: market.maxLTV, // we assume that the LTV is the same as the maxLTV
        trailing30DaysNetBorrowingAPY:
          0 -
          market.trailing30DaysBorrowingAPY +
          market.trailing30DaysLendingRewardAPY +
          market.trailing30DaysBorrowingRewardAPY,
        debt: {
          token: market.debtToken,
          amount: BigInt(
            Math.round(debtAmount * 10 ** market.debtToken.decimals)
          ),
          amountInUSD: debtAmountInUSD
        },
        collateral: {
          token: collateral.token,
          amount: collateral.amount,
          amountInUSD: collateralAmountInUSD
        }
      };
      // convert the debt token in usd to the debt token amount

      return {
        protocol: Protocol.MorphoBlue,
        debt: debtPosition,
        market: market
      };
    })
  );
  return await recommendations;
}

async function getUsdAmount(
  token: Token,
  tokenAmount: number
): Promise<number> {
  const query = gql`
    query {
      assetByAddress(address: "${token.address}", chainId: 1){
        priceUsd
      }
    }
  `;

  try {
    const queryResult: any = await request(MORPHO_GRAPHQL_URL, query); // it returns the Float scalar type represents signed double-precision fractional values as specified by IEEE 754.
    const usdPrice: number = queryResult.assetByAddress.priceUsd;
    return tokenAmount * usdPrice;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function getTokenAmount(
  token: Token,
  usdAmount: number
): Promise<number> {
  const query = gql`
    query {
      assetByAddress(address: "${token.address}", chainId: 1){
        priceUsd
      }
    }
  `;

  try {
    const queryResult: any = await request(MORPHO_GRAPHQL_URL, query); // it returns the Float scalar type represents signed double-precision fractional values as specified by IEEE 754.
    const usdPrice: number = queryResult.assetByAddress.priceUsd;
    return usdAmount / usdPrice;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
