"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { getCompoundV3UserDebtDetails } from "./service/compoundV3Service";
import { getRecommendedDebtDetail } from "./service/aaveV3Service";
import { Protocol } from "./type/type";
import { getRecommendations } from "./service/refiananceRecommendationService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  const [value, setValue] = useState<string>(
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
  );
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  // AaveV3 test
  // getUserDebtDetails("0x00171ab2f44c1c9b21c7696eb1a5c601f05a9167")
  //   .then((debtDetails) => {
  //     console.dir(debtDetails, { depth: null });
  //   })
  //   .catch((error) => {
  //     console.error(error);
  //   });

  // test getCompoundV3UserDebtDetails
  // const compoundV3UserDebtDetails = await getCompoundV3UserDebtDetails(
  //   // "0xfe99cc4664a939f826dbeb545c1aad4c89ee737a"
  //   "0x9CF423E929d661a0fB25e4AEf05bEB1037298fFb"
  // );
  // console.dir(compoundV3UserDebtDetails, { depth: null });

  // const allRecommendations = await getRecommendations(
  //   Protocol.CompoundV3,
  //   compoundV3UserDebtDetails.debtPositions[0]
  // );
  // console.log("All Recommendations: ");
  // console.dir(allRecommendations, { depth: null });

  return (
    <main className="flex min-h-screen flex-col items-center">
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle>
            <div className="font-mono text-xlg m-10">
              Refinancing, Simplified
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="home-desc">
            ReFi analyzes your existing debt positions and find better terms for
            you.
          </CardDescription>
          <div className="flex w-full max-w-sm items-center space-x-2 mt-5">
            <Input type="text" value={value} onChange={handleChange}></Input>
            <Button className="bg-[#F43F5E] text-white">
              <Link href={`/debt?address=${value}`}>Find Now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
