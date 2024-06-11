import {
  SUPPORTED_DEBT_STABLECOINS_ARB_MAINNET,
  SUPPORTED_DEBT_STABLECOINS_ETH_MAINNET
} from "../contracts/ERC20Tokens";
import { Chain, TokenDetail } from "../type/type";
import { getAllSupportedDebtTokens } from "../user/[address]/getAllSupportedDebtTokens";

describe("getAllSupportedDebtTokens - EthMainNet", () => {
  it("should return an array of unique debt tokens", async () => {
    const tokenDetails = await getAllSupportedDebtTokens(Chain.EthMainNet);
    // console.log("Supported debt tokens: ", tokenDetails);

    // Ensure token addresses are unique
    verifySupportedDebtTokens(tokenDetails, Chain.EthMainNet);
  });
});

describe("getAllSupportedDebtTokens - ArbMainNet", () => {
  it("should return an array of unique debt tokens", async () => {
    const tokenDetails = await getAllSupportedDebtTokens(Chain.ArbMainNet);
    // console.log("Supported debt tokens: ", tokenDetails);

    // Ensure token addresses are unique
    verifySupportedDebtTokens(tokenDetails, Chain.ArbMainNet);
  });
});

function verifySupportedDebtTokens(tokenDetails: TokenDetail[], chain: Chain) {
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
  const supportedDebtStablecoins =
    chain === Chain.EthMainNet
      ? SUPPORTED_DEBT_STABLECOINS_ETH_MAINNET
      : SUPPORTED_DEBT_STABLECOINS_ARB_MAINNET;
  tokenDetails.forEach((tokenDetail) => {
    const isStableCoin = supportedDebtStablecoins.some(
      (stableCoin) =>
        tokenDetail.token.address.toLowerCase() ===
        stableCoin.address.toLowerCase()
    );

    expect(tokenDetail.stable).toEqual(isStableCoin);
  });
}
