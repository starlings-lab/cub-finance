import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { TEST_DEBT_POSITION_ADDRESSES } from "@/app/constants";

// eslint-disable-next-line @next/next/no-async-client-component
export default function Home() {
  return (
    <div className="flex min-h-excludeHeader flex-col items-center justify-center">
      <Card className="border-none shadow-none sm:w-10/12">
        <CardHeader className="p-0 sm:p-6">
          <CardTitle>
            <div className="font-hkGrotesk text-5xl sm:m-2 sm:text-6xl sm:m-10 leading-normal tracking-wider sm:text-center">
                Borrowing Simplified
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 w-full">
          <CardDescription className="home-desc text-lg font-notoSerif sm:text-center sm:mx-auto sm:-mt-8 tracking-wide sm:w-6/12">
            We analyze your token holdings and existing debt positions to find
            the best terms
          </CardDescription>
          <SearchBar
            className="mt-16"
            isHome={true}
            defaultUserAddress={TEST_DEBT_POSITION_ADDRESSES.morphoUser1}
          />
        </CardContent>
      </Card>
    </div>
  );
}
