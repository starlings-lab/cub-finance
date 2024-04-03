import { getTokensOwnedByAddress } from "./service/tokenService";

export default async function Home() {
  // Test code
  await getTokensOwnedByAddress("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        Welcome To Refinance!!
      </div>
    </main>
  );
}
