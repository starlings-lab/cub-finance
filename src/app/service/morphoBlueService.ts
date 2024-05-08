import type { Address } from "abitype";
import { request, gql } from "graphql-request";
import { MORPHO_BLUE_DEBT_STABLECOINS } from "../contracts/ERC20Tokens";
import {
  DebtPosition,
  MorphoBlueDebtPosition,
  CompoundV3DebtPosition,
  MorphoBlueMarket,
  MorphoBlueUserDebtDetails,
  Protocol,
  MorphoBlueRecommendedDebtDetail,
  TokenAmount,
  Token
} from "../type/type";
import { isZeroOrNegative, isZeroOrPositive } from "../utils/utils";
import {
  MORPHO_GRAPHQL_URL,
  MORPHO_SUPPORTED_DEBT_TOKEN_QUERY
} from "../constants";

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
              rewards {
                borrowApy
              }
            }          
          }
        }
      }
    }
  `;

  try {
    const queryResult = await request(MORPHO_GRAPHQL_URL, query);
    return parseMarketPositionsQueryResult(queryResult, address);
  } catch (error) {
    // console.log("MorphoBlue query error: ", error);

    return {
      protocol: Protocol.MorphoBlue,
      userAddress: address,
      markets: [],
      debtPositions: []
    };
  }
}

function parseMarketPositionsQueryResult(
  queryResult: any,
  address: Address
): MorphoBlueUserDebtDetails {
  if (
    !queryResult.userByAddress ||
    !queryResult.userByAddress.marketPositions ||
    queryResult.userByAddress.marketPositions.length === 0
  ) {
    return {
      protocol: Protocol.MorphoBlue,
      userAddress: address,
      markets: [],
      debtPositions: []
    };
  }

  // Parse out the debt positions and markets
  const markets: Map<string, MorphoBlueMarket> = new Map();
  const debtPositions: MorphoBlueDebtPosition[] = [];
  queryResult.userByAddress.marketPositions
    .filter(
      (position: any) =>
        position.borrowAssetsUsd > 0 && position.collateralUsd > 0
    )
    .forEach((position: any) => {
      const market: MorphoBlueMarket = {
        marketId: position.market.uniqueKey,
        utilizationRatio: position.market.state.utilization,
        maxLTV: Number(position.market.lltv / 10 ** 18),
        debtToken: position.market.loanAsset,
        collateralToken: position.market.collateralAsset,
        trailing30DaysBorrowingAPY: position.market.monthlyApys.borrowApy,
        trailing30DaysLendingRewardAPY: 0, // MorphoBlue doesn't pay interest on collateral
        trailing30DaysBorrowingRewardAPY: calculateRewards(
          position.market.state.rewards
        )
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
          amount: BigInt(position.collateral),
          amountInUSD: Number(position.collateralUsd)
        },
        // MorphoBlue does not pay interest on collateral
        trailing30DaysNetBorrowingAPY:
          0 -
          position.market.monthlyApys.borrowApy +
          calculateRewards(position.market.state.rewards)
      });
    });

  return {
    protocol: Protocol.MorphoBlue,
    userAddress: address,
    markets: Array.from(markets.values()),
    debtPositions
  };
}

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
    throw error;
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

export async function getRecommendedDebtDetail(
  protocol: Protocol,
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition,
  maxLTVTolerance = 0.1, // 10%
  borrowingAPYTolerance = 0.03 // 3%
): Promise<MorphoBlueRecommendedDebtDetail[] | null> {
  const markets: MorphoBlueMarket[] = await getMarkets();

  // check if the debt token is in the markets
  let matchedMarkets = markets.filter((market) => {
    if (protocol === Protocol.AaveV3 || protocol === Protocol.Spark) {
      return (debtPosition as DebtPosition).debts.some(
        (debt) =>
          market.debtToken.address === debt.token.address ||
          MORPHO_BLUE_DEBT_STABLECOINS.some(
            (debtStablecoin) => debtStablecoin.address === debt.token.address
          )
      );
    } else if (protocol === Protocol.CompoundV3) {
      const debtTokenAddress = (debtPosition as CompoundV3DebtPosition).debt
        .token.address;
      return (
        market.debtToken.address === debtTokenAddress ||
        MORPHO_BLUE_DEBT_STABLECOINS.some(
          (debtStablecoin) => debtStablecoin.address === debtTokenAddress
        )
      );
    } else if (protocol === Protocol.MorphoBlue) {
      const debtTokenAddress = (
        debtPosition as MorphoBlueDebtPosition
      ).debt.token.address.toLowerCase();
      return (
        market.debtToken.address === debtTokenAddress ||
        MORPHO_BLUE_DEBT_STABLECOINS.some(
          (debtStablecoin) =>
            debtStablecoin.address.toLowerCase() ===
            market.debtToken.address.toLowerCase()
        )
      );
    }
  });

  if (matchedMarkets.length === 0) {
    return null;
  }

  // check if the collateral tokens are in the markets
  if (matchedMarkets.length > 0) {
    matchedMarkets = matchedMarkets.filter((matchedMarket) => {
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
            matchedMarket.collateralToken?.address === collateral.token.address
        );
      } else if (protocol === Protocol.MorphoBlue) {
        // there is one market with the id of 0xf8c13c80ab8666c21fc5afa13105745cae7c1da13df596eb5054319f36655cc9 where collateralToken is null
        return (
          matchedMarket.collateralToken != null &&
          (
            debtPosition as MorphoBlueDebtPosition
          ).collateral.token.address.toLowerCase() ===
            matchedMarket.collateralToken.address.toLowerCase()
        );
      }
    });
  } else if (matchedMarkets.length === 0) {
    return null;
  }

  // console.log(
  //   "Matched markets after collateral matching:",
  //   matchedMarkets.map(
  //     (market) =>
  //       market.debtToken.symbol +
  //       " " +
  //       market.collateralToken.symbol +
  //       " " +
  //       market.marketId
  //   )
  // );

  // check if the utilization ratio is small enough and non-zero
  matchedMarkets = matchedMarkets.filter((matchedMarket) => {
    return isUtilizationRatioSmallEnough(matchedMarket.utilizationRatio);
  });

  // check if the new max LTV >= (the old max LTV - 5%)
  matchedMarkets = matchedMarkets.filter((matchedMarket) => {
    return matchedMarket.maxLTV >= debtPosition.maxLTV - maxLTVTolerance;
  });

  // check if the old borrowing cost - the new borrowing cost > 3%
  matchedMarkets = filterByNetBorrowingAPY(
    matchedMarkets,
    debtPosition,
    borrowingAPYTolerance
  );

  // console.log("Matched markets after cost check:", matchedMarkets);

  const recommendedDebtDetails: MorphoBlueRecommendedDebtDetail[] = [];
  matchedMarkets.forEach((matchedMarket) => {
    let matchedDebt: TokenAmount | null;

    switch (protocol) {
      case Protocol.AaveV3:
      case Protocol.Spark:
        matchedDebt = (debtPosition as DebtPosition).debts.find(
          (debt) => debt.token.address === matchedMarket.debtToken.address
        ) as TokenAmount;
        break;
      case Protocol.CompoundV3:
        matchedDebt = (debtPosition as CompoundV3DebtPosition).debt;
        break;
      case Protocol.MorphoBlue:
        matchedDebt = {
          ...(debtPosition as MorphoBlueDebtPosition).debt,
          token: matchedMarket.debtToken
        };
        break;
      default:
        matchedDebt = null;
    }

    let matchedCollateral: TokenAmount;
    if (protocol === Protocol.AaveV3 || protocol === Protocol.Spark) {
      matchedCollateral = (debtPosition as DebtPosition).collaterals.find(
        (collateral) =>
          collateral.token.address === matchedMarket.collateralToken.address
      ) as TokenAmount;
    } else if (protocol === Protocol.CompoundV3) {
      matchedCollateral = (
        debtPosition as CompoundV3DebtPosition
      ).collaterals.find(
        (collateral) =>
          collateral.token.address === matchedMarket.collateralToken.address
      ) as TokenAmount;
    } else {
      matchedCollateral = (debtPosition as MorphoBlueDebtPosition).collateral;
    }

    // When newLTV is higher than new maxLTV,
    // then We need to make a recommendation with reduced debt based
    // on the new max LTV and collateral value
    let newLTV = matchedDebt!.amountInUSD / matchedCollateral.amountInUSD;
    const newMaxLTV = matchedMarket.maxLTV;
    let newDebtAmount: TokenAmount = matchedDebt!;

    if (newLTV > newMaxLTV) {
      console.log(
        `New LTV: ${newLTV} is higher than new max LTV: ${newMaxLTV}`
      );

      // Multiply maxLTV by 10^8 and divide by 10^8 to preserve precision
      const newDebtAmountInToken =
        (BigInt(matchedMarket.maxLTV * 10 ** 8) * matchedCollateral.amount) /
        BigInt(10 ** 8);
      newDebtAmount = {
        token: matchedDebt!.token,
        amount: newDebtAmountInToken,
        amountInUSD: matchedMarket.maxLTV * matchedCollateral.amountInUSD
      };

      // cap the new LTV to the new max LTV
      newLTV = newMaxLTV;
    }

    const newDebt = {
      maxLTV: newMaxLTV,
      LTV: newLTV,
      marketId: matchedMarket.marketId,
      debt: newDebtAmount,
      collateral: matchedCollateral,
      trailing30DaysNetBorrowingAPY:
        0 -
        matchedMarket.trailing30DaysBorrowingAPY +
        matchedMarket.trailing30DaysLendingRewardAPY +
        matchedMarket.trailing30DaysBorrowingRewardAPY
    };
    recommendedDebtDetails.push({
      protocol: Protocol.MorphoBlue,
      debt: newDebt,
      market: matchedMarket
    });
  });
  return recommendedDebtDetails;
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
