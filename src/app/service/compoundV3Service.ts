import type { Address } from "abitype";
import { ethers, Contract } from "ethers";
import {
  ALCHEMY_API_URL_2,
  DEFILLAMA_COMPOUND_ETH_POOL_ID,
  DEFILLAMA_COMPOUND_USDC_POOL_ID,
} from "../constants";
import {
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_CUSDC_COLLATERALS,
  COMPOUND_V3_CWETH_COLLATERALS,
  COMPOUND_V3_PRICEFEEDS,
  COMPOUND_V3_ABI,
} from "../contracts/compoundV3";
import { USDC, WETH } from "../contracts/ERC20Tokens";
import {
  Token,
  TokenAmount,
  CompoundV3UserDebtDetails,
  CompoundV3Market,
  CompoundV3DebtPosition,
  Protocol,
} from "../type/type";
import { getTokenByAddress } from "../utils/utils";
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

    const debtPosition: CompoundV3DebtPosition = {
      maxLTV: getMaxLtv(CompoundV3cUSDC, cUSDCcollaterals),
      LTV: await getLtv(CompoundV3cUSDC, debtAmountInUSD, cUSDCcollaterals),
      debt: {
        token: USDC,
        amount: cUSDCBorrowBalance,
        amountInUSD: debtAmountInUSD,
      },
      collaterals: cUSDCcollaterals,
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

    const cWETHdebtPosition: CompoundV3DebtPosition = {
      maxLTV: getMaxLtv(CompoundV3cWETH, cWETHcollaterals),
      LTV: await getLtv(CompoundV3cWETH, debtAmountInUSD, cWETHcollaterals),
      debt: {
        token: WETH,
        amount: cWETHBorrowBalance,
        amountInUSD: debtAmountInUSD,
      },
      collaterals: cWETHcollaterals,
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
  const compoundV3UserDebtDetails: CompoundV3UserDebtDetails = {
    protocol: Protocol.CompoundV3,
    userAddress: userAddress,
    markets: markets,
    debtPositions: debtPositions,
  };
  return compoundV3UserDebtDetails;
}

// get a market based on the debt token
async function getCompoundV3Markets(
  debtPositions: CompoundV3DebtPosition[]
): Promise<CompoundV3Market[]> {
  // Fetch borrowing APYs for Compound ETH and USDC pools
  return getBorrowingAPYsByTokenAddress().then((borrowingAPYs) => {
    const markets: CompoundV3Market[] = [];
    debtPositions.forEach((debtPosition) => {
      const debtTokenAddress: Address = debtPosition.debt.token.address;
      const market: CompoundV3Market = {
        trailing30DaysBorrowingAPY: borrowingAPYs.get(debtTokenAddress) || 0,
        debtToken: getTokenByAddress(debtTokenAddress),
        collateralTokens: getSupportedCollateralTokens(debtTokenAddress),
      };
      markets.push(market);
    });
    return markets;
  });
}

// Fetches 30 days trailing borrowing APYs for Compound ETH and USDC pools
async function getBorrowingAPYsByTokenAddress(): Promise<Map<string, number>> {
  return Promise.all([
    calculate30DayTrailingBorrowingAndLendingAPYs(
      DEFILLAMA_COMPOUND_ETH_POOL_ID
    ),
    calculate30DayTrailingBorrowingAndLendingAPYs(
      DEFILLAMA_COMPOUND_USDC_POOL_ID
    ),
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
        amountInUSD: amountInUSD,
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
    let supportedCollateralAddresses: Address[];
    if (marketAddress === COMPOUND_V3_CUSDC_ADDRESS) {
      supportedCollateralAddresses = COMPOUND_V3_CUSDC_COLLATERALS.map(
        (collateral) => collateral.address
      );
    } else if (marketAddress === COMPOUND_V3_CWETH_ADDRESS) {
      supportedCollateralAddresses = COMPOUND_V3_CWETH_COLLATERALS.map(
        (collateral) => collateral.address
      );
    } else {
      throw new Error("Unsupported market address");
    }
    return supportedCollateralAddresses;
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

async function getDebtUsdPrice(
  market: Contract,
  priceFeed: Address,
  amount: bigint
): Promise<bigint> {
  try {
    const rate: bigint = await market.getPrice(priceFeed);
    const usdPrice: bigint = amount * rate;
    return usdPrice;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getLtv(
  market: Contract,
  debtAmountInUSD: bigint,
  collaterals: TokenAmount[]
): Promise<bigint> {
  const collateralBalanceInUsd: bigint[] = await Promise.all(
    collaterals.map(async (collateral) => {
      const usdPrice: bigint = await getDebtUsdPrice(
        market,
        getPriceFeedFromTokenSymbol(collateral.token.symbol),
        collateral.amount
      );
      return usdPrice * collateral.amount;
    })
  );
  const totalCollateralBalanceInUsd: bigint = collateralBalanceInUsd.reduce(
    (totalBalance: bigint, currentBalance) => totalBalance + currentBalance,
    BigInt(0)
  );
  const ltv = debtAmountInUSD / totalCollateralBalanceInUsd;
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
function getMaxLtv(market: Contract, collaterals: TokenAmount[]): bigint {
  let maxLtvAmountInUsd = BigInt(0);
  let totalCollateralAmountInUsd = BigInt(0);

  collaterals.forEach(async (collateral) => {
    let collateralFactor: bigint = await getCollateralFactor(
      market,
      collateral.token
    );
    collateralFactor = collateralFactor / BigInt(10 ** (18 + 2));
    const maxLtvAmountForCollateral: bigint =
      collateral.amount * collateralFactor;
    const maxLtvAmountForCollateralInUSD: bigint = await getDebtUsdPrice(
      market,
      getPriceFeedFromTokenSymbol(collateral.token.symbol),
      maxLtvAmountForCollateral
    );
    maxLtvAmountInUsd += maxLtvAmountForCollateralInUSD;
    const collateralAmountInUSD: bigint = await getDebtUsdPrice(
      market,
      getPriceFeedFromTokenSymbol(collateral.token.symbol),
      collateral.amount
    );
    totalCollateralAmountInUsd += collateralAmountInUSD;
  });

  if (totalCollateralAmountInUsd === BigInt(0)) return BigInt(0);

  const maxLtvPercentage: bigint =
    maxLtvAmountInUsd / totalCollateralAmountInUsd;
  return maxLtvPercentage;
}
