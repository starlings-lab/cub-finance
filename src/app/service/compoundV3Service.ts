import type { Address } from "abitype";
import { Contract } from "ethers";
import {
  COMPOUND_V3_DEBTS_ETH_MAINNET,
  COMPOUND_V3_COLLATERALS_ETH_MAINNET,
  COMPOUND_V3_PRICEFEEDS_ETH_MAINNET,
  COMPOUND_V3_DEBTS_ARB_MAINNET,
  getCompoundV3MarketContract,
  COMPOUND_V3_COLLATERALS_ARB_MAINNET,
  getSupportedCollateralsByDebtToken,
  getPriceFeedFromTokenSymbol
} from "../contracts/compoundV3";
import { WETH, ETH } from "../contracts/ERC20Tokens";
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
import { get30DayTrailingAPYInfo } from "./defiLlamaDataService";

const USD_SCALE = BigInt(10 ** 8);
const MAX_UTILIZATION_RATIO = 0.98;
const UTILIZATION_SCALE = 10 ** 18;

async function getAllCompoundV3Markets(
  chain: Chain
): Promise<Map<Address, CompoundV3Market>> {
  return getSupportedDebtTokens(chain).then((supportedDebtTokens) => {
    return Promise.all([
      getBorrowingAPYsByTokenSymbol(supportedDebtTokens),
      getUtilizationRatioMapByDebtTokenAddress(chain, supportedDebtTokens)
    ]).then((data) => {
      const apyInfoMap = data[0];
      const utilizationRatioMap = data[1];
      return supportedDebtTokens.reduce((map, debtToken) => {
        // ETH is used in DefiLlama
        const apyInfo = apyInfoMap.get(debtToken.address)!;
        const market = {
          trailing30DaysBorrowingAPY: apyInfo.borrowingAPY ?? 0,
          trailing30DaysBorrowingRewardAPY: apyInfo.borrowingRewardAPY ?? 0,
          trailing30DaysLendingRewardAPY: apyInfo.lendingRewardAPY ?? 0,
          utilizationRatio: utilizationRatioMap.get(debtToken.address) ?? 0,
          debtToken: debtToken,
          collateralTokens: getSupportedCollateralsByDebtToken(
            chain,
            debtToken.address
          )
        };
        map.set(debtToken.address.toLocaleLowerCase() as Address, market);
        return map;
      }, new Map<Address, CompoundV3Market>());
    });
  });
}

export async function getUtilizationRatioMapByDebtTokenAddress(
  chain: Chain,
  supportedDebtTokens: Token[]
): Promise<Map<Address, number>> {
  const utilizationRatioMap = new Map<Address, number>();
  for (let i = 0; i < supportedDebtTokens.length; i++) {
    const debtToken = supportedDebtTokens[i];
    const market = getCompoundV3MarketContract(chain, debtToken.address);
    const utilization = await market.getUtilization();
    const utilizationNumber = Number(utilization) / UTILIZATION_SCALE;
    utilizationRatioMap.set(
      debtToken.address.toLowerCase() as Address,
      utilizationNumber
    );
  }
  return utilizationRatioMap;
}

// Fetches 30 days trailing borrowing APYs for supported CompoundV3 debt tokens
async function getBorrowingAPYsByTokenSymbol(
  supportedDebtTokens: Token[]
): Promise<Map<string, APYInfo>> {
  const borrowingAPYs = new Map<string, APYInfo>();
  for (const debtToken of supportedDebtTokens) {
    const apyInfo = await get30DayTrailingAPYInfo(
      Protocol.CompoundV3,
      // ETH symbol is used in DefiLlama for WETH
      debtToken.symbol == WETH.symbol ? ETH.symbol : debtToken.symbol
    );
    borrowingAPYs.set(debtToken.address, apyInfo);
  }
  return borrowingAPYs;
}

export function getSupportedCollateralTokens(chain: Chain): Promise<Token[]> {
  if (chain === Chain.EthMainNet) {
    return Promise.resolve(COMPOUND_V3_COLLATERALS_ETH_MAINNET);
  } else if (chain === Chain.ArbMainNet) {
    return Promise.resolve(COMPOUND_V3_COLLATERALS_ARB_MAINNET);
  } else {
    throw new Error(`Unsupported chain: ${chain}`);
  }
}

