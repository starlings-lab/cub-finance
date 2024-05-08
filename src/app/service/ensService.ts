"use server";

import { isAddress } from "ethers";
import { normalize } from "viem/ens";
import { getEnsAddress } from "@wagmi/core";
import { wagmiConfig } from "../../../src/wagmiConfig";

export async function isValidEnsAddress(ensAddress: string): Promise<boolean> {
  let result;
  try {
    result = await getEnsAddress(wagmiConfig, {
      name: normalize(ensAddress)
    });
  } catch (error) {
    console.error(`Error fetching ENS address: ${error}`);
    return false;
  }
  return isAddress(result);
}

export async function EOAFromENS(address: string): Promise<string | null> {
  const eoaAddress = await getEnsAddress(wagmiConfig, {
    name: normalize(address)
  });
  return eoaAddress;
}
