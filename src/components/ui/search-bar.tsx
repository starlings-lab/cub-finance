"use client";
import * as React from "react";
import Image from "next/image";
import { Input } from "./input";
import { Button } from "./button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isHome: boolean;
  defaultUserAddress: string;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, type, defaultUserAddress, isHome, ...props }, ref) => {
    const router = useRouter();
    const [value, setValue] = React.useState<string>(defaultUserAddress);
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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
          "flex w-full items-center justify-center space-x-2",
          className
        )}
      >
        <div className="flex w-full max-w-xl space-x-2 py-1 pl-3 pr-1 border rounded-3xl">
          <Image src={"/search_black.svg"} alt="icon" width="32" height="32" />
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
            disabled={!isHome}
            className={`bg-[#F43F5E] text-white rounded-3xl w-36 ${
              !isHome && "disabled:opacity-0"
            }`}
          >
            <Link href={`/user/${value}`}>Find Now</Link>
          </Button>
        </div>
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
