"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { trackEvent } from "fathom-client";
import ChainSelect from "./ChainSelect";
import { useContext, useState } from "react";
import ClickAwayListener from "@/components/ui/click-away-listener";
import { Chain } from "./type/type";
import { StoreContext } from "./context/context";

const SupportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1.2rem"
    height="1.2rem"
    viewBox="0 0 24 24"
  >
    <g
      fill="none"
      stroke="white"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      color="white"
    >
      <path d="M17 10.805c0-.346 0-.519.052-.673c.151-.448.55-.621.95-.803c.448-.205.672-.307.895-.325c.252-.02.505.034.721.155c.286.16.486.466.69.714c.943 1.146 1.415 1.719 1.587 2.35c.14.51.14 1.044 0 1.553c-.251.922-1.046 1.694-1.635 2.41c-.301.365-.452.548-.642.655a1.27 1.27 0 0 1-.721.155c-.223-.018-.447-.12-.896-.325c-.4-.182-.798-.355-.949-.803c-.052-.154-.052-.327-.052-.673zm-10 0c0-.436-.012-.827-.364-1.133c-.128-.111-.298-.188-.637-.343c-.449-.204-.673-.307-.896-.325c-.667-.054-1.026.402-1.41.87c-.944 1.145-1.416 1.718-1.589 2.35a2.94 2.94 0 0 0 0 1.553c.252.921 1.048 1.694 1.636 2.409c.371.45.726.861 1.363.81c.223-.018.447-.12.896-.325c.34-.154.509-.232.637-.343c.352-.306.364-.697.364-1.132z" />
      <path d="M5 9c0-3.314 3.134-6 7-6s7 2.686 7 6m0 8v.8c0 1.767-1.79 3.2-4 3.2h-2" />
    </g>
  </svg>
);

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedChain } = useContext(StoreContext);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-8xl px-4 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <Link href="/" passHref>
            <Image src="/cub_logo.png" width={160} height={120} alt="" />
          </Link>
          <div className="flex items-center">
            <ClickAwayListener onClickAway={() => setIsOpen(false)}>
              {selectedChain && (
                <ChainSelect
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  chains={[
                    {
                      name: "Ethereum",
                      value: Chain.EthMainNet
                    },
                    { name: "Arbitrum", value: Chain.ArbMainNet }
                  ]}
                />
              )}
            </ClickAwayListener>
            <Button
              className="bg-[#009DC4] text-white rounded-2xl py-4 px-3 sm:px-6 transition-opacity hover:bg-[#009DC4] hover:opacity-80"
              onClick={() => trackEvent("Talk to Us")}
            >
              <Link
                target="_blank"
                href="https://t.me/+pL8nGAh5P5k4MWZh"
                passHref
              >
                <p className="text-md font-normal font-hkGrotesk hidden sm:flex">
                  Talk to Us
                </p>
                <span className="flex sm:hidden">
                  <SupportIcon />
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
