import type { Address } from "abitype";
import { AlchemyProvider, Contract } from "ethers";
import {
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_CUSDC_COLLATERALS,
  COMPOUND_V3_CWETH_COLLATERALS,
  COMPOUND_V3_CUSDC_ABI,
  COMPOUND_V3_CWETH_ABI
} from "../contracts/compoundV3";

const provider = new AlchemyProvider(
  1,
  process.env.ALCHEMY_API_KEY_ETH_MAINNET
);

let signer;
(async () => {
  signer = await provider.getSigner(0);
})();

const CompoundV3cUSDC = new Contract(
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CUSDC_ABI,
  signer
);

const CompoundV3cWETH = new Contract(
  COMPOUND_V3_CWETH_ADDRESS,
  COMPOUND_V3_CWETH_ABI,
  signer
);

async function getBorrowBalance(
  market: Contract,
  address: Address
): Promise<BigInt> {
  try {
    const borrowBalance = await market.borrowBalanceOf(address);
    return borrowBalance;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// there seems to be no easy way to fetch supported collaterals for each market. So we store them as constant values. Even compound.js keeps constant values.
function getSupportedCollateralAddresses(marketAddress: Address): Address[] {
  try {
    let supportedCollateralAddresses: Address[];
    if (marketAddress === COMPOUND_V3_CUSDC_ADDRESS) {
      supportedCollateralAddresses = COMPOUND_V3_CUSDC_COLLATERALS.map(
        (collateral) => collateral.address
      );
    } else if (marketAddress === COMPOUND_V3_CWETH_ADDRESS) {
      supportedCollateralAddresses = COMPOUND_V3_CWETH_COLLATERALS.map(
        (collateral) => collateral.address
      );
    } else {
      throw new Error("Unsupported market address");
    }
    return supportedCollateralAddresses;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function getCollateralBalance(
  market: Contract,
  userAddress: Address,
  tokenAddress: Address
): Promise<BigInt> {
  try {
    const collateralBalance = await market.collateralBalanceOf(
      userAddress,
      tokenAddress
    );
    return collateralBalance;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

