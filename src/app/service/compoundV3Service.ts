import type { Address } from "abitype";
import { Contract } from "ethers";
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
import { USDC, WETH, ETH } from "../contracts/ERC20Tokens";
import {
  Token,
  TokenAmount,
  CompoundV3Market,
  CompoundV3DebtPosition,
  Protocol,
  CompoundV3RecommendedDebtDetail,
  APYInfo,
  Chain
} from "../type/type";
import { getTokenByAddress } from "../utils/utils";
import { get30DayTrailingAPYInfo } from "./defiLlamaDataService";

const USD_SCALE = BigInt(10 ** 8);
const MAX_UTILIZATION_RATIO = 0.98;

async function getAllCompoundV3Markets(): Promise<CompoundV3Market[]> {
  return Promise.all([
    getBorrowingAPYsByTokenSymbol(),
    getUtilizationRatio(USDC.address),
    getUtilizationRatio(WETH.address)
  ]).then((data) => {
    const apyInfoMap = data[0];
    const usdcAPYInfo = apyInfoMap.get(USDC.address)!;
    const wethAPYInfo = apyInfoMap.get(ETH.address)!; // ETH is used in DefiLlama

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
async function getBorrowingAPYsByTokenSymbol(): Promise<Map<string, APYInfo>> {
  return Promise.all([
    get30DayTrailingAPYInfo(Protocol.CompoundV3, ETH.symbol), // ETH is used in DefiLlama
    get30DayTrailingAPYInfo(Protocol.CompoundV3, USDC.symbol)
  ]).then((apyData) => {
    const borrowingAPYs = new Map<string, APYInfo>();
    borrowingAPYs.set(ETH.address, apyData[0]);
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

export function getSupportedCollateralTokens(chain: Chain): Promise<Token[]> {
  if (chain === Chain.EthMainNet) {
    return Promise.resolve(COMPOUND_V3_COLLATERALS);
  } else {
    return Promise.resolve([]);
  }
}

export function getSupportedDebtTokens(chain: Chain): Promise<Token[]> {
  if (chain === Chain.EthMainNet) {
    return Promise.resolve(COMPOUND_V3_DEBTS);
  } else {
    return Promise.resolve([]);
  }
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

export function getPriceFeedFromTokenSymbol(tokenSymbol: string): Address {
  const supportedTokens = {
    USDC: COMPOUND_V3_PRICEFEEDS.USDC,
    WETH: COMPOUND_V3_PRICEFEEDS.WETH,
    ETH: COMPOUND_V3_PRICEFEEDS.WETH,
    COMP: COMPOUND_V3_PRICEFEEDS.COMP,
    WBTC: COMPOUND_V3_PRICEFEEDS.WBTC,
    UNI: COMPOUND_V3_PRICEFEEDS.UNI,
    LINK: COMPOUND_V3_PRICEFEEDS.LINK,
    CBETH: COMPOUND_V3_PRICEFEEDS.cbETH,
    WSTETH: COMPOUND_V3_PRICEFEEDS.wstETH
  };

  const tokenSymbolUpper = tokenSymbol.toUpperCase();
  if (tokenSymbolUpper in supportedTokens) {
    return supportedTokens[tokenSymbolUpper as keyof typeof supportedTokens];
  } else {
    throw new Error("Unsupported token name: " + tokenSymbol);
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

export async function calculateTokenAmount(
  market: Contract,
  priceFeed: Address,
  amountInUsd: number,
  token: Token
): Promise<bigint> {
  try {
    let rate: bigint = await market.getPrice(priceFeed);

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
      rate = (rate * ethUsdRate) / USD_SCALE;
    }

    const amount =
      (BigInt(Math.floor(amountInUsd) * 10 ** 8) *
        BigInt(10 ** token.decimals)) /
      rate;
    // console.log(`Amount: ${amount}, Rate: ${rate}`);

    return amount;
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
  const totalCollateralBalanceInUsd = (
    await calculateAndSetCollateralAmountInUsd(collaterals, market)
  ).reduce((total, collateral) => total + collateral.amountInUSD, 0);

  // console.log(
  //   `Total collateral balance in USD: ${totalCollateralBalanceInUsd}, Debt amount in USD: ${debtAmountInUSD}`
  // );
  const ltv = debtAmountInUSD / totalCollateralBalanceInUsd;
  return ltv;
}

async function calculateAndSetCollateralAmountInUsd(
  collaterals: TokenAmount[],
  market: Contract
): Promise<TokenAmount[]> {
  return await Promise.all(
    collaterals.map(async (collateral) => {
      const COLLATERAL_TOKEN_SCALE = BigInt(10 ** collateral.token.decimals);
      const usdPrice: bigint = await getDebtUsdPrice(
        market,
        getPriceFeedFromTokenSymbol(collateral.token.symbol),
        collateral.amount
      );
      collateral.amountInUSD = Number(
        usdPrice / COLLATERAL_TOKEN_SCALE / USD_SCALE
      );
      return collateral;
    })
  );
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

  const collateralsArray = Array.isArray(collaterals)
    ? collaterals
    : [collaterals];

  const promises = collateralsArray.map(async (collateral) => {
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

  if (totalCollateralAmountInUsd === 0) return 0;

  let maxLtvPercentage: number = maxLtvAmountInUsd / totalCollateralAmountInUsd;
  return maxLtvPercentage;
}

export async function getBorrowRecommendations(
  userDebtTokens: Token[],
  userCollaterals: TokenAmount[]
): Promise<CompoundV3RecommendedDebtDetail[]> {
  const recommendations: CompoundV3RecommendedDebtDetail[] = [];

  // check if the debt token and its required collaterals are supported
  const supportedDebtTokens = await getSupportedDebtTokens();
  const supportedCollateralsByDebtTokenMap = new Map<Token, TokenAmount[]>();

  userDebtTokens.forEach((debtToken) => {
    const debtTokenIsSupported = supportedDebtTokens.some(
      (supportedDebtToken) => supportedDebtToken.address === debtToken.address
    );

    if (debtTokenIsSupported) {
      // Compound only supports certain collaterals for each debt token
      const supportedCollateralTokensForDebt =
        getSupportedCollateralTokensByDebtToken(debtToken.address);
      const filteredCollaterals = userCollaterals.filter((userCollateral) =>
        supportedCollateralTokensForDebt.some(
          (supportedCollateral) =>
            userCollateral.token.address.toLowerCase() ===
            supportedCollateral.address.toLowerCase()
        )
      );

      // Check if the user has the required collaterals for the debt token
      if (filteredCollaterals.length > 0) {
        supportedCollateralsByDebtTokenMap.set(debtToken, filteredCollaterals);
      }
    }
  });

  if (supportedCollateralsByDebtTokenMap.size === 0) {
    return recommendations;
  }

  const marketsMap = new Map<string, CompoundV3Market>(
    (await getAllCompoundV3Markets()).map((market) => [
      market.debtToken.address.toLowerCase(),
      market
    ])
  );
  // console.log("Markets map: ", marketsMap);

  // create a recommended position for each matched debt token
  const matchedDebtTokens = Array.from(
    supportedCollateralsByDebtTokenMap.keys()
  );

  for (let i = 0; i < matchedDebtTokens.length; i++) {
    const debtToken = matchedDebtTokens[i];

    // If the utilization ratio is too high, skip the debt recommendation
    const debtMarket = marketsMap.get(debtToken.address.toLowerCase())!;
    if (debtMarket.utilizationRatio >= MAX_UTILIZATION_RATIO) {
      continue;
    }

    const supportedCollaterals =
      supportedCollateralsByDebtTokenMap.get(debtToken)!;

    const debtMarketContract =
      debtToken.address.toLowerCase() === USDC.address.toLowerCase()
        ? COMPOUND_V3_CUSDC_CONTRACT
        : debtToken.address.toLowerCase() === WETH.address.toLowerCase()
        ? COMPOUND_V3_CWETH_CONTRACT
        : null;
    if (!debtMarketContract) {
      console.log("Compound V3: Unsupported debt token: ", debtToken);
      continue;
    }

    // Calculate total collateral amount in USD
    const totalCollateralAmountInUSD: number = (
      await calculateAndSetCollateralAmountInUsd(
        supportedCollaterals,
        debtMarketContract
      )
    ).reduce((sum, collateral) => sum + collateral.amountInUSD, 0);

    // Calculate recommended debt amount using max LTV
    const maxLTV = await getMaxLtv(debtMarketContract, supportedCollaterals);

    const debtAmountInUSD = maxLTV * totalCollateralAmountInUSD;

    const recommendedDebt: CompoundV3DebtPosition = {
      maxLTV,
      LTV: debtAmountInUSD / totalCollateralAmountInUSD,
      debt: {
        token: debtToken,
        amount: await calculateTokenAmount(
          debtMarketContract,
          getPriceFeedFromTokenSymbol(debtToken.symbol),
          debtAmountInUSD,
          debtToken
        ),
        amountInUSD: debtAmountInUSD
      },
      collaterals: supportedCollaterals,
      trailing30DaysNetBorrowingAPY:
        0 -
        debtMarket.trailing30DaysBorrowingAPY +
        debtMarket.trailing30DaysBorrowingRewardAPY
    };

    recommendations.push({
      protocol: Protocol.CompoundV3,
      debt: recommendedDebt,
      market: debtMarket
    });
  }

  return recommendations;
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
