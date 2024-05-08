import { isAddress } from "ethers";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchBar } from "@/components/ui/search-bar";
import { Tabs, TabsWrapper } from "@/components/ui/tabs";
import { Suspense } from "react";
import { EOAFromENS, isValidEnsAddress } from "@/app/utils/utils";
import StoreProvider from "./provider";
import Loading from "./loadingTable";
import DebtTableWrapper from "./DebtTableWrapper";
import BorrowOptionsWrapper from "./BorrowOptionsWrapper";

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
          Looks like you entered a wrong address. Try by entering a valid
          address.
        </div>
        <Button className={`bg-[#F43F5E] text-white rounded-3xl w-36 mt-4`}>
          <Link href={`/`}>Back to Home</Link>
        </Button>
      </div>
    );

  const userAddress = isValidEns
    ? (await EOAFromENS(params.address)) || params.address
    : params.address;

  const selectedValue =
    params?.type === "borrow" ? Tabs.Borrow : Tabs.Refinance;

  return (
    <StoreProvider>
      <div className="mt-24 mb-32 sm:mt-28">
        <SearchBar
          isHome={false}
          defaultUserAddress={(params!.address as string) ?? ""}
        />
        <TabsWrapper selected={selectedValue} userAddress={userAddress} />
        {params?.type === "borrow" ? (
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
