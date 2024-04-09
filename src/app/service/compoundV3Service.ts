import { AlchemyProvider, Contract } from "ethers";
import {
  COMPOUND_V3_CUSDC_ADDRESS,
  COMPOUND_V3_CWETH_ADDRESS,
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
