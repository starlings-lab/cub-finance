import type { Address } from "abitype";
import { ethers, Contract } from "ethers";
import { ALCHEMY_API_URL_2 } from "../constants";
import {
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_CUSDC_COLLATERALS,
  COMPOUND_V3_CWETH_COLLATERALS,
  COMPOUND_V3_USDC_PRICEFEED,
  COMPOUND_V3_WETH_PRICEFEED,
  COMPOUND_V3_ABI
} from "../contracts/compoundV3";
import { USDC, WETH } from "../contracts/ERC20Tokens";
import {
  Token,
  TokenAmount,
  CompoundV3UserDebtDetails,
  CompoundV3Market,
  CompoundV3DebtPosition,
  Protocol
} from "../type/type";
import { getTokenByAddress } from "../utils/utils";

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
    CompoundV3UserDebtDetails = addMarketsToDebtPositions(
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
  const cUSDCBorrowBalance = await getBorrowBalance(
    CompoundV3cUSDC,
    userAddress
  );
  if (cUSDCBorrowBalance != BigInt(0)) {
    const debtAmountInUSD = await getDebtUsdPrice(
      CompoundV3cUSDC,
      COMPOUND_V3_USDC_PRICEFEED,
      cUSDCBorrowBalance
    );
    const cUSDCcollaterals = await getCollateralsByUserAddress(
      CompoundV3cUSDC,
      userAddress
    );

    const debtPosition: CompoundV3DebtPosition = {
      maxLTV: getMaxLtv(CompoundV3cUSDC, cUSDCcollaterals),
      LTV: await getLtv(CompoundV3cUSDC, debtAmountInUSD, cUSDCcollaterals),
      debt: {
        token: USDC,
        amount: cUSDCBorrowBalance,
        amountInUSD: debtAmountInUSD
      },
      collaterals: cUSDCcollaterals
    };
    debtPositions.push(debtPosition);
  }
  const cWETHBorrowBalance = await getBorrowBalance(
    CompoundV3cWETH,
    userAddress
  );
  if (cWETHBorrowBalance != BigInt(0)) {
    const debtAmountInUSD = await getDebtUsdPrice(
      CompoundV3cWETH,
      COMPOUND_V3_WETH_PRICEFEED,
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
        amountInUSD: debtAmountInUSD
      },
      collaterals: cWETHcollaterals
    };
    debtPositions.push(cWETHdebtPosition);
  }
  return debtPositions;
}

function addMarketsToDebtPositions(
  userAddress: Address,
  debtPositions: CompoundV3DebtPosition[]
): CompoundV3UserDebtDetails {
  const markets = getCompoundV3Markets(debtPositions);
  const compoundV3UserDebtDetails: CompoundV3UserDebtDetails = {
    protocol: Protocol.CompoundV3,
    userAddress: userAddress,
    markets: markets,
    debtPositions: debtPositions
  };
  return compoundV3UserDebtDetails;
}

// get a market based on the debt token
function getCompoundV3Markets(
  debtPositions: CompoundV3DebtPosition[]
): CompoundV3Market[] {
  const markets: CompoundV3Market[] = [];
  debtPositions.forEach((debtPosition) => {
    const debtTokenAddress = debtPosition.debt.token.address;
    const market: CompoundV3Market = {
      trailing30DaysBorrowingAPY: 0,
      debtToken: getTokenByAddress(debtTokenAddress),
      collateralTokens: getSupportedCollateralTokens(debtTokenAddress)
    };
    markets.push(market);
  });
  return markets;
}

async function getCollateralsByUserAddress(
  market: Contract,
  userAddress: Address
): Promise<TokenAmount[]> {
  const marketAddress = (await market.getAddress()) as Address;
  const collateralAddresses = getSupportedCollateralAddresses(marketAddress);
  const collateralsPromise = collateralAddresses.map(
    async (collateralAddress) => {
      const collateralAmount = await getCollateralBalance(
        market,
        userAddress,
        collateralAddress
      );
      if (collateralAmount != BigInt(0)) {
        const amountInUSD = await getCollateralUsdPrice(
          market,
          collateralAddress,
          collateralAmount
        );
        return {
          token: getTokenByAddress(collateralAddress),
          amount: collateralAmount,
          amountInUSD: amountInUSD
        };
      }
      return null;
    }
  );
  const collaterals = await Promise.all(collateralsPromise);
  return collaterals.filter(
    (collateral): collateral is TokenAmount => collateral !== null
  );
}

async function getBorrowBalance(
  market: Contract,
  userAddress: Address
): Promise<BigInt> {
  try {
    const borrowBalance = await market.borrowBalanceOf(userAddress);
    return BigInt(borrowBalance);
  } catch (error) {
    console.error("Error fetching borrow balance:", error);
    throw new Error("Failed to fetch borrow balance");
  }
}

// there seems to be no easy way to fetch supported collaterals for each market. So we store them as constant values. Even compound.js keeps constant values.
function getSupportedCollateralAddresses(marketAddress: Address): Address[] {
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
): Promise<BigInt> {
  try {
    const collateralBalance = await market.collateralBalanceOf(
      userAddress,
      tokenAddress
    );
    return collateralBalance;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getCollateralUsdPrice(
  market: Contract,
  tokenAddress: Address,
  amount: BigInt
): Promise<number> {
  try {
    const usdPrice = await market.quoteCollateral(tokenAddress, amount);
    return usdPrice;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getDebtUsdPrice(
  market: Contract,
  priceFeed: Address,
  amount: BigInt
): Promise<number> {
  try {
    const rate = await market.getPrice(priceFeed);
    const usdPrice = Number(amount) * Number(rate);
    return usdPrice;
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
  const collateralBalanceInUsd: number[] = await Promise.all(
    collaterals.map(async (collateral) => {
      const usdPrice = await getCollateralUsdPrice(
        market,
        collateral.token.address,
        collateral.amount
      );
      return Number(usdPrice) * Number(collateral.amount);
    })
  );
  const totalCollateralBalanceInUsd = collateralBalanceInUsd.reduce(
    (totalBalance, currentBalance) => totalBalance + currentBalance,
    0
  );
  const ltv = debtAmountInUSD / totalCollateralBalanceInUsd;
  return ltv;
}

// collateral factor is max LTV for each collateral
async function getCollateralFactor(
  market: Contract,
  collateral: Token
): Promise<BigInt> {
  const assetInfo = await market.getAssetInfoByAddress(collateral.address);
  const collateralFactor = BigInt(assetInfo.borrowCollateralFactor);
  return collateralFactor;
}

// max LTV for each market
function getMaxLtv(market: Contract, collaterals: TokenAmount[]): number {
  let maxLtvAmount = 0;
  let totalCollateralAmount = 0;

  collaterals.forEach(async (collateral) => {
    const collateralFactor = await getCollateralFactor(
      market,
      collateral.token
    );
    const maxLtvAmountForCollateral =
      Number(collateral.amount) * Number(collateralFactor);
    maxLtvAmount += maxLtvAmountForCollateral;
    totalCollateralAmount += Number(collateral.amount);
  });

  if (totalCollateralAmount === 0) return 0;

  const maxLtvPercentage = Number(maxLtvAmount) / Number(totalCollateralAmount);
  return maxLtvPercentage;
}
