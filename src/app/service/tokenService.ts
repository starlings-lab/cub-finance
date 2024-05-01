import { Address } from "abitype";
import { ALCHEMY_API_URL } from "../constants";
import { Token, TokenAmount } from "../type/type";

/**
 * Provides a list of tokens with non-zero balance owned by an address
 * @param address an address of account
 * @returns
 */
export async function getTokensOwnedByAddress(
  address: string
): Promise<TokenAmount[]> {
  const options = {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenBalances",
      params: [address]
    })
  };

  const responseJson = await fetch(ALCHEMY_API_URL, options);
  const response = await responseJson.json();
  const tokenBalances = response.result.tokenBalances;
  // console.log(tokenBalances);

  // Remove tokens with zero balance
  const nonZeroBalances = tokenBalances.filter((token: any) => {
    return token.tokenBalance !== "0";
  });

  const tokenAmounts = [];
  // Counter
  let i = 1;

  // Loop through all tokens with non-zero balance
  for (let tokenData of nonZeroBalances) {
    // Get balance of token
    let balance = tokenData.tokenBalance!;
    // Get metadata of token
    const token = await getTokenMetadata(tokenData.contractAddress);
    // console.log(metadata);

    // balance = balance / Math.pow(10, token.decimals!);

    // Print name, balance, and symbol of token
    console.log(`${i++}. ${token.name}: ${balance} ${token.symbol}`);

    tokenAmounts.push({
      token: token,
      amount: balance,
      amountInUSD: 0
    });
  }

  return tokenAmounts;
}

export async function getTokenMetadata(
  contractAddress: Address
): Promise<Token> {
  const options = {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenMetadata",
      params: [contractAddress]
    })
  };

  return fetch(ALCHEMY_API_URL, options)
    .then((response: any) => response.json())
    .then((response: any) => {
      return {
        address: contractAddress,
        name: response.result.name,
        symbol: response.result.symbol,
        decimals: response.result.decimals
      };
    });
}
