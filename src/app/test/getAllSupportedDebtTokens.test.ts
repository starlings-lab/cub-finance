import { getAllSupportedDebtTokens } from "../user/[address]/getAllSupportedDebtTokens";

describe("getAllSupportedDebtTokens", () => {
  it("should return an array of unique debt tokens", async () => {
    const tokens = await getAllSupportedDebtTokens();
    // console.log("Supported debt tokens: ", tokens);

    // Ensure token addresses are unique
    const uniqueAddresses = tokens.map((token) => token.address);
    const setOfAddresses = new Set(uniqueAddresses);
    expect(setOfAddresses.size).toBe(uniqueAddresses.length);

    // Ensure token symbols are unique
    const uniqueSymbols = tokens.map((token) => token.symbol);
    const setOfSymbols = new Set(uniqueSymbols);
    expect(setOfSymbols.size).toBe(uniqueSymbols.length);
  });
});
