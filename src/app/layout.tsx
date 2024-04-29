import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import favicon from "/public/favicon.ico";
import Head from "next/head";

import "./globals.css";
import Navbar from "./navbar";
import { Analytics } from "@vercel/analytics/react";

import dotenv from "dotenv";
dotenv.config();

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Refinance",
  description: "Refinance your DeFi loans with ease."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href={favicon.src} />
      </Head>
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>
          <Navbar />
        </Suspense>
        <main className="flex min-h-screen max-w-screen-xl mx-auto flex-col p-4 sm:p-12 pt-16">
          {children}
        </main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
