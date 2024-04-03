"use client";
import React, { useState } from "react";
import { getTokensOwnedByAddress } from "./service/tokenService";

export default function Home() {
  const [value, setValue] = useState<string>("");
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  // Test code
  const account = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
  let tokens: any[] = [];
  // tokens = await getTokensOwnedByAddress(account);

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

      <p className="text-2xl font-bold mb-5 ">
        Tokens owned by address {account}
      </p>
      <div>
        {tokens.map((token: any) => (
          <div key={token.name} className="flex items-center justify-between">
            <div>{token.name}</div>
            <div>{token.balance}</div>
            <div>{token.symbol}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
