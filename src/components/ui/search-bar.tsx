"use client";
import * as React from "react";
import Image from "next/image";
import { Input } from "./input";
import { Button } from "./button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { isAddress } from "ethers";

export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isHome: boolean;
  defaultUserAddress: string;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, type, defaultUserAddress, isHome, ...props }, ref) => {
    const router = useRouter();
    const [value, setValue] = React.useState<string>(defaultUserAddress);
    const [addressErr, setAddressErr] = React.useState<boolean>(false);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const isValidAddress = isAddress(event.target.value);
      setAddressErr(!isValidAddress);
      setValue(event.target.value);
    };

    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
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
    return (
      <div
        className={cn(
          `flex w-full items-center justify-center sm:space-x-2 ${
            !isHome ? "hidden sm:flex" : ""
          }`,
          className
        )}
      >
        <div className="hidden sm:flex flex-col w-full max-w-xl">
          <div
            className={`flex w-full space-x-2 py-1 pl-3 pr-1 border ${
              addressErr ? "border-red-500" : ""
            } rounded-3xl`}
          >
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
              onBlur={() => !isHome && value && router.push(`/user/${value}`)}
            ></Input>
            <Button
              disabled={!isHome || addressErr}
              className={`bg-[#F43F5E] text-white rounded-3xl w-36 ${
                !isHome && "disabled:opacity-0"
              }`}
            >
              <Link href={`/user/${value}`}>Find Now</Link>
            </Button>
          </div>
          {addressErr && (
            <div className="text-red-500 hidden pl-3 pt-1 sm:flex text-sm">
              Enter a valid address
            </div>
          )}
        </div>
        <div className="flex flex-col sm:hidden w-full">
          <div
            className={`flex border ${
              addressErr ? "border-red-500" : ""
            } rounded-3xl py-1 px-3`}
          >
            <Input
              ref={inputRef}
              className="placeholder:text-slate-400 rounded-3xl"
              type="text"
              value={value}
              placeholder="Enter your wallet address"
              onChange={handleChange}
              onBlur={() => !isHome && value && router.push(`/user/${value}`)}
            ></Input>
          </div>
          {addressErr && (
            <div className="text-red-500 text-sm pl-3 pt-1">
              Enter a valid address
            </div>
          )}
          <Button
            disabled={!isHome || addressErr}
            className={`bg-[#F43F5E] text-white rounded-3xl w-full mt-2 ml-0 ${
              !isHome && "disabled:opacity-0"
            }`}
          >
            <Link href={`/user/${value}`}>Find Now</Link>
            <Image
              src={"/search_white.svg"}
              alt="icon"
              width="24"
              height="24"
              className="ml-2"
            />
          </Button>
        </div>
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
