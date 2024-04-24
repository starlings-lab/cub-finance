import { ethers } from "ethers";
import { Suspense } from "react";
import Loading from "./loading";
import DebtTableWrapper from "./DebtTableWrapper";
import RecommendationsWrapper from "./RecommendationsWrapper";
import StoreProvider from "./provider";

export default async function DebtPage({
  params
}: {
  params: { address: string };
}) {
  const userAddress = ethers.getAddress(params.address);
  // const [activeRow, setActiveRow] = useState<string>('');
  // console.log(activeRow);
  return (
    <StoreProvider>
      <div>
        <div className="w-full p-3 py-4 flex flex-col sm:flex-row justify-between border rounded-md text-slate-500 font-medium tracking-wide text-xs sm:text-base">
          Wallet Address{" "}
          <div className="right font-bold text-black mt-2 sm:mt-0">{params.address}</div>
        </div>
        <div className="pt-5">
          <div className="mt-5 text-3xl sm:text-4xl font-medium tracking-wide">
            Debt Positions
          </div>
          <div className="mt-1 sm:mt-2 text-sm text-gray-500">
            Select a debt position to check refinancing options
          </div>
          <Suspense fallback={<Loading />}>
            <DebtTableWrapper userAddress={userAddress} />
          </Suspense>
        </div>
        <div className="pt-2 sm:pt-5">
          <Suspense fallback={<Loading />}>
            <RecommendationsWrapper />
          </Suspense>
        </div>
        <div></div>
      </div>
    </StoreProvider>
  );
}
