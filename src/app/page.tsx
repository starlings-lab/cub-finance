/* eslint-disable @next/next/no-async-client-component */
"use client";
import React, { useState } from "react";
import { getMorphoBlueUserDebtDetails } from "./service/morphoBlueService";

export default async function Home() {
  const [value, setValue] = useState<string>(
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
  );
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  // test getDebtPositionTableRows from morpho blue service
  const debtPositionTableRows = await getMorphoBlueUserDebtDetails(
    1,
    "0xf603265f91f58F1EfA4fAd57694Fb3B77b25fC18"
  );
  console.dir(debtPositionTableRows, { depth: null });

  // AaveV3 test
  // getUserDebtDetails("0x00171ab2f44c1c9b21c7696eb1a5c601f05a9167")
  //   .then((debtDetails) => {
  //     console.dir(debtDetails, { depth: null });
  //   })
  //   .catch((error) => {
  //     console.error(error);
  //   });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-lg mb-5">
        Refinancing, Simplified
      </div>

      <p>
        ReFi analyzes your existing debt positions and find better terms for
        you.
      </p>
      <input type="text" value={value} onChange={handleChange} />
    </main>
  );
}
