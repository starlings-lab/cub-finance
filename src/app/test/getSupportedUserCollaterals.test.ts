import { getSupportedUserCollaterals } from "../user/[address]/getSupportedUserCollaterals";
import { TEST_DEBT_POSITION_ADDRESSES } from "../constants";
import { Address } from "abitype";
import { getFormattedTokenAmount } from "../utils/utils";

describe("getSupportedUserCollaterals", () => {
  it("should return supported user collaterals", async () => {
    const supportedCollaterals = await getSupportedUserCollaterals(
      TEST_DEBT_POSITION_ADDRESSES.aaveUser1
    );

    // console.log("supportedCollateralTokens", supportedCollateralTokens);

    expect(supportedCollaterals).toBeDefined();
    expect(supportedCollaterals.length).toBeGreaterThan(0);

    supportedCollaterals.forEach((collateral) => {
      expect(collateral.token).toBeDefined();
      expect(collateral.token.address).toBeDefined();
      expect(collateral.token.name).toBeDefined();
      expect(collateral.token.decimals).toBeDefined();
      expect(collateral.token.symbol).toBeDefined();
      expect(collateral.amountInUSD).toBeDefined();
      expect(collateral.amountInUSD).toBeGreaterThanOrEqual(0);

      console.log(
        "amount",
        getFormattedTokenAmount(collateral.token, collateral.amount)
      );
    });

    // test all keys in TEST_DEBT_POSITION_ADDRESSES
  });

  it(
    "should work for all test user addresses",
    async () => {
      const userAddresses = [
        TEST_DEBT_POSITION_ADDRESSES.aaveUser1,
        TEST_DEBT_POSITION_ADDRESSES.compoundUser1,
        TEST_DEBT_POSITION_ADDRESSES.sparkUser1,
        TEST_DEBT_POSITION_ADDRESSES.morphoUser1
      ];

      for (let i = 0; i < userAddresses.length; i++) {
        const supportedCollaterals = await getSupportedUserCollaterals(
          userAddresses[i] as Address
        );
        expect(supportedCollaterals).toBeDefined();
      }
    },
    10 * 1000 // 10 seconds
  );
});
