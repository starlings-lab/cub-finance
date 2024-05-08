import { SUPPORTED_DEBT_STABLECOINS } from "../contracts/ERC20Tokens";
import { getAllSupportedDebtTokens } from "../user/[address]/getAllSupportedDebtTokens";

describe("getAllSupportedDebtTokens", () => {
  it("should return an array of unique debt tokens", async () => {
    const tokenDetails = await getAllSupportedDebtTokens();
    // console.log("Supported debt tokens: ", tokens);

    // Ensure token addresses are unique
    const uniqueAddresses = tokenDetails.map(
      (tokenDetail) => tokenDetail.token.address
    );
    const setOfAddresses = new Set(uniqueAddresses);
    expect(setOfAddresses.size).toBe(uniqueAddresses.length);

    // Ensure token symbols are unique
    const uniqueSymbols = tokenDetails.map(
      (tokenDetail) => tokenDetail.token.symbol
    );
    const setOfSymbols = new Set(uniqueSymbols);
    expect(setOfSymbols.size).toBe(uniqueSymbols.length);

    // Ensure stable coins have stable property set to true
    tokenDetails.forEach((tokenDetail) => {
      const isStableCoin = SUPPORTED_DEBT_STABLECOINS.some(
        (stableCoin) =>
          tokenDetail.token.address.toLowerCase() ===
          stableCoin.address.toLowerCase()
      );

      expect(tokenDetail.stable).toEqual(isStableCoin);
    });
  });
});
