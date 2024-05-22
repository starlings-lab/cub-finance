"use client";
import { trackEvent } from "fathom-client";
import * as React from "react";
import { useState, forwardRef, useRef, useEffect } from "react";
import Image from "next/image";
import { Input } from "./input";
import { Button } from "./button";
import Spinner from "./spinner";
import { cn } from "@/lib/utils";
import { isValidEnsAddress, EOAFromENS } from "../../app/service/ensService";
import { useRouter } from "next/navigation";
import { isAddress } from "ethers";
import { useToast } from "./use-toast";
import { ROUTE_BORROW } from "@/app/constants";

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
    const [debouncedAddress, setDebouncedAddress] =
      useState<string>(defaultUserAddress);
    const [eoaAddress, setEoaAddress] = useState<string>(defaultUserAddress);
    const [addressErr, setAddressErr] = useState<boolean>(false);
    const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isInputHovered, setIsInputHovered] = useState<boolean>(false);
    const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

    const preValidationStateUpdate = (inputValue: string) => {
      setAddress(inputValue);
      setButtonDisabled(true);
      setIsLoading(true);
    };

    const postValidationStateUpdate = (
      resolvedAddress: string,
      isValidAddress: boolean
    ) => {
      console.log(resolvedAddress, isValidAddress);
      setEoaAddress(resolvedAddress);
      setAddressErr(!isValidAddress);
      setButtonDisabled(!isValidAddress);
      setIsLoading(false);
    };

    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        setDebouncedAddress(address);
      }, 500);
      return () => clearTimeout(timeoutId);
    }, [address]);

    useEffect(() => {
      const validateAddress = async () => {
        preValidationStateUpdate(debouncedAddress);
        const isValidEns = await isValidEnsAddress(debouncedAddress);
        const resolvedAddress = isValidEns
          ? await EOAFromENS(debouncedAddress)
          : debouncedAddress;
        const isValidAddress = isAddress(resolvedAddress) || isValidEns;
        postValidationStateUpdate(resolvedAddress as string, isValidAddress);
      };

      validateAddress();
    }, [debouncedAddress]);

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setAddress(inputValue);
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

    const verifyAndRefreshRoute = React.useCallback(async () => {
      // it should not refetch for same address
      if (address !== defaultUserAddress || isHome) {
        setIsLoading(true);

        trackEvent("Find Now"); // this event triggered both in the home page and user page
        if (routeType) {
          router.push(`/user/${address}/${routeType}`);
        } else {
          router.push(`/user/${address}/${ROUTE_BORROW}`);
        }
      }
    }, [address, router, isHome, defaultUserAddress, routeType]);

    const errorCheck = addressErr || address === "" || buttonDisabled;

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
            className={`flex w-full space-x-2 py-1 pr-1 border rounded-2xl ${
              addressErr ? "border-red-500" : ""
            } ${isHome ? "pl-3" : "pl-1"}`}
            onMouseEnter={() => setIsInputHovered(true)}
            onMouseLeave={() => setIsInputHovered(false)}
          >
            <Image
              src={"/search_black.svg"}
              alt="icon"
              width="24"
              height="24"
              className={isHome ? "block" : "hidden"}
            />
            <Input
              ref={inputRef}
              className="placeholder:text-slate-400 rounded-2xl tracking-wide text-xs sm:text-sm !ml-1 sm:!ml-2"
              type="text"
              value={address}
              placeholder="Wallet address or ENS"
              onChange={handleChange}
              onFocus={() => setIsInputFocused(true)}
              onBlur={async () => {
                if (!errorCheck && !isHome) {
                  await verifyAndRefreshRoute();
                }
                setIsInputFocused(false);
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  if (!errorCheck) {
                    await verifyAndRefreshRoute();
                  } else {
                    if (!isLoading) {
                      toast({
                        title: "Enter a valid address",
                        variant: "destructive"
                      });
                    }
                  }
                }
              }}
            ></Input>
            <Button
              variant={"ghost"}
              className={`py-2 px-0 sm:py-2 sm:px-0 ${
                (isInputFocused || isInputHovered) && address.length > 0
                  ? "sm:visible"
                  : "sm:invisible"
              } ${address.length > 0 ? "visible" : "invisible"}`}
              onClick={() => setAddress("")}
            >
              <Image
                src={"/cross.svg"}
                alt="clear input"
                width={40}
                height={40}
              />
            </Button>
            <Button
              disabled={errorCheck}
              className={`bg-[#F43F5E] text-white rounded-2xl sm:py-4 sm:px-8 font-hkGrotesk font-medium tracking-wide transition-opacity hover:bg-[#F43F5E] hover:opacity-80 ${
                isHome ? "w-36" : "w-12 sm:w-24"
              }`}
              onClick={verifyAndRefreshRoute}
            >
              {getSearchButtonOrImage(isHome, isLoading)}
            </Button>
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
            className={`text-red-500 pl-3 pt-1 sm:flex text-sm ${
              isHome ? "hidden" : "flex"
            } ${addressErr && !isLoading ? "visible" : "invisible"}`}
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
            className={`flex border  rounded-2xl py-1 px-3 bg-white ${
              addressErr ? "border-red-500" : ""
            }`}
          >
            <Input
              className="placeholder:text-slate-400 rounded-2xl"
              type="text"
              value={address}
              placeholder="Enter your wallet address"
              onFocus={() => setIsInputFocused(true)}
              onChange={handleChange}
              onBlur={async () => {
                if (!isHome && address && eoaAddress) {
                  await verifyAndRefreshRoute();
                }
                setIsInputFocused(false);
              }}
            />
            <Button
              variant={"ghost"}
              className={`py-2 px-0 ${
                address.length > 0 ? "visible" : "invisible hidden"
              }`}
              onClick={() => setAddress("")}
            >
              <Image
                src={"/cross.svg"}
                alt="clear input"
                width={40}
                height={40}
              />
            </Button>
          </div>
          <div
            className={`items-center text-gray-500 text-sm pl-3 ${
              isLoading ? "visible flex" : "invisible hidden"
            }`}
          >
            <Spinner />
            <span className="ml-2">Validating address</span>
          </div>
          <div
            className={`text-red-500 text-sm pl-3 pt-1 ${
              addressErr && !isLoading ? "visible" : "invisible"
            }`}
          >
            Enter a valid address
          </div>
          <Button
            disabled={!isHome || errorCheck}
            className={`bg-[#F43F5E] text-white rounded-2xl py-4 px-8 w-full mt-2 ml-0 hover:bg-[#F43F5E] hover:opacity-80 ${
              !isHome && "disabled:opacity-0"
            }`}
            onClick={verifyAndRefreshRoute}
          >
            {getSearchButtonOrImage(isHome, isLoading)}
          </Button>
        </div>
      </div>
    );
  }
);
SearchBar.displayName = "SearchBar";

export { SearchBar };

function getSearchButtonOrImage(isHome: boolean, isLoading: boolean) {
  return isLoading ? (
    <Spinner color={"#fff"} />
  ) : (
    <div>
      {isHome ? (
        "Find Now"
      ) : (
        <Image src={"/search_white.svg"} alt="icon" width="20" height="20" />
      )}
    </div>
  );
}
