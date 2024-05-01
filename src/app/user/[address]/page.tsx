import { ethers, isAddress } from "ethers";
import { Suspense } from "react";
import Loading from "./loading";
import DebtTableWrapper from "./DebtTableWrapper";
import RecommendationsWrapper from "./RecommendationsWrapper";
import StoreProvider from "./provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getTokensOwnedByAddress } from "@/app/service/tokenService";

export default async function DebtPage({
  params
}: {
  params: { address: string };
}) {
  const isValidAddress = isAddress(params.address);
  if (!isValidAddress)
    return (
      <div className="flex items-center flex-col h-full pt-20">
        <div className="text-center">
          Looks like you entered a wrong address. Try by entering a valid
          address.{" "}
        </div>
        <Button className={`bg-[#F43F5E] text-white rounded-3xl w-36 mt-4`}>
          <Link href={`/`}>Back to Home</Link>
        </Button>
      </div>
    );

  const userAddress = ethers.getAddress(params.address);
  // const [activeRow, setActiveRow] = useState<string>('');
  // console.log(activeRow);

  getTokensOwnedByAddress(params.address).then((data: any) => {});

  return (
    <StoreProvider>
      <div>
        <div className="mt-16 w-full p-3 py-4 flex flex-col sm:flex-row justify-between border rounded-md text-slate-500 font-medium tracking-wide text-xs sm:text-base">
          Wallet Address
          <div className="right font-bold text-black mt-2 sm:mt-0">
            {params.address}
          </div>
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
