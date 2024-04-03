import { to } from "mathjs";

const alchemyUrl = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY_ETH_MAINNET}`;

/**
 * Provides a list of tokens with non-zero balance owned by an address
 * @param address an address of account
 * @returns
 */
export async function getTokensOwnedByAddress(address: string): Promise<any> {
  const options = {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenBalances",
      params: [address],
    }),
  };

  const responseJson = await fetch(alchemyUrl, options);
  const response = await responseJson.json();
  const tokenBalances = response.result.tokenBalances;
  // console.log(tokenBalances);

  // Remove tokens with zero balance
  const nonZeroBalances = tokenBalances.filter((token: any) => {
    return token.tokenBalance !== "0";
  });

  const tokens = [];
  // Counter
  let i = 1;

  // Loop through all tokens with non-zero balance
  for (let token of nonZeroBalances) {
    // Get balance of token
    let balance = parseInt(token.tokenBalance!);

    // Get metadata of token
    const metadata = await getTokenMetadata(token.contractAddress);
    // console.log(metadata);

    balance = balance / Math.pow(10, metadata.decimals!);

    // Print name, balance, and symbol of token
    console.log(
      `${i++}. ${metadata.name}: ${balance.toFixed(2)} ${metadata.symbol}`
    );

    tokens.push({
      name: metadata.name,
      balance: balance.toFixed(2),
      symbol: metadata.symbol,
    });
  }

  return tokens;
}

export async function getTokenMetadata(contractAddress: string) {
  const options = {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenMetadata",
      params: [contractAddress],
    }),
  };

  return await fetch(alchemyUrl, options)
    .then((response: any) => response.json())
    .then((response: any) => response.result);
}
