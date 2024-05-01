import type { Address } from "abitype";
import { Contract } from "ethers";
import {
  DEFILLAMA_COMPOUND_ETH_POOL_ID,
  DEFILLAMA_COMPOUND_USDC_POOL_ID
} from "../constants";
import {
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_DEBTS,
  COMPOUND_V3_COLLATERALS,
  COMPOUND_V3_CUSDC_COLLATERALS,
  COMPOUND_V3_CWETH_COLLATERALS,
  COMPOUND_V3_PRICEFEEDS,
  COMPOUND_V3_CUSDC_CONTRACT,
  COMPOUND_V3_CWETH_CONTRACT
} from "../contracts/compoundV3";
import {
  USDC,
  WETH,
  COMPOUND_V3_DEBT_STABLECOINS
} from "../contracts/ERC20Tokens";
import {
  Token,
  TokenAmount,
  CompoundV3UserDebtDetails,
  CompoundV3Market,
  DebtPosition,
  MorphoBlueDebtPosition,
  CompoundV3DebtPosition,
  Protocol,
  CompoundV3RecommendedDebtDetail,
  APYInfo
} from "../type/type";
import {
  getTokenByAddress,
  isZeroOrPositive,
  isZeroOrNegative
} from "../utils/utils";
import { calculate30DayTrailingBorrowingAndLendingAPYs } from "./defiLlamaDataService";

const USD_SCALE = BigInt(10 ** 8);

