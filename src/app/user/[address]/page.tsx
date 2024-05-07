import { isAddress } from "ethers";
import StoreProvider from "./provider";
import { isValidEnsAddress, EOAFromENS } from "../../utils/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SearchBar } from "@/components/ui/search-bar";
import { TabsWrapper } from "@/components/ui/tabs";
import DebtTableWrapper from "./DebtTableWrapper";
import { Suspense } from "react";
import Loading from "./loading";

export default async function DebtPage({
  params
}: {
  params: { address: string };
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

  return (
    <StoreProvider>
      <div className="mt-24 mb-32 sm:mt-28">
        <div className="flex items-center justify-center">
          <SearchBar
            isHome={false}
            defaultUserAddress={(params!.address as string) ?? ""}
          />
        </div>
        <TabsWrapper />
        <div className="pt-2 sm:pt-5">
          <Suspense fallback={<Loading />}>
            <DebtTableWrapper userAddress={userAddress} />
          </Suspense>
        </div>
      </div>
    </StoreProvider>
  );
}
