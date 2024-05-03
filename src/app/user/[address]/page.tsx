import { ethers, isAddress } from "ethers";
import { Suspense } from "react";
import Loading from "./loading";
import DebtTableWrapper from "./DebtTableWrapper";
import RecommendationsWrapper from "./RecommendationsWrapper";
import StoreProvider from "./provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchBar } from "@/components/ui/search-bar";

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

  return (
    <StoreProvider>
      <div className="mt-24 mb-32 sm:mt-28">
        <div className="flex items-center justify-center">
          <SearchBar
            isHome={false}
            defaultUserAddress={(params!.address as string) ?? ""}
          />
        </div>
        <div className="sm:pt-5">
          <div className="mt-10 text-3xl sm:text-4xl font-medium tracking-wide font-hkGrotesk">
            Debt Positions
          </div>
          <div className="mt-1 sm:mt-2 text-sm text-gray-500 font-notoSerif">
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