export function getSupportedDebtTokens(chain: Chain): Promise<Token[]> {
  if (chain === Chain.EthMainNet) {
    return Promise.resolve(COMPOUND_V3_DEBTS_ETH_MAINNET);
  } else if (chain === Chain.ArbMainNet) {
    return Promise.resolve(COMPOUND_V3_DEBTS_ARB_MAINNET);
  } else {
    throw new Error(`Unsupported chain: ${chain}`);
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

    // On mainnet, ETH LST price feeds returns price in ETH, e.g. 1 stETH = 1.05 ETH
    // so we need to multiply price by ETH price in USD.
    // On arbitrum, WETH price feed returns ETH price, so we don't need to multiply by ETH price in USD.
    if (isPriceFeedForMainnetLST(priceFeed)) {
      const ethUsdRate: bigint = await market.getPrice(
        COMPOUND_V3_PRICEFEEDS_ETH_MAINNET.ETH
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
    // On arbitrum, WETH price feed returns ETH price, so we don't need to multiply by ETH price in USD.
    if (isPriceFeedForMainnetLST(priceFeed)) {
      const ethUsdRate: bigint = await market.getPrice(
        COMPOUND_V3_PRICEFEEDS_ETH_MAINNET.ETH
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

function isPriceFeedForMainnetLST(priceFeed: Address) {
  return (
    priceFeed === COMPOUND_V3_PRICEFEEDS_ETH_MAINNET.CBETH ||
    priceFeed === COMPOUND_V3_PRICEFEEDS_ETH_MAINNET.WSTETH ||
    priceFeed === COMPOUND_V3_PRICEFEEDS_ETH_MAINNET.RETH ||
    priceFeed === COMPOUND_V3_PRICEFEEDS_ETH_MAINNET.WETH
  );
}

async function calculateAndSetCollateralAmountInUsd(
  chain: Chain,
  collaterals: TokenAmount[],
  market: Contract
): Promise<TokenAmount[]> {
  return await Promise.all(
    collaterals.map(async (collateral) => {
      const COLLATERAL_TOKEN_SCALE = BigInt(10 ** collateral.token.decimals);
      const usdPrice: bigint = await getDebtUsdPrice(
        market,
        getPriceFeedFromTokenSymbol(chain, collateral.token.symbol),
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
  collaterals: TokenAmount[]
): Promise<number> {
  let maxLtvAmountInUsd: number = 0;
  let totalCollateralAmountInUsd: number = 0;
  const COLLATERAL_FACTOR_SCALE = 10 ** 18;

  const promises = collaterals.map(async (collateral) => {
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
  chain: Chain,
  userDebtTokens: Token[],
  userCollaterals: TokenAmount[]
): Promise<CompoundV3RecommendedDebtDetail[]> {
  const recommendations: CompoundV3RecommendedDebtDetail[] = [];

  // check if the debt token and its required collaterals are supported
  const supportedDebtTokens = await getSupportedDebtTokens(chain);
  const supportedCollateralsByDebtTokenMap = new Map<Token, TokenAmount[]>();

  userDebtTokens.forEach((debtToken) => {
    const debtTokenIsSupported = supportedDebtTokens.some(
      (supportedDebtToken) =>
        supportedDebtToken.address.toLowerCase() ===
        debtToken.address.toLowerCase()
    );

    if (debtTokenIsSupported) {
      // Compound only supports certain collaterals for each debt token
      const supportedCollateralTokensForDebt =
        getSupportedCollateralsByDebtToken(chain, debtToken.address);
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

  const marketsMap: Map<Address, CompoundV3Market> =
    await getAllCompoundV3Markets(chain);
  // console.log("Markets map: ", marketsMap);

  // create a recommended position for each matched debt token
  const matchedDebtTokens = Array.from(
    supportedCollateralsByDebtTokenMap.keys()
  );

  for (let i = 0; i < matchedDebtTokens.length; i++) {
    const debtToken = matchedDebtTokens[i];

    // If the utilization ratio is too high, skip the debt recommendation
    const debtMarket = marketsMap.get(
      debtToken.address.toLowerCase() as Address
    )!;
    if (debtMarket.utilizationRatio >= MAX_UTILIZATION_RATIO) {
      continue;
    }

    const supportedCollaterals =
      supportedCollateralsByDebtTokenMap.get(debtToken)!;

    const debtMarketContract = getCompoundV3MarketContract(
      chain,
      debtToken.address
    );

    // Calculate total collateral amount in USD
    const totalCollateralAmountInUSD: number = (
      await calculateAndSetCollateralAmountInUsd(
        chain,
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
          getPriceFeedFromTokenSymbol(chain, debtToken.symbol),
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
