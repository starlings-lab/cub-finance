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
  // TODO: remove test users
  const aaveUser = "0x00171ab2f44c1c9b21c7696eb1a5c601f05a9167";
  const compoundUser1 = "0xfe99cc4664a939f826dbeb545c1aad4c89ee737a";
  const compoundUser2 = "0x9CF423E929d661a0fB25e4AEf05bEB1037298fFb";

  const [value, setValue] = useState<string>(aaveUser);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  // const allRecommendations = await getRecommendations(
  //   Protocol.CompoundV3,
  //   compoundV3UserDebtDetails.debtPositions[0]
  // );
  // console.log("All Recommendations: ");
  // console.dir(allRecommendations, { depth: null });

  return (
    <div className="flex min-h-screen flex-col items-center">
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
            <Input
              className=""
              type="text"
              value={value}
              onChange={handleChange}
            ></Input>
            <Button className="bg-[#F43F5E] text-white">
              <Link href={`/user/${value}`}>Find Now</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
