import { Address } from "abitype";
import { ALCHEMY_API_URL } from "../constants";
import { Token, TokenAmount } from "../type/type";
import { ethers } from "ethers";

/**
 * Provides a list of tokens with non-zero balance owned by an address
 * @param address an address of account
 * @returns
 */
export async function getTokenHoldings(
  address: Address
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
  // console.dir(tokenBalances, { depth: null });

  const tokenAmounts = [];

  // get ETH balance
  const ethBalance = await getEthBalance(address);
  tokenAmounts.push(ethBalance);

  // Loop through all tokens with non-zero balance
  for (let tokenData of tokenBalances) {
    // Get balance of token
    let balance = BigInt(tokenData.tokenBalance!);

    if (!balance || balance === BigInt(0)) {
      continue;
    }

    // Get metadata of token
    const token = await getTokenMetadata(tokenData.contractAddress);
    // console.log(metadata);

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

export async function getEthBalance(address: string): Promise<TokenAmount> {
  const options = {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: [address, "latest"]
    })
  };

  return fetch(ALCHEMY_API_URL, options).then((response: any) =>
    response.json().then((response: any) => {
      // console.dir(response, { depth: null });

      let balance = BigInt(response.result);

      return {
        token: {
          address: ethers.ZeroAddress,
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18
        },
        amount: BigInt(response.result),
        amountInUSD: 0
      };
    })
  );
}
