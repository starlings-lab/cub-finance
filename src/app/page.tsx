"use client";
import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { getCompoundV3UserDebtDetails } from "./service/compoundV3Service";
import { getRecommendations } from "./service/refiananceRecommendationService";
import { Protocol } from "./type/type";

// eslint-disable-next-line @next/next/no-async-client-component
export default async function Home() {
  // TODO: remove test users
  const aaveUser = "0x00171ab2f44c1c9b21c7696eb1a5c601f05a9167";
  const aaveUser2 = "0xa61D72BD43087d5102EC7AdFBBf9DE7189b1A6b1"
  const aaveUser3 = "0x4F03745D7963462CDbb0050F02f99025FeD52976"
  const aaveUser4 = "0xbF47E471eEe2C58782Abd0B66cb7be865c809A95"
  const aaveUser5 = "0x901bd9EF18da00b43985B608ee831a79c4070C30"
  const compoundUser1 = "0xfe99cc4664a939f826dbeb545c1aad4c89ee737a";
  const compoundUser2 = "0x9CF423E929d661a0fB25e4AEf05bEB1037298fFb";
  const morphoUser = "0xf603265f91f58F1EfA4fAd57694Fb3B77b25fC18";

  // const compoundV3UserDebtDetails = await getCompoundV3UserDebtDetails(
  //   compoundUser2
  // );

  // const allRecommendations = await getRecommendations(
  //   Protocol.CompoundV3,
  //   compoundV3UserDebtDetails.debtPositions[0]
  // );
  // console.log("All Recommendations: ");
  // console.dir(allRecommendations, { depth: null });

  return (
    <div className="flex min-h-screen pt-20 flex-col items-center">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>
            <div className="font-mono text-6xl m-10">
              Refinancing, Simplified
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="home-desc text-lg font-sans text-center -mt-8 tracking-wide">
            ReFi analyzes your existing debt positions and find better terms for
            you.
          </CardDescription>
          <SearchBar
            className="mt-16"
            isHome={true}
            defaultUserAddress={aaveUser4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
