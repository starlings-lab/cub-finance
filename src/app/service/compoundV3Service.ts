import type { Address } from "abitype";
import { ethers, Contract } from "ethers";
import {
  ALCHEMY_API_URL_2,
  DEFILLAMA_COMPOUND_ETH_POOL_ID,
  DEFILLAMA_COMPOUND_USDC_POOL_ID
} from "../constants";
import {
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_CUSDC_COLLATERALS,
  COMPOUND_V3_CWETH_COLLATERALS,
  COMPOUND_V3_PRICEFEEDS,
  COMPOUND_V3_ABI
} from "../contracts/compoundV3";
import { USDC, WETH } from "../contracts/ERC20Tokens";
import {
  Token,
  TokenAmount,
  CompoundV3UserDebtDetails,
  Market,
  MorphoBlueMarket,
  CompoundV3Market,
  DebtPosition,
  MorphoBlueDebtPosition,
  CompoundV3DebtPosition,
  Protocol,
  CompoundV3RecommendedDebtDetail
} from "../type/type";
import {
  getTokenByAddress,
  isZeroOrPositive,
  isZeroOrNegative
} from "../utils/utils";
import { calculate30DayTrailingBorrowingAndLendingAPYs } from "./defiLlamaDataService";

const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL_2);

const CompoundV3cUSDC = new Contract(
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_ABI,
  provider
);

