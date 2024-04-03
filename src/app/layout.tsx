import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./navbar";
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
    <div className={inter.className}>
      <Navbar />
      {children}
    </div>
  );
}
