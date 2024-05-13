import { isAddress } from "ethers";
import { isValidEnsAddress, EOAFromENS } from "../../../service/ensService";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchBar } from "@/components/ui/search-bar";
import { Tabs, TabsWrapper } from "@/components/ui/tabs";
import { Suspense } from "react";
import StoreProvider from "./provider";
import Loading from "./loadingTable";
import DebtTableWrapper from "./DebtTableWrapper";
import BorrowOptionsWrapper from "./BorrowOptionsWrapper";
import { ROUTE_BORROW } from "@/app/constants";

// increased max duration to 60 seconds
// see: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 60;

export default async function DebtPage({
  params
}: {
  params: { address: string; type: string };
}) {
  const isValidEns = await isValidEnsAddress(params.address);
  const isValidAddress = isAddress(params.address) || isValidEns;
  if (!isValidAddress)
    return (
      <div className="flex items-center flex-col h-full pt-20">
        <div className="text-center">
          Invalid address. Please enter a valid address.
        </div>
        <Button className={`bg-[#F43F5E] text-white rounded-2xl w-36 mt-4`}>
          <Link href={`/`}>Back to Home</Link>
        </Button>
      </div>
    );

  const userAddress = isValidEns
    ? (await EOAFromENS(params.address)) || params.address
    : params.address;

  const selectedValue =
    params?.type === ROUTE_BORROW ? Tabs.Borrow : Tabs.Refinance;

  return (
    <StoreProvider>
      <div className="mt-24 mb-32 sm:mt-28">
        <SearchBar
          isHome={false}
          routeType={params.type as string}
          defaultUserAddress={(params!.address as string) ?? ""}
        />
        <TabsWrapper selected={selectedValue} userAddress={params.address} />
        {params?.type === ROUTE_BORROW ? (
          <div className="pt-2 sm:pt-5">
            <Suspense fallback={<Loading />}>
              <BorrowOptionsWrapper userAddress={userAddress} />
            </Suspense>
          </div>
        ) : (
          <div className="pt-2 sm:pt-5">
            <Suspense fallback={<Loading />}>
              <DebtTableWrapper userAddress={userAddress} />
            </Suspense>
          </div>
        )}
      </div>
    </StoreProvider>
  );
}
