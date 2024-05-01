import { TEST_DEBT_POSITION_ADDRESSES } from "../constants";
import { getCompoundV3UserDebtDetails } from "../service/compoundV3Service";
import {
  getMorphoBlueUserDebtDetails,
  getMarkets,
  getRecommendedDebtDetail
} from "../service/morphoBlueService";
import { Protocol } from "../type/type";

const MORPHO_DEBT_POSITION_ADDRESS =
  "0xf603265f91f58F1EfA4fAd57694Fb3B77b25fC18";

describe("MorphoBlue Service Tests", () => {
  test("getMorphoBlueUserDebtDetails function should return MorphoBlueUserDebtDetails", async () => {
    const userDebtDetails = await getMorphoBlueUserDebtDetails(
      1,
      MORPHO_DEBT_POSITION_ADDRESS
    );
    expect(userDebtDetails).toHaveProperty("markets");
    expect(Array.isArray(userDebtDetails.markets)).toBe(true);
    expect(userDebtDetails).toHaveProperty("debtPositions");
    expect(Array.isArray(userDebtDetails.debtPositions)).toBe(true);

    console.log("userDebtDetails", userDebtDetails);
  });

  test("getMarkets function should return an array of MorphoBlueMarket", async () => {
    const markets = await getMarkets();
    expect(Array.isArray(markets)).toBe(true);
    markets.forEach((market) => {
      expect(market).toHaveProperty("marketId");
      expect(market).toHaveProperty("debtToken");
      expect(market).toHaveProperty("collateralToken");
      expect(market).toHaveProperty("trailing30DaysBorrowingAPY");
      expect(market).toHaveProperty("utilizationRatio");
      expect(market).toHaveProperty("maxLTV");
    });
  });

  test("getRecommendedDebtDetail function should return an array of MorphoBlueRecommendedDebtDetail", async () => {
    const compoundV3UserDebtDetails = await getCompoundV3UserDebtDetails(
      TEST_DEBT_POSITION_ADDRESSES.compoundUser2
    );
    const recommendedDebtDetails = await getRecommendedDebtDetail(
      Protocol.CompoundV3,
      compoundV3UserDebtDetails.debtPositions[0]
    );
    expect(Array.isArray(recommendedDebtDetails)).toBe(true);
    recommendedDebtDetails?.forEach((recommendedDebtDetail) => {
      expect(recommendedDebtDetail).toHaveProperty(
        "protocol",
        Protocol.MorphoBlue
      );
      expect(recommendedDebtDetail).toHaveProperty(
        "trailing30DaysNetBorrowingAPY",
        expect.any(Number)
      );
      expect(recommendedDebtDetail).toHaveProperty("debt");
      expect(recommendedDebtDetail).toHaveProperty("market");
      expect(recommendedDebtDetail.debt).toHaveProperty(
        "maxLTV",
        expect.any(Number)
      );
      expect(recommendedDebtDetail.debt).toHaveProperty(
        "LTV",
        expect.any(Number)
      );
      expect(recommendedDebtDetail.debt).toHaveProperty(
        "trailing30DaysNetBorrowingAPY",
        expect.any(Number)
      );
      expect(recommendedDebtDetail.debt).toHaveProperty(
        "marketId",
        expect.any(String)
      );
      expect(recommendedDebtDetail.debt).toHaveProperty("debt");
      expect(recommendedDebtDetail.debt).toHaveProperty("collateral");
      expect(recommendedDebtDetail.market).toHaveProperty(
        "marketId",
        expect.any(String)
      );
      expect(recommendedDebtDetail.market).toHaveProperty("debtToken");
      expect(recommendedDebtDetail.market).toHaveProperty("collateralToken");
      expect(recommendedDebtDetail.market).toHaveProperty(
        "trailing30DaysBorrowingAPY",
        expect.any(Number)
      );
      expect(recommendedDebtDetail.market).toHaveProperty(
        "utilizationRatio",
        expect.any(Number)
      );
      expect(recommendedDebtDetail.market).toHaveProperty(
        "maxLTV",
        expect.any(Number)
      );
    });
  });
});
