import { DebtPosition, Market, Token, TokenAmount } from "../type/type";
import { AaveMarket, BaseCurrencyInfo } from "./BaseAaveService";

// Module level Helper functions
export function createToken(reserve: any) {
  return {
    address: reserve.underlyingAsset,
    name: reserve.name,
    symbol: reserve.symbol,
    decimals: reserve.decimals
  };
}

export function createNewDebtPosition(
  newMaxLTV: number,
  existingDebt: TokenAmount,
  newCollaterals: TokenAmount[],
  marketsMap: Map<string, AaveMarket>,
  baseCurrencyData: BaseCurrencyInfo
): DebtPosition {
  const newCollateralAmountInUsd = newCollaterals.reduce(
    (acc, curr) => acc + curr.amountInUSD,
    0
  );

  // Determine new LTV and debt amount based on new max LTV and collateral value
  let { newLTV, newDebt } = determineNewLTVAndDebtAmount(
    existingDebt,
    newCollateralAmountInUsd,
    newMaxLTV,
    marketsMap,
    baseCurrencyData
  );

  return {
    maxLTV: newMaxLTV,
    LTV: newLTV,
    debts: [newDebt],
    collaterals: newCollaterals,
    trailing30DaysNetBorrowingAPY: calculateNetBorrowingAPY(
      newCollaterals,
      [newDebt],
      marketsMap
    ),
    weightedAvgTrailing30DaysLendingAPY: calculateWeightedAvgLendingAPY(
      newCollaterals,
      marketsMap
    ),
    weightedAvgTrailing30DaysLendingRewardAPY:
      calculateWeightedAvgLendingRewardAPY(newCollaterals, marketsMap)
  };
}

function determineNewLTVAndDebtAmount(
  existingDebt: TokenAmount,
  newCollateralAmountInUsd: number,
  newMaxLTV: number,
  marketsMap: Map<string, AaveMarket>,
  baseCurrencyData: BaseCurrencyInfo
) {
  const ltvBuffer = 0.05; // 5% buffer
  let newLTV = existingDebt.amountInUSD / newCollateralAmountInUsd;
  let newDebt = existingDebt;

  if (newLTV > newMaxLTV) {
    // We need to make a recommendation with reduced debt based
    // on the new max LTV and collateral value
    // console.log(`New LTV: ${newLTV} is higher than new max LTV: ${newMaxLTV}`);
    // cap the new LTV to new max LTV - buffer
    newLTV = newMaxLTV - ltvBuffer;
    const newDebtAmountInUSD = newLTV * newCollateralAmountInUsd;

    // console.dir(marketsMap.get(existingDebt.token.address.toLowerCase()), {
    //   depth: null
    // });
    // Calculate debt token's price in USD
    const priceInUSD = marketsMap.get(
      existingDebt.token.address.toLowerCase()
    )!.priceInMarketReferenceCurrency;

    // new debt amount in token = (newDebtAmountInUSD * 10 ** tokenDecimals) / price in USD
    const newDebtTokenAmount =
      (BigInt(Math.floor(newDebtAmountInUSD)) *
        BigInt(10 ** existingDebt.token.decimals) *
        baseCurrencyData.marketReferenceCurrencyUnit) /
      BigInt(priceInUSD);

    newDebt = {
      ...existingDebt,
      amountInUSD: newDebtAmountInUSD,
      amount: newDebtTokenAmount
    };
  }
  return { newLTV, newDebt };
}

export function calculateMaxLtv(
  newCollaterals: TokenAmount[],
  reservesMap: Map<string, any>
): number {
  let totalMaxLtvAmountInUsd: number = 0;
  let totalCollateralAmountInUsd: number = 0;

  newCollaterals.map((collateral) => {
    const collateralReserve = reservesMap.get(
      collateral.token.address.toLowerCase()
    );
    const collateralFactor: number =
      Number(collateralReserve.baseLTVasCollateral) / 10000;

    const maxLtvAmountForCollateralInUSD: number =
      collateral.amountInUSD * collateralFactor;
    totalMaxLtvAmountInUsd += maxLtvAmountForCollateralInUSD;
    totalCollateralAmountInUsd += collateral.amountInUSD;
  });

  let maxLtvPercentage: number =
    totalMaxLtvAmountInUsd / totalCollateralAmountInUsd;
  return maxLtvPercentage;
}

export function checkBorrowingAvailability(
  debtReserve: any,
  debtAmount: bigint
) {
  const borrowCap =
    BigInt(debtReserve.borrowCap) * BigInt(10 ** Number(debtReserve.decimals));
  const availableBorrowingAmount =
    borrowCap === BigInt(0) ? debtReserve.availableLiquidity : borrowCap;

  const isAvailableForBorrowing = availableBorrowingAmount > debtAmount;
  // console.log(
  //   `Available borrowing amount: ${availableBorrowingAmount}, debt amount: ${debtAmount}`
  // );
  return isAvailableForBorrowing;
}

export function calculateDebtAmountInBaseCurrency(
  scaledVariableDebt: bigint,
  assetReserveData: any,
  baseCurrencyUnit: bigint
): number {
  // Ref: https://docs.aave.com/developers/guides/rates-guide#variable-borrow-balances
  // Variable borrow balance =
  // VariableDebtToken.balanceOf(user) = VariableDebtToken.scaledBalanceOf(user) * Pool.getReserveData(underlyingTokenAddress).variableBorrowIndex
  const borrowAmountInBaseCurrency =
    (scaledVariableDebt *
      assetReserveData.variableBorrowIndex *
      assetReserveData.priceInMarketReferenceCurrency) /
    (BigInt(10 ** 27) * BigInt(10 ** Number(assetReserveData.decimals))); // borrow index uses ray decimals, see https://docs.aave.com/developers/v/2.0/glossary

  // Multiply and divide by 10000 to maintain 4 decimal places precision
  // TODO: need to get base currency unit(10 ** 8) from contract
  return (
    Number((borrowAmountInBaseCurrency * BigInt(10000)) / baseCurrencyUnit) /
    10000
  );
}

