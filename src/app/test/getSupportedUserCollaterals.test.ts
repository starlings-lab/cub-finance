import { getSupportedUserCollaterals } from "../user/[address]/getSupportedUserCollaterals";
import { TEST_ARB_ADDRESSES, TEST_DEBT_POSITION_ADDRESSES } from "../constants";
import { Address } from "abitype";
import { Chain, TokenAmount } from "../type/type";

describe("getSupportedUserCollaterals - ETH Mainnet", () => {
  it("should return supported user collaterals", async () => {
    const supportedCollaterals = await getSupportedUserCollaterals(
      Chain.EthMainNet,
      TEST_DEBT_POSITION_ADDRESSES.aaveUser1
    );

    // console.log("supportedCollateralTokens", supportedCollateralTokens);

    verifySupportedCollateralTokens(supportedCollaterals);
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
          Chain.EthMainNet,
          userAddresses[i] as Address
        );
        expect(supportedCollaterals).toBeDefined();
      }
    },
    20 * 1000 // 20 seconds
  );
});

describe("getSupportedUserCollaterals - ARB Mainnet", () => {
  it("should return supported user collaterals", async () => {
    const supportedCollaterals = await getSupportedUserCollaterals(
      Chain.ArbMainNet,
      TEST_ARB_ADDRESSES.ETH_HOLDER
    );

    // console.log("supportedCollateralTokens", supportedCollaterals);

    verifySupportedCollateralTokens(supportedCollaterals);
  });

  it(
    "should work for all test user addresses",
    async () => {
      const userAddresses = [
        TEST_ARB_ADDRESSES.ETH_HOLDER,
        TEST_ARB_ADDRESSES.USDC_HOLDER
      ];

      for (let i = 0; i < userAddresses.length; i++) {
        const supportedCollaterals = await getSupportedUserCollaterals(
          Chain.ArbMainNet,
          userAddresses[i] as Address
        );
        expect(supportedCollaterals).toBeDefined();
      }
    },
    20 * 1000 // 20 seconds
  );
});

function verifySupportedCollateralTokens(supportedCollaterals: TokenAmount[]) {
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
  });
}
