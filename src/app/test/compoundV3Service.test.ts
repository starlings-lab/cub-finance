import { TEST_DEBT_POSITION_ADDRESSES } from "../constants";
import {
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_CUSDC_CONTRACT,
  COMPOUND_V3_CWETH_CONTRACT,
  COMPOUND_V3_CUSDC_COLLATERALS,
  COMPOUND_V3_CWETH_COLLATERALS
} from "../contracts/compoundV3";
import { USDC, WETH } from "../contracts/ERC20Tokens";
import {
  getCompoundV3UserDebtDetails,
  getUtilizationRatio,
  getCollateralsByUserAddress,
  getBorrowBalance,
  getSupportedCollateral,
  getCollateralBalance,
  getRecommendedDebtDetail
} from "../service/compoundV3Service";
import { getMorphoBlueUserDebtDetails } from "../service/morphoBlueService";
import { Protocol } from "../type/type";

const MORPHO_DEBT_POSITION_ADDRESS =
  "0xf603265f91f58F1EfA4fAd57694Fb3B77b25fC18";

describe("CompoundV3 Service Tests", () => {
  test("getCompoundV3UserDebtDetails function should return CompoundV3UserDebtDetails object for a user address", async () => {
    const userDebtDetails = await getCompoundV3UserDebtDetails(
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );

    expect(userDebtDetails).toHaveProperty("markets");
    expect(Array.isArray(userDebtDetails.markets)).toBe(true);
    expect(userDebtDetails).toHaveProperty("debtPositions");
    expect(Array.isArray(userDebtDetails.debtPositions)).toBe(true);
    console.log("userDebtDetails", userDebtDetails);
  });

  test("getUtilizationRatio function should return the utilization ratio for a given debt token address", async () => {
    const cusdcUtilizationRatio = await getUtilizationRatio(USDC.address);
    const cwethUtilizationRatio = await getUtilizationRatio(WETH.address);

    expect(typeof cusdcUtilizationRatio).toBe("number");
    expect(typeof cwethUtilizationRatio).toBe("number");
  });

  test("getCollateralsByUserAddress function should return an array of TokenAmount for for CUSDC contract", async () => {
    const collaterals = await getCollateralsByUserAddress(
      COMPOUND_V3_CUSDC_CONTRACT,
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );

    expect(Array.isArray(collaterals)).toBe(true);
    collaterals.forEach((collateral) => {
      expect(collateral).toHaveProperty("token");
      expect(collateral).toHaveProperty("amount");
      expect(collateral).toHaveProperty("amountInUSD");
    });
  });

  test("getCollateralsByUserAddress function should return an array of TokenAmount for CWETH contract", async () => {
    const collaterals = await getCollateralsByUserAddress(
      COMPOUND_V3_CWETH_CONTRACT,
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );
    expect(Array.isArray(collaterals)).toBe(true);
    collaterals.forEach((collateral) => {
      expect(collateral).toHaveProperty("token");
      expect(collateral).toHaveProperty("amount");
      expect(collateral).toHaveProperty("amountInUSD");
    });
  });

  test("getBorrowBalance function should return a bigint value for CUSDC contract", async () => {
    const borrowBalanceCUSDC = await getBorrowBalance(
      COMPOUND_V3_CUSDC_CONTRACT,
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );
    expect(typeof borrowBalanceCUSDC).toBe("bigint");
  });

  test("getBorrowBalance function should return a bigint value for CWETH contract", async () => {
    const borrowBalanceCWETH = await getBorrowBalance(
      COMPOUND_V3_CWETH_CONTRACT,
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );
    expect(typeof borrowBalanceCWETH).toBe("bigint");
  });

  test("getSupportedCollateral function should return an array of Token for CUSDC and CWETH", () => {
    const supportedCollateralsCUSDC = getSupportedCollateral(
      COMPOUND_V3_CUSDC_ADDRESS
    );
    expect(Array.isArray(supportedCollateralsCUSDC)).toBe(true);
    supportedCollateralsCUSDC.forEach((collateral) => {
      expect(collateral).toHaveProperty("address");
      expect(collateral).toHaveProperty("symbol");
      expect(collateral).toHaveProperty("decimals");
      expect(collateral).toHaveProperty("name");
    });

    const supportedCollateralsCWETH = getSupportedCollateral(
      COMPOUND_V3_CWETH_ADDRESS
    );
    expect(Array.isArray(supportedCollateralsCWETH)).toBe(true);
    supportedCollateralsCWETH.forEach((collateral) => {
      expect(collateral).toHaveProperty("address");
      expect(collateral).toHaveProperty("symbol");
      expect(collateral).toHaveProperty("decimals");
      expect(collateral).toHaveProperty("name");
    });
  });

  test("getCollateralBalance function should return a bigint value for CUSDC contract", async () => {
    const collateralBalancesCUSDC = [];
    for (const collateral of COMPOUND_V3_CUSDC_COLLATERALS) {
      const collateralBalance = await getCollateralBalance(
        COMPOUND_V3_CUSDC_CONTRACT,
        TEST_DEBT_POSITION_ADDRESSES.compoundUser2,
        collateral.address
      );
      collateralBalancesCUSDC.push(collateralBalance);
      expect(typeof collateralBalance).toBe("bigint");
    }
    expect(
      collateralBalancesCUSDC.every((balance) => typeof balance === "bigint")
    ).toBe(true);
  });

  test("getCollateralBalance function should return a bigint value for CWETH contract", async () => {
    const collateralBalancesCWETH = [];
    for (const collateral of COMPOUND_V3_CWETH_COLLATERALS) {
      const collateralBalance = await getCollateralBalance(
        COMPOUND_V3_CWETH_CONTRACT,
        TEST_DEBT_POSITION_ADDRESSES.compoundUser2,
        collateral.address
      );
      collateralBalancesCWETH.push(collateralBalance);
      expect(typeof collateralBalance).toBe("bigint");
    }
    expect(
      collateralBalancesCWETH.every((balance) => typeof balance === "bigint")
    ).toBe(true);
  });

  test("getRecommendedDebtDetail function should return an array of CompoundV3RecommendedDebtDetail", async () => {
    const morphoBlueUserDebtDetails = await getMorphoBlueUserDebtDetails(
      1,
      MORPHO_DEBT_POSITION_ADDRESS
    );
    // console.log("morphoBlueUserDebtDetails", morphoBlueUserDebtDetails);
    const recommendedDebtDetails = await Promise.all(
      morphoBlueUserDebtDetails.debtPositions.map(async (debtPosition) => {
        return await getRecommendedDebtDetail(
          Protocol.MorphoBlue,
          debtPosition
        );
      })
    );
    recommendedDebtDetails.forEach((recommendedDebtDetails) => {
      expect(
        Array.isArray(recommendedDebtDetails) || recommendedDebtDetails === null
      ).toBe(true);
      recommendedDebtDetails?.forEach((recommendedDebtDetail) => {
        expect(recommendedDebtDetail).toHaveProperty(
          "protocol",
          Protocol.CompoundV3
        );
        expect(recommendedDebtDetail).toHaveProperty(
          "trailing30DaysNetBorrowingAPY",
          expect.any(Number)
        );
        expect(recommendedDebtDetail).toHaveProperty("debt");
        expect(recommendedDebtDetail).toHaveProperty("market");
      });
    });
    console.log("recommendedDebtDetails", recommendedDebtDetails);
  });
});