const CompoundV3cWETH = new Contract(
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_ABI,
  provider
);

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
    CompoundV3cUSDC,
    userAddress
  );
  if (cUSDCBorrowBalance != BigInt(0)) {
    const debtAmountInUSD: bigint = await getDebtUsdPrice(
      CompoundV3cUSDC,
      COMPOUND_V3_PRICEFEEDS.USDC,
      cUSDCBorrowBalance
    );
    const cUSDCcollaterals: TokenAmount[] = await getCollateralsByUserAddress(
      CompoundV3cUSDC,
      userAddress
    );
    const amountInUSD = Number(
      debtAmountInUSD / BigInt(10 ** USDC.decimals) / USD_SCALE
    );

    const debtPosition: CompoundV3DebtPosition = {
      maxLTV: await getMaxLtv(CompoundV3cUSDC, cUSDCcollaterals),
      LTV: await getLtv(CompoundV3cUSDC, amountInUSD, cUSDCcollaterals),
      debt: {
        token: USDC,
        amount: cUSDCBorrowBalance,
        amountInUSD: amountInUSD
      },
      collaterals: cUSDCcollaterals,
      trailing30DaysNetAPY: 0 // assign the value in the addMarketsToDebtPositions function
    };
    debtPositions.push(debtPosition);
  }
  const cWETHBorrowBalance: bigint = await getBorrowBalance(
    CompoundV3cWETH,
    userAddress
  );
  if (cWETHBorrowBalance != BigInt(0)) {
    const debtAmountInUSD: bigint = await getDebtUsdPrice(
      CompoundV3cWETH,
      COMPOUND_V3_PRICEFEEDS.WETH,
      cWETHBorrowBalance
    );
    const cWETHcollaterals = await getCollateralsByUserAddress(
      CompoundV3cWETH,
      userAddress
    );
    const amountInUSD = Number(
      debtAmountInUSD / BigInt(10 ** WETH.decimals) / USD_SCALE
    );

    const cWETHdebtPosition: CompoundV3DebtPosition = {
      maxLTV: await getMaxLtv(CompoundV3cWETH, cWETHcollaterals),
      LTV: await getLtv(CompoundV3cWETH, amountInUSD, cWETHcollaterals),
      debt: {
        token: WETH,
        amount: cWETHBorrowBalance,
        amountInUSD: amountInUSD
      },
      collaterals: cWETHcollaterals,
      trailing30DaysNetAPY: 0 // assign the value in the addMarketsToDebtPositions function
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
    debtPosition.trailing30DaysNetAPY = 0 - market.trailing30DaysBorrowingAPY;
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
  return getBorrowingAPYsByTokenAddress().then(async (borrowingAPYs) => {
    const markets: CompoundV3Market[] = [];

    for (let i = 0; i < debtPositions.length; i++) {
      const debtPosition = debtPositions[i];
      const debtTokenAddress: Address = debtPosition.debt.token.address;
      const market: CompoundV3Market = {
        trailing30DaysBorrowingAPY: borrowingAPYs.get(debtTokenAddress) || 0,
        utilizationRatio: await getUtilizationRatio(debtTokenAddress),
        debtToken: getTokenByAddress(debtTokenAddress),
        collateralTokens: getSupportedCollateralTokens(debtTokenAddress)
      };
      markets.push(market);
    }
    return markets;
  });
}

async function getAllCompoundV3Markets(): Promise<CompoundV3Market[]> {
  const borrowingAPYs = await getBorrowingAPYsByTokenAddress();
  const markets: CompoundV3Market[] = [
    {
      trailing30DaysBorrowingAPY: borrowingAPYs.get(USDC.address) ?? 0,
      utilizationRatio: await getUtilizationRatio(USDC.address),
      debtToken: USDC,
      collateralTokens: COMPOUND_V3_CUSDC_COLLATERALS
    },
    {
      trailing30DaysBorrowingAPY: borrowingAPYs.get(WETH.address) ?? 0,
      utilizationRatio: await getUtilizationRatio(WETH.address),
      debtToken: WETH,
      collateralTokens: COMPOUND_V3_CWETH_COLLATERALS
    }
  ];
  return markets;
}

async function getUtilizationRatio(debtTokenAddress: Address): Promise<number> {
  const UTILIZATION_SCALE = BigInt(10 ** 18);
  if (debtTokenAddress === USDC.address) {
    let cusdcUtilization: bigint = await CompoundV3cUSDC.getUtilization();
    cusdcUtilization = cusdcUtilization / UTILIZATION_SCALE;
    return Number(cusdcUtilization);
  } else if (debtTokenAddress === WETH.address) {
    let cwethUtilization: bigint = await CompoundV3cWETH.getUtilization();
    cwethUtilization = cwethUtilization / UTILIZATION_SCALE;
    return Number(cwethUtilization);
  } else {
    throw new Error("Unsupported debt token address");
  }
}

// Fetches 30 days trailing borrowing APYs for Compound ETH and USDC pools
async function getBorrowingAPYsByTokenAddress(): Promise<Map<string, number>> {
  return Promise.all([
    calculate30DayTrailingBorrowingAndLendingAPYs(
      DEFILLAMA_COMPOUND_ETH_POOL_ID
    ),
    calculate30DayTrailingBorrowingAndLendingAPYs(
      DEFILLAMA_COMPOUND_USDC_POOL_ID
    )
  ]).then((apyData) => {
    const borrowingAPYs = new Map<string, number>();
    borrowingAPYs.set(WETH.address, apyData[0].trailingDayBorrowingAPY);
    borrowingAPYs.set(USDC.address, apyData[1].trailingDayBorrowingAPY);
    return borrowingAPYs;
  });
}

async function getCollateralsByUserAddress(
  market: Contract,
  userAddress: Address
): Promise<TokenAmount[]> {
  const marketAddress: Address = (await market.getAddress()) as Address;
  const collaterals: Token[] = getSupportedCollateral(marketAddress);
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

async function getBorrowBalance(
  market: Contract,
  userAddress: Address
): Promise<bigint> {
  try {
    const borrowBalance: bigint = await market.borrowBalanceOf(userAddress);
    return borrowBalance;
  } catch (error) {
    throw new Error("Failed to fetch borrow balance");
  }
}

// there seems to be no easy way to fetch supported collaterals for each market. So we store them as constant values. Even compound.js keeps constant values.
function getSupportedCollateral(marketAddress: Address): Token[] {
  try {
    let supportedCollaterals: Token[];
    if (marketAddress === COMPOUND_V3_CUSDC_ADDRESS) {
      supportedCollaterals = COMPOUND_V3_CUSDC_COLLATERALS.map(
        (collateral) => collateral
      );
    } else if (marketAddress === COMPOUND_V3_CWETH_ADDRESS) {
      supportedCollaterals = COMPOUND_V3_CWETH_COLLATERALS.map(
        (collateral) => collateral
      );
    } else {
      throw new Error("Unsupported market address");
    }
    return supportedCollaterals;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

function getSupportedCollateralTokens(debtTokenAddress?: Address): Token[] {
  try {
    let supportedCollateralTokens: Token[];
    if (debtTokenAddress === USDC.address) {
      supportedCollateralTokens = COMPOUND_V3_CUSDC_COLLATERALS;
    } else if (debtTokenAddress === WETH.address) {
      supportedCollateralTokens = COMPOUND_V3_CWETH_COLLATERALS;
    } else {
      throw new Error("Unsupported market address");
    }
    return supportedCollateralTokens;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getCollateralBalance(
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
    console.log(error);
    throw error;
  }
}

function getPriceFeedFromTokenSymbol(tokenSymbol: string): Address {
  if (tokenSymbol === "USDC") {
    return COMPOUND_V3_PRICEFEEDS.USDC;
  } else if (tokenSymbol === "WETH") {
    return COMPOUND_V3_PRICEFEEDS.WETH;
  } else if (tokenSymbol === "COMP") {
    return COMPOUND_V3_PRICEFEEDS.COMP;
  } else if (tokenSymbol === "WBTC") {
    return COMPOUND_V3_PRICEFEEDS.WBTC;
  } else if (tokenSymbol === "UNI") {
    return COMPOUND_V3_PRICEFEEDS.UNI;
  } else if (tokenSymbol === "LINK") {
    return COMPOUND_V3_PRICEFEEDS.LINK;
  } else if (tokenSymbol === "cbETH") {
    return COMPOUND_V3_PRICEFEEDS.cbETH;
  } else if (tokenSymbol === "wstETH") {
    return COMPOUND_V3_PRICEFEEDS.wstETH;
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

    if (market === CompoundV3cWETH) {
      // Compound ETH market returns price in ETH, e.g. 1 stETH = 1.05 ETH
      // so we need to multiply price by ETH price in USD
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
  let maxLtvAmountInUsd = BigInt(0);
  let totalCollateralAmountInUsd = BigInt(0);

  const promises = (collaterals as TokenAmount[]).map(async (collateral) => {
    const COLLATERAL_FACTOR_SCALE = BigInt(10 ** 18);
    const COLLATERAL_AMOUNT_SCALE = BigInt(10 ** collateral.token.decimals);

    let collateralFactor: bigint = await getCollateralFactor(
      market,
      collateral.token
    );
    const maxLtvAmountForCollateral: bigint =
      (collateral.amount * collateralFactor) /
      COLLATERAL_FACTOR_SCALE /
      COLLATERAL_AMOUNT_SCALE;
    const maxLtvAmountForCollateralInUSD: bigint = await getDebtUsdPrice(
      market,
      getPriceFeedFromTokenSymbol(collateral.token.symbol),
      maxLtvAmountForCollateral
    );
    maxLtvAmountInUsd += maxLtvAmountForCollateralInUSD / USD_SCALE;
    const collateralAmountInUSD: bigint = await getDebtUsdPrice(
      market,
      getPriceFeedFromTokenSymbol(collateral.token.symbol),
      collateral.amount / COLLATERAL_AMOUNT_SCALE
    );
    totalCollateralAmountInUsd += collateralAmountInUSD / USD_SCALE;
  });

  await Promise.all(promises);

  if (totalCollateralAmountInUsd === BigInt(0)) return 0;

  let maxLtvPercentage: number =
    Number(maxLtvAmountInUsd) / Number(totalCollateralAmountInUsd);
  return Number(maxLtvPercentage);
}

export async function getRecommendedDebtDetail(
  debtPosition: DebtPosition | MorphoBlueDebtPosition | CompoundV3DebtPosition,
  existingMarket: Market | MorphoBlueMarket | CompoundV3Market,
  protocol: Protocol
): Promise<CompoundV3RecommendedDebtDetail[] | null> {
  const markets: CompoundV3Market[] = await getAllCompoundV3Markets();

  // check if the debt token is in the markets
  const debtTokenMatchedMarkets = markets.filter((market) => {
    if (protocol === Protocol.AaveV3 || protocol === Protocol.Spark) {
      return (debtPosition as DebtPosition).debts.some(
        (debt) => market.debtToken.address === debt.token.address
      );
    } else if (protocol === Protocol.CompoundV3) {
      return (
        market.debtToken.address ===
        (debtPosition as CompoundV3DebtPosition).debt.token.address
      );
    } else if (protocol === Protocol.MorphoBlue) {
      return (
        market.debtToken.address ===
        (debtPosition as MorphoBlueDebtPosition).debt.token.address
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
    matchedMarket.utilizationRatio < 0.98;
  });

  // check if the new max LTV >= (the old max LTV - 5%)
  let newMaxLtV: number | undefined;
  matchedMarkets = matchedMarkets.filter(async (matchedMarket) => {
    const matchedMarketContract =
      matchedMarket.debtToken.address === USDC.address
        ? CompoundV3cUSDC
        : CompoundV3cWETH;
    if (
      protocol === Protocol.AaveV3 ||
      protocol === Protocol.Spark ||
      protocol === Protocol.CompoundV3
    ) {
      newMaxLtV = await getMaxLtv(
        matchedMarketContract,
        (
          (debtPosition as DebtPosition) ||
          (debtPosition as CompoundV3DebtPosition)
        ).collaterals
      );
    } else if (protocol === Protocol.MorphoBlue) {
      newMaxLtV = await getMaxLtv(
        matchedMarketContract,
        (debtPosition as MorphoBlueDebtPosition).collateral
      );
    }
    return newMaxLtV !== undefined && newMaxLtV >= debtPosition.maxLTV - 0.05;
  });

  // check if the old borrowing cost - the new borrowing cost > 3%
  matchedMarkets = matchedMarkets.filter((matchedMarket) => {
    if (isZeroOrNegative(debtPosition.trailing30DaysNetAPY)) {
      const spread: number =
        matchedMarket.trailing30DaysBorrowingAPY -
        Math.abs(debtPosition.trailing30DaysNetAPY);
      return spread > 0.03;
    } else if (isZeroOrPositive(debtPosition.trailing30DaysNetAPY)) {
      return false;
    }
  });

  const recommendedDebtDetails: CompoundV3RecommendedDebtDetail[] = [];
  matchedMarkets.forEach(async (matchedMarket) => {
    let matchedDebtToken: TokenAmount;
    if (protocol === Protocol.AaveV3 || protocol === Protocol.Spark) {
      matchedDebtToken = (debtPosition as DebtPosition).debts.find(
        (debt) => debt.token.address === matchedMarket.debtToken.address
      ) as TokenAmount;
    } else if (
      protocol === Protocol.CompoundV3 ||
      protocol === Protocol.MorphoBlue
    ) {
      matchedDebtToken = (
        (debtPosition as CompoundV3DebtPosition) ||
        (debtPosition as MorphoBlueDebtPosition)
      ).debt;
    } else {
      return null;
    }

    let matchedCollaterals: TokenAmount[] | TokenAmount;
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
      ) as TokenAmount[] | TokenAmount;
    } else {
      matchedCollaterals = (debtPosition as MorphoBlueDebtPosition).collateral;
    }

    const matchedMarketContract =
      matchedMarket.debtToken.address === USDC.address
        ? CompoundV3cUSDC
        : CompoundV3cWETH;

    let newLtv: number = await getLtv(
      matchedMarketContract,
      matchedDebtToken.amountInUSD,
      matchedCollaterals as TokenAmount[]
    );

    const newDebt = {
      maxLTV: newMaxLtV as number,
      LTV: newLtv,
      trailing30DaysNetAPY: 0 - matchedMarket.trailing30DaysBorrowingAPY,
      debt: matchedDebtToken,
      collaterals: matchedCollaterals as TokenAmount[]
    };

    recommendedDebtDetails.push({
      protocol: Protocol.MorphoBlue,
      trailing30DaysNetAPY: 0 - matchedMarket.trailing30DaysBorrowingAPY,
      debt: newDebt,
      market: matchedMarket
    });
  });
  return recommendedDebtDetails;
}
