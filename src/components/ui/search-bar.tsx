"use client";
import * as React from "react";
import { useState, forwardRef, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Input } from "./input";
import { Button } from "./button";
import Spinner from "./spinner";
import { cn } from "@/lib/utils";
import { isValidEnsAddress, EOAFromENS } from "../../app/service/ensService";
import { useRouter } from "next/navigation";
import { isAddress } from "ethers";
import { useToast } from "./use-toast";
import { getUserDebtPositions } from "@/app/service/userDebtPositions";
import { Address } from "abitype";
import Link from "next/link";
import { ROUTE_BORROW, ROUTE_REFINANCE } from "@/app/constants";

export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isHome: boolean;
  defaultUserAddress: string;
  routeType?: string;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, routeType, defaultUserAddress, isHome, ...props }, ref) => {
    const router = useRouter();
    const { toast } = useToast();
    const [address, setAddress] = useState<string>(defaultUserAddress);
    const [eoaAddress, setEoaAddress] = useState<string>(defaultUserAddress);
    const [addressErr, setAddressErr] = useState<boolean>(false);
    const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
    const [isFetchingDebtPositions, setIsFetchingDebtPositions] =
      useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [activeRoute, setActiveRoute] = useState(
      routeType ?? ROUTE_REFINANCE
    );

    const preValidationStateUpdate = (inputValue: string) => {
      setAddress(inputValue);
      setButtonDisabled(true);
      setIsLoading(true);
    };

    const postValidationStateUpdate = (
      resolvedAddress: string,
      isValidAddress: boolean
    ) => {
      setEoaAddress(resolvedAddress);
      setAddressErr(!isValidAddress);
      setButtonDisabled(!isValidAddress);
      setIsLoading(false);
    };

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      preValidationStateUpdate(inputValue);
      const isValidEns = await isValidEnsAddress(inputValue);
      const resolvedAddress = isValidEns
        ? await EOAFromENS(inputValue)
        : inputValue;
      const isValidAddress = isAddress(resolvedAddress) || isValidEns;
      postValidationStateUpdate(resolvedAddress as string, isValidAddress);
    };

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
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

    const fetchDebtPositions = useCallback(async () => {
      setIsFetchingDebtPositions(true);
      try {
        const debtPositions = await getUserDebtPositions(eoaAddress as Address);
        setActiveRoute(
          debtPositions.length > 0 ? ROUTE_REFINANCE : ROUTE_BORROW
        );
      } catch (e) {
        console.error("Failed to fetch debt positions:", e);
      } finally {
        setIsFetchingDebtPositions(false);
      }
    }, [eoaAddress]);

    useEffect(() => {
      if (!(addressErr || address === "" || buttonDisabled) && isHome) {
        fetchDebtPositions();
      }
    }, [address, addressErr, buttonDisabled, isHome, fetchDebtPositions]);

    const errorCheck =
      addressErr || address === "" || buttonDisabled || isFetchingDebtPositions;

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
              value={address}
              placeholder="Wallet address or ENS"
              onChange={handleChange}
              onBlur={() => {
                if (!errorCheck && !isHome) {
                  router.push(`/user/${address}/${activeRoute}`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!errorCheck) {
                    router.push(`/user/${address}/${activeRoute}`);
                  } else {
                    if(!isLoading){
                      toast({
                        title: "Enter a valid address",
                        variant: "destructive"
                      });
                    }
                  }
                }
              }}
            ></Input>
            <Link href={`/user/${address}/${activeRoute}`}>
              <Button
                disabled={errorCheck}
                className={`bg-[#F43F5E] text-white rounded-3xl w-36 font-hkGrotesk font-medium tracking-wide ${
                  !isHome && "hidden disabled:opacity-0"
                }`}
              >
                Find Now
              </Button>
            </Link>
          </div>
          <div
            className={`items-center text-gray-500 text-sm pl-3 mt-2 ${
              isLoading ? "visible flex" : "invisible hidden"
            }`}
          >
            <Spinner />
            <span className="ml-2">Validating address</span>
          </div>
          <div
            className={`items-center text-gray-500 text-sm pl-3 mt-2 ${
              isFetchingDebtPositions && isHome
                ? "visible flex"
                : "invisible hidden"
            }`}
          >
            <Spinner />
            <span className="ml-2">Scanning address</span>
          </div>
          <div
            className={`text-red-500 pl-3 pt-1 sm:flex text-sm ${
              isHome ? "hidden" : "flex"
            } ${addressErr ? "visible" : "invisible"}`}
          >
            Enter a valid address
          </div>
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
              value={address}
              placeholder="Enter your wallet address"
              onChange={handleChange}
              onBlur={() =>
                !isHome &&
                address &&
                eoaAddress &&
                router.push(`/user/${address}/${activeRoute}`)
              }
            ></Input>
          </div>
          <div
            className={`flex items-center text-gray-500 text-sm pl-3 ${
              isLoading ? "visible" : "invisible"
            }`}
          >
            <Spinner />
            <span className="ml-2">Validating address</span>
          </div>
          <div
            className={`items-center text-gray-500 text-sm pl-3 mt-2 ${
              isFetchingDebtPositions && isHome
                ? "visible flex"
                : "invisible hidden"
            }`}
          >
            <Spinner />
            <span className="ml-2">Fetching positions</span>
          </div>
          <div
            className={`text-red-500 text-sm pl-3 pt-1 ${
              addressErr ? "visible" : "invisible"
            }`}
          >
            Enter a valid address
          </div>
          <Link href={`/user/${address}/${activeRoute}`}>
            <Button
              disabled={
                !isHome ||
                addressErr ||
                buttonDisabled ||
                isFetchingDebtPositions
              }
              className={`bg-[#F43F5E] text-white rounded-3xl w-full mt-2 ml-0 ${
                !isHome && "disabled:opacity-0"
              }`}
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
          </Link>
        </div>
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };
