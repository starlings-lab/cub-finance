"use client";
import * as React from "react";
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
    const [isFetchingDebtPositions, setIsFetchingDebtPositions] =
      React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const [activeRoute, setActiveRoute] = React.useState("refinance");

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setValue(inputValue);
      setIsLoading(true);
      setButtonDisabled(true);
      const isValidAddress =
        isAddress(inputValue) || (await isValidEnsAddress(inputValue));
      setAddressErr(!isValidAddress);
      setButtonDisabled(!isValidAddress);
      setIsLoading(false);

      if (await isValidEnsAddress(inputValue)) {
        const resolvedAddress = await EOAFromENS(inputValue);
        setEoaAddress(resolvedAddress as string);
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

    const fetchRecommendations = React.useCallback(async () => {
      setIsFetchingDebtPositions(true);
      await getUserDebtPositions(eoaAddress as Address)
        .then((res) => {
          setActiveRoute(res.length > 0 ? "refinance" : "borrow");
        })
        .catch((e) => {
          console.log("Failed to fetch positions");
        })
        .finally(() => setIsFetchingDebtPositions(false));
    }, [eoaAddress]);

    React.useEffect(() => {
      if (!(addressErr || value === "" || buttonDisabled) && isHome) {
        fetchRecommendations();
      }
    }, [value, addressErr, buttonDisabled, isHome, fetchRecommendations]);

    const errorCheck =
      addressErr || value === "" || buttonDisabled || isFetchingDebtPositions;

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
              onBlur={() => {
                if (!errorCheck && !isHome) {
                  router.push(`/user/${value}/${activeRoute}`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!errorCheck) {
                    router.push(`/user/${value}/${activeRoute}`);
                  } else {
                    toast({
                      title: "Enter a valid address",
                      variant: "destructive"
                    });
                  }
                }
              }}
            ></Input>
            <Link href={`/user/${value}/${activeRoute}`}>
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
            <span className="ml-2">Fetching positions</span>
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
              value={value}
              placeholder="Enter your wallet address"
              onChange={handleChange}
              onBlur={() =>
                !isHome &&
                value &&
                eoaAddress &&
                router.push(`/user/${value}/${activeRoute}`)
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
          <Link href={`/user/${value}/${activeRoute}`}>
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
