import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import favicon from "/public/favicon2.ico";

import "./globals.css";
import Navbar from "./navbar";
import Fathom from "../components/fathom";

import dotenv from "dotenv";
import { hkGrotesk, notoSerif } from "./fonts";
import StoreProvider from "./context/provider";
dotenv.config();

export const metadata: Metadata = {
  title: "Cub Finance",
  description: "Borrowing Simplified.",
  icons: [{ rel: "icon", url: favicon.src }]
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
  // Also supported by less commonly used
  // interactiveWidget: 'resizes-visual',
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <StoreProvider>
        <body
          className={`${notoSerif.className} ${notoSerif.variable} ${hkGrotesk.className} ${hkGrotesk.variable}`}
        >
          <Fathom />
          <Suspense fallback={<div className="font-notoSerif">Loading...</div>}>
            <Navbar />
          </Suspense>
          <main className="bg-hero-pattern bg-white">
            <div className="flex min-h-screen max-w-screen-xl sm:max-w-4/5 mx-auto flex-col px-4">
              {children}
            </div>
          </main>
          <Toaster />
        </body>
      </StoreProvider>
    </html>
  );
}
