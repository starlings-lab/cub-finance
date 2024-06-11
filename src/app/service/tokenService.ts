import { Address } from "abitype";
import { getAlchemyApiUrl } from "../constants";
import { Chain, Token, TokenAmount } from "../type/type";
import { ethers } from "ethers";
import { getTokenPrice } from "./defiLlamaDataService";
import { ETH, getSupportedCollateralTokenMap } from "../contracts/ERC20Tokens";

/**
 * Provides a list of tokens with non-zero balance owned by an address
 * that are supported as collaterals in the supported protocols
 *
 * @param chain a chain of the account
 * @param address an address of account
 * @returns
 */
export async function getSupportedTokenHoldings(
  chain: Chain,
  address: Address
): Promise<TokenAmount[]> {
  const tokenBalances = await getTokenHoldings(chain, address);
  // console.dir(tokenBalances, { depth: null });

  const tokenAmounts = [];

  // Get token prices only for supported tokens
  const supportedTokenMap = getSupportedCollateralTokenMap(chain);

  const tokenAddresses = tokenBalances
    .map((tokenData: any) => tokenData.contractAddress)
    .filter((address: Address) => supportedTokenMap.has(address));

  // Add ETH address to get ETH price
  tokenAddresses.push(ethers.ZeroAddress);

  const tokenPriceMap: Map<Address, number> = await getTokenPrice(
    chain,
    tokenAddresses
  );

  // get ETH balance
  const ethBalance = await getEthBalance(chain, address);

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
      !supportedTokenMap.has(tokenData.contractAddress.toLowerCase())
    ) {
      continue;
    }

    // Get metadata of token
    const token = supportedTokenMap.get(tokenData.contractAddress)!;
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
  chain: Chain,
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

  return fetch(getAlchemyApiUrl(chain), options)
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

export async function getEthBalance(
  chain: Chain,
  address: string
): Promise<TokenAmount> {
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

  const apiUrl = getAlchemyApiUrl(chain);
  return fetch(apiUrl, options).then((response: any) =>
    response.json().then((response: any) => {
      // console.dir(response, { depth: null });

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
async function getTokenHoldings(chain: Chain, address: Address): Promise<any> {
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

  const apiUrl = getAlchemyApiUrl(chain);

  return fetch(apiUrl, options)
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
