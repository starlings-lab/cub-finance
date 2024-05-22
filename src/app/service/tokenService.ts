import { Address } from "abitype";
import { ALCHEMY_API_URL } from "../constants";
import { Token, TokenAmount } from "../type/type";
import { ethers } from "ethers";
import { getTokenPrice } from "./defiLlamaDataService";
import { ETH, SUPPORTED_COLLATERAL_TOKENS_MAP } from "../contracts/ERC20Tokens";

/**
 * Provides a list of tokens with non-zero balance owned by an address
 * that are supported as collaterals in the supported protocols
 * @param address an address of account
 * @returns
 */
export async function getSupportedTokenHoldings(
  address: Address
): Promise<TokenAmount[]> {
  const tokenBalances = await getTokenHoldings(address);
  // console.dir(tokenBalances, { depth: null });

  const tokenAmounts = [];

  // Get token prices only for supported tokens
  const tokenAddresses = tokenBalances
    .map((tokenData: any) => tokenData.contractAddress)
    .filter((address: Address) => SUPPORTED_COLLATERAL_TOKENS_MAP.has(address));

  // Add ETH address to get ETH price
  tokenAddresses.push(ethers.ZeroAddress);

  const tokenPriceMap: Map<Address, number> = await getTokenPrice(
    tokenAddresses
  );

  // get ETH balance
  const ethBalance = await getEthBalance(address);

  if (ethBalance.amount > BigInt(0)) {
    ethBalance.amountInUSD = calculateAmountInUSD(
      ethBalance.amount,
      ETH,
      tokenPriceMap
    );
    tokenAmounts.push(ethBalance);
    // console.log("ethBalance", ethBalance);
  }

  // Loop through all tokens with non-zero balance
  for (let tokenData of tokenBalances) {
    // Get balance of token
    let balance = BigInt(tokenData.tokenBalance!);

    if (
      !balance ||
      balance === BigInt(0) ||
      !SUPPORTED_COLLATERAL_TOKENS_MAP.has(
        tokenData.contractAddress.toLowerCase()
      )
    ) {
      continue;
    }

    // Get metadata of token
    const token = SUPPORTED_COLLATERAL_TOKENS_MAP.get(
      tokenData.contractAddress
    )!;
    // console.log(metadata);

    // calculate amount in USD
    const amountInUSD = calculateAmountInUSD(balance, token, tokenPriceMap);

    tokenAmounts.push({
      token: token,
      amount: balance,
      amountInUSD: amountInUSD
    });
  }

  // console.log("tokenAmounts", tokenAmounts);
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
        token: ETH,
        amount: BigInt(response.result),
        amountInUSD: 0
      };
    })
  );
}

/**
 * Provides a list of all tokens owned by an address
 * @param address an address of account
 * @returns
 */
async function getTokenHoldings(address: Address): Promise<any> {
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

  return fetch(ALCHEMY_API_URL, options)
    .then((response: any) => response.json())
    .then((response: any) => {
      return response.result.tokenBalances;
    });
}

function calculateAmountInUSD(
  balance: bigint,
  token: Token,
  tokenPriceMap: Map<Address, number>
) {
  return (
    Number(ethers.formatUnits(balance, token.decimals)) *
    tokenPriceMap.get(token.address.toLowerCase() as Address)!
  );
}