export async function getCompoundV3UserDebtDetails(
  userAddress: Address
): Promise<CompoundV3UserDebtDetails> {
  try {
    let CompoundV3UserDebtDetails: CompoundV3UserDebtDetails;
    const debtPositions: CompoundV3DebtPosition[] = await getDebtPositions(
      userAddress
    );
    CompoundV3UserDebtDetails = await addMarketsToDebtPositions(
      userAddress,
      debtPositions
    );
    return CompoundV3UserDebtDetails;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getDebtPositions(
  userAddress: Address
): Promise<CompoundV3DebtPosition[]> {
  let debtPositions: CompoundV3DebtPosition[] = [];
  const cUSDCBorrowBalance: bigint = await getBorrowBalance(
    COMPOUND_V3_CUSDC_CONTRACT,
    userAddress
  );
  if (cUSDCBorrowBalance != BigInt(0)) {
    const debtAmountInUSD: bigint = await getDebtUsdPrice(
      COMPOUND_V3_CUSDC_CONTRACT,
      COMPOUND_V3_PRICEFEEDS.USDC,
      cUSDCBorrowBalance
    );
    const cUSDCcollaterals: TokenAmount[] = await getCollateralsByUserAddress(
      COMPOUND_V3_CUSDC_CONTRACT,
      userAddress
    );
    const amountInUSD = Number(
      debtAmountInUSD / BigInt(10 ** USDC.decimals) / USD_SCALE
    );

    const debtPosition: CompoundV3DebtPosition = {
      maxLTV: await getMaxLtv(COMPOUND_V3_CUSDC_CONTRACT, cUSDCcollaterals),
      LTV: await getLtv(
        COMPOUND_V3_CUSDC_CONTRACT,
        amountInUSD,
        cUSDCcollaterals
      ),
      debt: {
        token: USDC,
        amount: cUSDCBorrowBalance,
        amountInUSD: amountInUSD
      },
      collaterals: cUSDCcollaterals,
      trailing30DaysNetBorrowingAPY: 0 // assign the value in the addMarketsToDebtPositions function
    };
    debtPositions.push(debtPosition);
  }
  const cWETHBorrowBalance: bigint = await getBorrowBalance(
    COMPOUND_V3_CWETH_CONTRACT,
    userAddress
  );
  if (cWETHBorrowBalance != BigInt(0)) {
    const debtAmountInUSD: bigint = await getDebtUsdPrice(
      COMPOUND_V3_CWETH_CONTRACT,
      COMPOUND_V3_PRICEFEEDS.WETH,
      cWETHBorrowBalance
    );
    const cWETHcollaterals = await getCollateralsByUserAddress(
      COMPOUND_V3_CWETH_CONTRACT,
      userAddress
    );
    const amountInUSD = Number(
      debtAmountInUSD / BigInt(10 ** WETH.decimals) / USD_SCALE
    );

    const cWETHdebtPosition: CompoundV3DebtPosition = {
      maxLTV: await getMaxLtv(COMPOUND_V3_CWETH_CONTRACT, cWETHcollaterals),
      LTV: await getLtv(
        COMPOUND_V3_CWETH_CONTRACT,
        amountInUSD,
        cWETHcollaterals
      ),
      debt: {
        token: WETH,
        amount: cWETHBorrowBalance,
        amountInUSD: amountInUSD
      },
      collaterals: cWETHcollaterals,
      trailing30DaysNetBorrowingAPY: 0 // assign the value in the addMarketsToDebtPositions function
    };
    debtPositions.push(cWETHdebtPosition);
  }
  return debtPositions;
}

async function addMarketsToDebtPositions(
  userAddress: Address,
  debtPositions: CompoundV3DebtPosition[]
): Promise<CompoundV3UserDebtDetails> {
  const markets: CompoundV3Market[] = await getCompoundV3Markets(debtPositions);
  // console.dir(markets, { depth: null });

  const marketsMap = new Map<string, CompoundV3Market>(
    markets.map((market) => [market.debtToken.address.toLowerCase(), market])
  );
  debtPositions.forEach((debtPosition) => {
    const market: CompoundV3Market = marketsMap.get(
      debtPosition.debt.token.address.toLowerCase()
    ) as CompoundV3Market;
    // Compound V3 does not pay interest on collateral
    debtPosition.trailing30DaysNetBorrowingAPY =
      0 - market.trailing30DaysBorrowingAPY;
  });

  const compoundV3UserDebtDetails: CompoundV3UserDebtDetails = {
    protocol: Protocol.CompoundV3,
    userAddress: userAddress,
    markets: markets,
    debtPositions: debtPositions
  };
  return compoundV3UserDebtDetails;
}

// get a market based on the debt token
async function getCompoundV3Markets(
  debtPositions: CompoundV3DebtPosition[]
): Promise<CompoundV3Market[]> {
  // Fetch borrowing APYs for Compound ETH and USDC pools
  return getBorrowingAPYsByTokenAddress().then(async (apyInfoMap) => {
    const markets: CompoundV3Market[] = [];

    for (let i = 0; i < debtPositions.length; i++) {
      const debtPosition = debtPositions[i];
      const debtTokenAddress: Address = debtPosition.debt.token.address;
      const apyInfo = apyInfoMap.get(debtTokenAddress);
      const market: CompoundV3Market = {
        trailing30DaysBorrowingAPY: apyInfo?.borrowingAPY || 0,
        trailing30DaysBorrowingRewardAPY: apyInfo?.borrowingRewardAPY || 0,
        trailing30DaysLendingRewardAPY: apyInfo?.lendingRewardAPY || 0,
        utilizationRatio: await getUtilizationRatio(debtTokenAddress),
        debtToken: getTokenByAddress(debtTokenAddress),
        collateralTokens:
          getSupportedCollateralTokensByDebtToken(debtTokenAddress)
      };
      markets.push(market);
    }
    return markets;
  });
}

async function getAllCompoundV3Markets(): Promise<CompoundV3Market[]> {
  return Promise.all([
    getBorrowingAPYsByTokenAddress(),
    getUtilizationRatio(USDC.address),
    getUtilizationRatio(WETH.address)
  ]).then((data) => {
    const apyInfoMap = data[0];
    const usdcAPYInfo = apyInfoMap.get(USDC.address)!;
    const wethAPYInfo = apyInfoMap.get(WETH.address)!;

    const markets: CompoundV3Market[] = [
      {
        trailing30DaysBorrowingAPY: usdcAPYInfo.borrowingAPY ?? 0,
        trailing30DaysBorrowingRewardAPY: usdcAPYInfo.borrowingRewardAPY ?? 0,
        trailing30DaysLendingRewardAPY: usdcAPYInfo.lendingRewardAPY ?? 0,
        utilizationRatio: data[1],
        debtToken: USDC,
        collateralTokens: COMPOUND_V3_CUSDC_COLLATERALS
      },
      {
        trailing30DaysBorrowingAPY: wethAPYInfo.borrowingAPY ?? 0,
        trailing30DaysBorrowingRewardAPY: wethAPYInfo.borrowingRewardAPY ?? 0,
        trailing30DaysLendingRewardAPY: wethAPYInfo.lendingRewardAPY ?? 0,
        utilizationRatio: data[2],
        debtToken: WETH,
        collateralTokens: COMPOUND_V3_CWETH_COLLATERALS
      }
    ];

    return markets;
  });
}

export async function getUtilizationRatio(
  debtTokenAddress: Address
): Promise<number> {
  const UTILIZATION_SCALE = 10 ** 18;
  const market = getMarketByDebtTokenAddress(debtTokenAddress);

  const utilization: bigint = await market.getUtilization();
  const utilizationNumber: number = Number(utilization) / UTILIZATION_SCALE;

  return utilizationNumber;
}

function getMarketByDebtTokenAddress(debtTokenAddress: Address): any {
  switch (debtTokenAddress) {
    case USDC.address:
      return COMPOUND_V3_CUSDC_CONTRACT;
    case WETH.address:
      return COMPOUND_V3_CWETH_CONTRACT;
    default:
      throw new Error("Unsupported debt token address");
  }
}

// Fetches 30 days trailing borrowing APYs for Compound ETH and USDC pools
async function getBorrowingAPYsByTokenAddress(): Promise<Map<string, APYInfo>> {
  return Promise.all([
    calculate30DayTrailingBorrowingAndLendingAPYs(
      DEFILLAMA_COMPOUND_ETH_POOL_ID
    ),
    calculate30DayTrailingBorrowingAndLendingAPYs(
      DEFILLAMA_COMPOUND_USDC_POOL_ID
    )
  ]).then((apyData) => {
    const borrowingAPYs = new Map<string, APYInfo>();
    borrowingAPYs.set(WETH.address, apyData[0]);
    borrowingAPYs.set(USDC.address, apyData[1]);
    return borrowingAPYs;
  });
}

export async function getCollateralsByUserAddress(
  market: Contract,
  userAddress: Address
): Promise<TokenAmount[]> {
  const marketAddress: Address = (await market.getAddress()) as Address;
  const collaterals: Token[] = getSupportedCollateralByMarket(marketAddress);

  const collateralsPromise = collaterals.map(async (collateral) => {
    const collateralAmount: bigint = await getCollateralBalance(
      market,
      userAddress,
      collateral.address
    );

    if (collateralAmount !== BigInt(0)) {
      const amountInUSD: bigint = await getDebtUsdPrice(
        market,
        getPriceFeedFromTokenSymbol(collateral.symbol),
        collateralAmount
      );

      return {
        token: getTokenByAddress(collateral.address),
        amount: collateralAmount,
        amountInUSD: Number(
          amountInUSD / BigInt(10 ** collateral.decimals) / USD_SCALE
        )
      };
    }

    return null;
  });

  const collateralsPromiseResolved = await Promise.all(collateralsPromise);

  return collateralsPromiseResolved.filter(
    (collateral): collateral is TokenAmount => collateral !== null
  ) as TokenAmount[];
}

export async function getBorrowBalance(
  market: Contract,
  userAddress: Address
): Promise<bigint> {
  try {
    const borrowBalance: bigint = await market.borrowBalanceOf(userAddress);
    return borrowBalance;
  } catch (error) {
    console.error("Error in getBorrowBalance:", error);
    throw new Error("Failed to fetch borrow balance");
  }
}

// there seems to be no easy way to fetch supported collaterals for each market. So we store them as constant values. Even compound.js keeps constant values.
export function getSupportedCollateralByMarket(
  marketAddress: Address
): Token[] {
  if (marketAddress === COMPOUND_V3_CUSDC_ADDRESS) {
    return [...COMPOUND_V3_CUSDC_COLLATERALS];
  } else if (marketAddress === COMPOUND_V3_CWETH_ADDRESS) {
    return [...COMPOUND_V3_CWETH_COLLATERALS];
  } else {
    throw new Error("Unsupported market address");
  }
}

export function getSupportedCollateralTokensByDebtToken(
  debtTokenAddress?: Address
): Token[] {
  if (debtTokenAddress === USDC.address) {
    return COMPOUND_V3_CUSDC_COLLATERALS;
  } else if (debtTokenAddress === WETH.address) {
    return COMPOUND_V3_CWETH_COLLATERALS;
  } else {
    throw new Error("Unsupported debt token address");
  }
}

export function getSupportedCollateralTokens(): Promise<Token[]> {
  return Promise.resolve(COMPOUND_V3_COLLATERALS);
}

export function getSupportedDebtTokens(): Promise<Token[]> {
  return Promise.resolve(COMPOUND_V3_DEBTS);
}

export async function getCollateralBalance(
  market: Contract,
  userAddress: Address,
  tokenAddress: Address
): Promise<bigint> {
  try {
    const collateralBalance: bigint = await market.collateralBalanceOf(
      userAddress,
      tokenAddress
    );
    return collateralBalance;
  } catch (error) {
    console.error("Error in getCollateralBalance:", error);
    throw error;
  }
}

function getPriceFeedFromTokenSymbol(tokenSymbol: string): Address {
  const supportedTokens = {
    USDC: COMPOUND_V3_PRICEFEEDS.USDC,
    WETH: COMPOUND_V3_PRICEFEEDS.WETH,
    COMP: COMPOUND_V3_PRICEFEEDS.COMP,
    WBTC: COMPOUND_V3_PRICEFEEDS.WBTC,
    UNI: COMPOUND_V3_PRICEFEEDS.UNI,
    LINK: COMPOUND_V3_PRICEFEEDS.LINK,
    cbETH: COMPOUND_V3_PRICEFEEDS.cbETH,
    wstETH: COMPOUND_V3_PRICEFEEDS.wstETH
  };

  if (tokenSymbol in supportedTokens) {
    return supportedTokens[tokenSymbol as keyof typeof supportedTokens];
  } else {
    throw new Error("Unsupported token name");
  }
}

// Returns the USD price with 8 decimal places as an unsigned integer scaled up by 10 ^ 8.
// E.g. 5000_00000000 means that the asset’s price is $5000 USD.
async function getDebtUsdPrice(
  market: Contract,
  priceFeed: Address,
  amount: bigint
): Promise<bigint> {
  try {
    const rate: bigint = await market.getPrice(priceFeed);
    let price: bigint = amount * rate;

    // Compound's ETH related price feeds returns price in ETH, e.g. 1 stETH = 1.05 ETH
    // so we need to multiply price by ETH price in USD
    if (
      priceFeed === COMPOUND_V3_PRICEFEEDS.cbETH ||
      priceFeed === COMPOUND_V3_PRICEFEEDS.wstETH ||
      priceFeed === COMPOUND_V3_PRICEFEEDS.WETH
    ) {
      const ethUsdRate: bigint = await market.getPrice(
        COMPOUND_V3_PRICEFEEDS.ETH
      );
      // console.log(`ETH price: ${ethUsdRate}`);
      price = (price * ethUsdRate) / USD_SCALE;
    }

    // console.log(`Amount: ${amount}, Rate: ${rate}, USD Price: ${price}`);

    return price;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getLtv(
  market: Contract,
  debtAmountInUSD: number,
  collaterals: TokenAmount[]
): Promise<number> {
  const collateralBalanceInUsd: bigint[] = await Promise.all(
    collaterals.map(async (collateral) => {
      const COLLATERAL_TOKEN_SCALE = BigInt(10 ** collateral.token.decimals);
      const usdPrice: bigint = await getDebtUsdPrice(
        market,
        getPriceFeedFromTokenSymbol(collateral.token.symbol),
        collateral.amount
      );
      return usdPrice / COLLATERAL_TOKEN_SCALE / USD_SCALE;
    })
  );
  const totalCollateralBalanceInUsd: bigint = collateralBalanceInUsd.reduce(
    (totalBalance: bigint, currentBalance) => totalBalance + currentBalance,
    BigInt(0)
  );
  // console.log(
  //   `Total collateral balance in USD: ${totalCollateralBalanceInUsd}, Debt amount in USD: ${debtAmountInUSD}`
  // );
  const ltv = debtAmountInUSD / Number(totalCollateralBalanceInUsd);
  return ltv;
}

// collateral factor is max LTV for each collateral
async function getCollateralFactor(
  market: Contract,
  collateral: Token
): Promise<bigint> {
  const assetInfo = await market.getAssetInfoByAddress(collateral.address);
  // collateralFactor an integer that represents the decimal value scaled up by 10 ^ 18. E.g. 650000000000000000 is 65%.
  const collateralFactor: bigint = assetInfo.borrowCollateralFactor;
  return collateralFactor;
}

// max LTV for each market
async function getMaxLtv(
  market: Contract,
  collaterals: TokenAmount[] | TokenAmount
): Promise<number> {
  let maxLtvAmountInUsd: number = 0;
  let totalCollateralAmountInUsd: number = 0;

  const COLLATERAL_FACTOR_SCALE = 10 ** 18;

  if (!Array.isArray(collaterals)) {
    let collateralFactor: bigint = await getCollateralFactor(
      market,
      collaterals.token
    );
    const maxLtvAmountForCollateralInUSD: number =
      collaterals.amountInUSD * Number(collateralFactor);
    maxLtvAmountInUsd +=
      maxLtvAmountForCollateralInUSD / COLLATERAL_FACTOR_SCALE;
    totalCollateralAmountInUsd += collaterals.amountInUSD;
  } else {
    const promises = (collaterals as TokenAmount[]).map(async (collateral) => {
      let collateralFactor: bigint = await getCollateralFactor(
        market,
        collateral.token
      );
      const maxLtvAmountForCollateralInUSD: number =
        collateral.amountInUSD * Number(collateralFactor);
      maxLtvAmountInUsd +=
        maxLtvAmountForCollateralInUSD / COLLATERAL_FACTOR_SCALE;
      totalCollateralAmountInUsd += collateral.amountInUSD;
    });
    await Promise.all(promises);
  }

  if (totalCollateralAmountInUsd === 0) return 0;

  let maxLtvPercentage: number = maxLtvAmountInUsd / totalCollateralAmountInUsd;
  return maxLtvPercentage;
}

export async function getRecommendedDebtDetail(
  protocol: Protocol,
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition,
  maxLTVTolerance = 0.1, // 10%
  borrowingAPYTolerance = 0.03 // 3%
): Promise<CompoundV3RecommendedDebtDetail[] | null> {
  const markets: CompoundV3Market[] = await getAllCompoundV3Markets();

  // check if the debt token is in the markets
  const debtTokenMatchedMarkets = markets.filter((market) => {
    if (protocol === Protocol.AaveV3 || protocol === Protocol.Spark) {
      return (debtPosition as DebtPosition).debts.some(
        (debt) =>
          market.debtToken.address === debt.token.address ||
          COMPOUND_V3_DEBT_STABLECOINS.some(
            (debtStablecoin) => debtStablecoin.address === debt.token.address
          )
      );
    } else if (
      protocol === Protocol.CompoundV3 ||
      protocol === Protocol.MorphoBlue
    ) {
      const debtTokenAddress =
        protocol === Protocol.CompoundV3
          ? (debtPosition as CompoundV3DebtPosition).debt.token.address
          : (debtPosition as MorphoBlueDebtPosition).debt.token.address;

      return (
        market.debtToken.address === debtTokenAddress ||
        COMPOUND_V3_DEBT_STABLECOINS.some(
          (debtStablecoin) => debtStablecoin.address === debtTokenAddress
        )
      );
    }
  });

  // check if the collateral tokens are in the markets
  let matchedMarkets: CompoundV3Market[] = [];
  if (debtTokenMatchedMarkets.length > 0) {
    matchedMarkets = debtTokenMatchedMarkets.filter(
      (debtTokenMatchedMarket) => {
        if (
          protocol === Protocol.AaveV3 ||
          protocol === Protocol.Spark ||
          protocol === Protocol.CompoundV3
        ) {
          return debtTokenMatchedMarket.collateralTokens.some(
            (collateralInMatchedMarket) =>
              (debtPosition as DebtPosition) ||
              (debtPosition as CompoundV3DebtPosition).collaterals.some(
                (collateralInDebtPosition) =>
                  collateralInDebtPosition.token.address ===
                  collateralInMatchedMarket.address
              )
          );
        }
        return debtTokenMatchedMarket.collateralTokens.some(
          (collateral) =>
            (debtPosition as MorphoBlueDebtPosition).collateral.token
              .address === collateral.address
        );
      }
    );
  } else if (debtTokenMatchedMarkets.length === 0) {
    return null;
  }

  if (matchedMarkets.length === 0) {
    return null;
  }

  // check if the utilization ratio is small enough
  matchedMarkets = matchedMarkets.filter((matchedMarket) => {
    return matchedMarket.utilizationRatio < 0.98;
  });

  // check if the new max LTV >= (the old max LTV - 5%)
  let newMaxLTV: number | undefined;
  matchedMarkets = matchedMarkets.filter(async (matchedMarket) => {
    const matchedMarketContract =
      matchedMarket.debtToken.address === USDC.address
        ? COMPOUND_V3_CUSDC_CONTRACT
        : COMPOUND_V3_CWETH_CONTRACT;
    const matchedMarketCollaterals =
      matchedMarket.debtToken.address === USDC.address
        ? COMPOUND_V3_CUSDC_COLLATERALS
        : COMPOUND_V3_CWETH_COLLATERALS;
    if (
      protocol === Protocol.AaveV3 ||
      protocol === Protocol.Spark ||
      protocol === Protocol.CompoundV3
    ) {
      const matchedCollaterals = (
        (debtPosition as DebtPosition) ||
        (debtPosition as CompoundV3DebtPosition)
      ).collaterals.filter((collateralInDebtPosition) =>
        matchedMarketCollaterals.some(
          (collateral) =>
            collateralInDebtPosition.token.address === collateral.address
        )
      );
      newMaxLTV = await getMaxLtv(matchedMarketContract, matchedCollaterals);
    } else if (protocol === Protocol.MorphoBlue) {
      const matchedCollateralExist = matchedMarketCollaterals.some(
        (collateral) =>
          (debtPosition as MorphoBlueDebtPosition).collateral.token.address ===
          collateral.address
      );
      if (matchedCollateralExist) {
        newMaxLTV = await getMaxLtv(
          matchedMarketContract,
          (debtPosition as MorphoBlueDebtPosition).collateral
        );
      }
    }
    return newMaxLTV !== undefined && newMaxLTV >= debtPosition.maxLTV - 0.05;
  });

  // check if the old borrowing cost - the new borrowing cost > 3%
  matchedMarkets = matchedMarkets.filter((matchedMarket) => {
    if (isZeroOrNegative(debtPosition.trailing30DaysNetBorrowingAPY)) {
      const spread: number =
        matchedMarket.trailing30DaysBorrowingAPY -
        Math.abs(debtPosition.trailing30DaysNetBorrowingAPY);
      return spread > borrowingAPYTolerance;
    } else if (isZeroOrPositive(debtPosition.trailing30DaysNetBorrowingAPY)) {
      return false;
    }
  });

  const recommendedDebtDetails: CompoundV3RecommendedDebtDetail[] = [];
  matchedMarkets.forEach(async (matchedMarket) => {
    let matchedDebtTokenAmount: TokenAmount;
    if (protocol === Protocol.AaveV3 || protocol === Protocol.Spark) {
      matchedDebtTokenAmount = (debtPosition as DebtPosition).debts.find(
        (debt) => debt.token.address === matchedMarket.debtToken.address
      ) as TokenAmount;
    } else if (
      protocol === Protocol.CompoundV3 ||
      protocol === Protocol.MorphoBlue
    ) {
      matchedDebtTokenAmount = (
        (debtPosition as CompoundV3DebtPosition) ||
        (debtPosition as MorphoBlueDebtPosition)
      ).debt;
    } else {
      return null;
    }

    let matchedCollaterals: TokenAmount[];
    if (
      protocol === Protocol.AaveV3 ||
      protocol === Protocol.Spark ||
      protocol === Protocol.CompoundV3
    ) {
      matchedCollaterals = (
        (debtPosition as DebtPosition) ||
        (debtPosition as CompoundV3DebtPosition)
      ).collaterals.filter((collateral) =>
        matchedMarket.collateralTokens.some(
          (collateralInMarket) =>
            collateral.token.address === collateralInMarket.address
        )
      ) as TokenAmount[];
    } else {
      matchedCollaterals = [
        (debtPosition as MorphoBlueDebtPosition).collateral
      ];
    }

    const matchedMarketContract =
      matchedMarket.debtToken.address === USDC.address
        ? COMPOUND_V3_CUSDC_CONTRACT
        : COMPOUND_V3_CWETH_CONTRACT;

    let newLTV: number = await getLtv(
      matchedMarketContract,
      matchedDebtTokenAmount.amountInUSD,
      matchedCollaterals as TokenAmount[]
    );

    // When newLTV is higher than new maxLTV,
    // then We need to make a recommendation with reduced debt based
    // on the new max LTV and collateral value
    const { newLTV: modifiedNewLTV, newDebtAmount } =
      determineNewLTVAndDebtAmount(
        matchedDebtTokenAmount,
        matchedCollaterals,
        newLTV,
        newMaxLTV!
      );

    const newDebt = {
      maxLTV: newMaxLTV!,
      LTV: modifiedNewLTV,
      trailing30DaysNetBorrowingAPY:
        0 -
        matchedMarket.trailing30DaysBorrowingAPY +
        matchedMarket.trailing30DaysLendingRewardAPY +
        matchedMarket.trailing30DaysBorrowingRewardAPY,
      debt: newDebtAmount,
      collaterals: matchedCollaterals as TokenAmount[]
    };

    recommendedDebtDetails.push({
      protocol: Protocol.MorphoBlue,
      debt: newDebt,
      market: matchedMarket
    });
  });
  return recommendedDebtDetails;
}

function determineNewLTVAndDebtAmount(
  matchedDebtTokenAmount: TokenAmount,
  matchedCollaterals: TokenAmount[],
  newLTV: number,
  newMaxLTV: number
) {
  let newDebtAmount: TokenAmount = matchedDebtTokenAmount;
  const newCollateralAmountInUsd: number = matchedCollaterals.reduce(
    (sum, collateral) => sum + collateral.amountInUSD,
    0
  );
  if (newLTV > newMaxLTV) {
    newLTV = newMaxLTV;
    const newDebtAmountInUSD = newMaxLTV * newCollateralAmountInUsd;

    // calculate debt token's price in USD using the matched debt token amount
    // Using 10 ** 8 as the scale for USD price
    const scaledPriceInUSD =
      (BigInt(matchedDebtTokenAmount.amountInUSD * 10 ** 8) *
        BigInt(10 ** 18)) /
      matchedDebtTokenAmount.amount;

    // calculate new debt amount in token
    const newDebtAmountInToken =
      (BigInt(Math.floor(newDebtAmountInUSD)) *
        BigInt(10 ** matchedDebtTokenAmount.token.decimals) *
        BigInt(10 ** 8)) /
      scaledPriceInUSD;

    newDebtAmount = {
      ...matchedDebtTokenAmount,
      amount: newDebtAmountInToken,
      amountInUSD: newDebtAmountInUSD
    };
  }

  return { newLTV, newDebtAmount };
}
