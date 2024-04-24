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
import { TEST_DEBT_POSITION_ADDRESSES } from "@/app/constants";

// eslint-disable-next-line @next/next/no-async-client-component
export default async function Home() {
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
            defaultUserAddress={TEST_DEBT_POSITION_ADDRESSES.compoundUser2}
          />
        </CardContent>
      </Card>
    </div>
  );
}
