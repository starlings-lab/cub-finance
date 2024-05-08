"use client";
import * as React from "react";
import Image from "next/image";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { isValidEnsAddress, EOAFromENS } from "../../app/service/ensService";
import { useRouter } from "next/navigation";
import { isAddress } from "ethers";
import { useToast } from "./use-toast";

export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isHome: boolean;
  defaultUserAddress: string;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, type, defaultUserAddress, isHome, ...props }, ref) => {
    const router = useRouter();
    const { toast } = useToast();
    const [value, setValue] = React.useState<string>(defaultUserAddress);
    const [eoaAddress, setEoaAddress] =
      React.useState<string>(defaultUserAddress);
    const [addressErr, setAddressErr] = React.useState<boolean>(false);
    const [buttonDisabled, setButtonDisabled] = React.useState<boolean>(false);
    const [addressIsFocused, setAddressIsFocused] =
      React.useState<boolean>(false);
    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setValue(inputValue);
      setButtonDisabled(true);
      const isValidAddress =
        isAddress(inputValue) || (await isValidEnsAddress(inputValue));
      setAddressErr(!isValidAddress);
      setButtonDisabled(!isValidAddress);

      if (await isValidEnsAddress(inputValue)) {
        const resolvedAddress = await EOAFromENS(inputValue);
        setEoaAddress(resolvedAddress || inputValue);
      } else {
        setEoaAddress(inputValue);
      }
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
          `flex w-full items-center justify-center sm:space-x-2`,
          className
        )}
      >
        {/* Desktop search */}
        <div
          className={`sm:flex flex-col w-9/12 max-w-xl bg-white ${
            isHome ? "hidden" : "flex w-full"
          }`}
        >
          <div
            className={`flex w-full space-x-2 py-1 pl-3 pr-1 border rounded-3xl ${
              addressErr ? "border-red-500" : ""
            }`}
          >
            <Image
              src={"/search_black.svg"}
              alt="icon"
              width="32"
              height="32"
            />
            <Input
              ref={inputRef}
              className="placeholder:text-slate-400 rounded-3xl tracking-wide"
              type="text"
              value={value}
              placeholder="Wallet address or ENS"
              onChange={handleChange}
              onFocus={() => setAddressIsFocused(true)}
              onBlur={() => {
                if (
                  !(addressErr || value === "" || buttonDisabled) &&
                  !isHome
                ) {
                  router.push(`/user/${value}/refinance`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!(addressErr || value === "" || buttonDisabled)) {
                    router.push(`/user/${value}/refinance`);
                  } else {
                    toast({
                      title: "Enter a valid address",
                      variant: "destructive"
                    });
                  }
                }
              }}
            ></Input>
            <Button
              disabled={addressErr || value === "" || buttonDisabled}
              className={`bg-[#F43F5E] text-white rounded-3xl w-36 font-hkGrotesk font-medium tracking-wide ${
                !isHome && "hidden disabled:opacity-0"
              }`}
              onClick={() => {
                setAddressIsFocused(false);
                if (!addressErr && value !== "" && !buttonDisabled) {
                  router.push(`/user/${value}/refinance`);
                } else {
                  toast({
                    title: "Enter a valid address",
                    variant: "destructive"
                  });
                }
              }}
            >
              Find Now
            </Button>
          </div>
          {addressErr && (
            <div
              className={`text-red-500 pl-3 pt-1 sm:flex text-sm ${
                isHome ? "hidden" : "flex"
              }`}
            >
              Enter a valid address
            </div>
          )}
        </div>

        {/* Mobile search */}
        <div
          className={`flex flex-col sm:hidden w-full ${
            !isHome ? "hidden" : ""
          }`}
        >
          <div
            className={`flex border  rounded-3xl py-1 px-3 bg-white ${
              addressErr ? "border-red-500" : ""
            }`}
          >
            <Input
              className="placeholder:text-slate-400 rounded-3xl"
              type="text"
              value={value}
              placeholder="Enter your wallet address"
              onChange={handleChange}
              onBlur={() =>
                !isHome &&
                value &&
                eoaAddress &&
                router.push(`/user/${value}/refinance`)
              }
            ></Input>
          </div>
          {addressErr && (
            <div className="text-red-500 text-sm pl-3 pt-1">
              Enter a valid address
            </div>
          )}
          <Button
            disabled={!isHome || addressErr || buttonDisabled}
            className={`bg-[#F43F5E] text-white rounded-3xl w-full mt-2 ml-0 ${
              !isHome && "disabled:opacity-0"
            }`}
            onClick={() => router.push(`/user/${value}/refinance`)}
          >
            Find Now
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
