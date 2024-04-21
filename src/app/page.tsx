"use client";
import React, { useEffect, useRef, useState } from "react";
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
import Image from "next/image";

export default function Home() {
  // TODO: remove test users
  const aaveUser = "0x00171ab2f44c1c9b21c7696eb1a5c601f05a9167";
  const compoundUser1 = "0xfe99cc4664a939f826dbeb545c1aad4c89ee737a";
  const compoundUser2 = "0x9CF423E929d661a0fB25e4AEf05bEB1037298fFb";

  const [value, setValue] = useState<string>(aaveUser);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "k") {
        // Check for Cmd + K
        event.preventDefault(); // Prevent default behavior (like browser search)
        inputRef.current?.focus(); // Focus on the input box
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Run this effect only once on component mount

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
          <div className="flex w-full items-center justify-center space-x-2">
            <div className="flex w-full max-w-xl space-x-2 mt-16 py-1 pl-3 pr-1 border rounded-3xl">
              <Image
                src={"/search_black.svg"}
                alt="icon"
                width="32"
                height="32"
              />
              <Input
                ref={inputRef}
                className="placeholder:text-slate-400"
                type="text"
                value={value}
                placeholder="Enter your wallet address"
                onChange={handleChange}
              ></Input>
              <Button className="bg-[#F43F5E] text-white rounded-3xl w-36">
                <Link href={`/user/${value}`}>Find Now</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