export function calculateCollateralAmountInBaseCurrency(
  scaledATokenBalance: bigint,
  assetReserveData: any,
  baseCurrencyUnit: bigint
): number {
  // Ref: https://docs.aave.com/developers/guides/rates-guide#supply-balances
  // Supply balance =
  // AToken.balanceOf(user) = AToken.scaledBalanceOf(user) * Pool.getReserveData(underlyingTokenAddress).liquidityIndex
  // console.log("Scaled AToken balance: ", scaledATokenBalance);
  const supplyAmount =
    (scaledATokenBalance * assetReserveData.liquidityIndex) / BigInt(10 ** 27); // Liquidity index uses ray decimals, see https://docs.aave.com/developers/v/2.0/glossary

  // console.log("Supply amount: ", supplyAmount);
  return calculateAmountInBaseCurrency(
    supplyAmount,
    assetReserveData,
    baseCurrencyUnit
  );
}

export function calculateAmountInBaseCurrency(
  amount: bigint,
  assetReserveData: any,
  baseCurrencyUnit: bigint
) {
  const supplyAmountInBaseCurrency =
    (amount * assetReserveData.priceInMarketReferenceCurrency) /
    BigInt(10 ** Number(assetReserveData.decimals));

  // Multiply and divide by 10000 to maintain 4 decimal places precision
  return (
    Number((supplyAmountInBaseCurrency * BigInt(10000)) / baseCurrencyUnit) /
    10000
  );
}

export function calculateTokenAmount(
  amountInUSD: number,
  assetReserveData: any,
  baseCurrencyUnit: bigint
): bigint {
  const scaledPriceInUSD: bigint =
    assetReserveData.priceInMarketReferenceCurrency;
  const tokenAmount =
    (BigInt(Math.floor(amountInUSD)) *
      BigInt(10 ** Number(assetReserveData.decimals)) *
      baseCurrencyUnit) /
    scaledPriceInUSD;
  return tokenAmount;
}

/**
 * Calculates net borrowing APY for a user's debt position based on total lending interest,
 * lending & borrowing rewards, borrowing costs & debt amount
 * @param collaterals
 * @param debts
 * @param marketMap
 * @returns netBorrowingAPY: (lendingInterest - borrowingInterest) / totalDebtAmount
 */
export function calculateNetBorrowingAPY(
  collaterals: TokenAmount[],
  debts: TokenAmount[],
  marketMap: Map<string, Market>
): number {
  let totalLendingReward = 0;
  const totalLendingInterest = collaterals.reduce((acc, curr) => {
    const market = marketMap.get(curr.token.address.toLowerCase());
    totalLendingReward +=
      curr.amountInUSD * market!.trailing30DaysLendingRewardAPY;
    return acc + curr.amountInUSD * market!.trailing30DaysLendingAPY;
  }, 0);
  // console.log("Total lending interest: ", totalLendingInterest);
  let totalBorrowingReward = 0;
  const totalBorrowingInterest = debts.reduce((acc, curr) => {
    const market = marketMap.get(curr.token.address.toLowerCase());
    totalBorrowingReward +=
      curr.amountInUSD * market!.trailing30DaysBorrowingRewardAPY;
    return acc + curr.amountInUSD * market!.trailing30DaysBorrowingAPY;
  }, 0);
  // console.log("Total borrowing interest: ", totalBorrowingInterest);
  const totalDebtAmountInUSD = debts.reduce(
    (acc, curr) => acc + curr.amountInUSD,
    0
  );
  // console.log("Total debt amount in USD: ", totalDebtAmountInUSD);
  const netBorrowingAPY =
    (totalLendingInterest +
      totalLendingReward +
      totalBorrowingReward -
      totalBorrowingInterest) /
    totalDebtAmountInUSD;
  return netBorrowingAPY;
}

export function calculateWeightedAvgLendingAPY(
  collaterals: TokenAmount[],
  marketMap: Map<string, Market>
): number {
  // calculate total interest earned by user's collaterals
  const totalLendingInterest = collaterals.reduce((acc, curr) => {
    const market = marketMap.get(curr.token.address.toLowerCase());
    return acc + curr.amountInUSD * market!.trailing30DaysLendingAPY;
  }, 0);

  // total collateral amount in USD
  const totalCollateralAmountInUSD = collaterals.reduce(
    (acc, curr) => acc + curr.amountInUSD,
    0
  );

  const weightedAvgLendingAPY =
    totalLendingInterest / totalCollateralAmountInUSD;
  return weightedAvgLendingAPY;
}

export function calculateWeightedAvgLendingRewardAPY(
  collaterals: TokenAmount[],
  marketMap: Map<string, Market>
): number {
  // calculate total reward earned by user's collaterals
  const totalLendingReward = collaterals.reduce((acc, curr) => {
    const market = marketMap.get(curr.token.address.toLowerCase());
    return acc + curr.amountInUSD * market!.trailing30DaysLendingRewardAPY;
  }, 0);

  // total collateral amount in USD
  const totalCollateralAmountInUSD = collaterals.reduce(
    (acc, curr) => acc + curr.amountInUSD,
    0
  );

  const weightedAvgLendingRewardAPY =
    totalLendingReward / totalCollateralAmountInUSD;
  return weightedAvgLendingRewardAPY;
}
