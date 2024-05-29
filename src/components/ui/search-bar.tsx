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
import { ROUTE_BORROW, TEST_DEBT_POSITION_ADDRESSES } from "@/app/constants";
import ClickAwayListener from "./click-away-listener";

export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isHome: boolean;
  defaultUserAddress: string;
  routeType?: string;
}

const TEST_ADDRESS_MAP = [
  {
    address: TEST_DEBT_POSITION_ADDRESSES.ensAddress3,
    protocol: "aavev3"
  },
  {
    address: TEST_DEBT_POSITION_ADDRESSES.compoundUser3,
    protocol: "compoundv3"
  },
  {
    address: TEST_DEBT_POSITION_ADDRESSES.morphoUser2,
    protocol: "morphoblue"
  },
  {
    address: TEST_DEBT_POSITION_ADDRESSES.sparkUser3,
    protocol: "spark"
  }
];

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, routeType, defaultUserAddress, isHome, ...props }, ref) => {
    const router = useRouter();
    const { toast } = useToast();
    const [address, setAddress] = useState<string>(defaultUserAddress);
    const [debouncedAddress, setDebouncedAddress] =
      useState<string>(defaultUserAddress);
    const [addressErr, setAddressErr] = useState<boolean>(false);
    const [buttonDisabled, setButtonDisabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isInputHovered, setIsInputHovered] = useState<boolean>(false);
    const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
    const [showRecentSearches, setShowRecentSearches] =
      useState<boolean>(false);
    const [userRecentSearches, setUserRecentSearches] = useState<string[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        setDebouncedAddress(address);
      }, 500);
      return () => clearTimeout(timeoutId);
    }, [address]);

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

    const resetErrors = () => {
      setAddressErr(false);
      setButtonDisabled(false);
    };

    const updateLocalStorageRecentSearches = (address: string) => {
      const recentSearches = localStorage.getItem("recentSearches");
      if (recentSearches) {
        const parseRecentSearches = JSON.parse(recentSearches);
        const checkIfTheAddressIsAlreadyThere =
          parseRecentSearches.findIndex(
            (testAddress: string) => testAddress === address
          ) > -1;
        if (!checkIfTheAddressIsAlreadyThere) {
          const checkIfTheAddressIsTest =
            TEST_ADDRESS_MAP.findIndex(
              (testAddress) => testAddress.address === address
            ) === -1;
          if (checkIfTheAddressIsTest) {
            localStorage.setItem(
              "recentSearches",
              JSON.stringify([address, ...parseRecentSearches])
            );
            setUserRecentSearches([address, ...parseRecentSearches]);
          }
        } else {
          const filteredAddress = parseRecentSearches.filter(
            (testAddress: string) => testAddress !== address
          );
          localStorage.setItem(
            "recentSearches",
            JSON.stringify([address, ...filteredAddress])
          );
          setUserRecentSearches([address, ...filteredAddress]);
        }
      } else {
        const checkIfTheAddressIsTest =
          TEST_ADDRESS_MAP.findIndex(
            (testAddress) => testAddress.address === address
          ) === -1;
        if (checkIfTheAddressIsTest) {
          localStorage.setItem("recentSearches", JSON.stringify([address]));
        }
      }
    };

    const preValidationStateUpdate = (inputValue: string) => {
      setAddress(inputValue);
      setButtonDisabled(true);
      setIsLoading(true);
    };

    const postValidationStateUpdate = async (
      resolvedAddress: string,
      isValidAddress: boolean
    ) => {
      setAddressErr(!isValidAddress);
      setButtonDisabled(!isValidAddress);
      if (isValidAddress && isHome) {
        updateLocalStorageRecentSearches(resolvedAddress);
        await verifyAndRefreshRoute();
      } else {
        setIsLoading(false);
      }
    };

    const validateAddress = async () => {
      preValidationStateUpdate(debouncedAddress);
      const isValidEns = await isValidEnsAddress(debouncedAddress);
      const resolvedAddress = isValidEns
        ? await EOAFromENS(debouncedAddress)
        : debouncedAddress;
      const isValidAddress = isAddress(resolvedAddress) || isValidEns;
      await postValidationStateUpdate(
        resolvedAddress as string,
        isValidAddress
      );
    };

    const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (addressErr) {
        resetErrors();
      }
      const inputValue = event.target.value;
      setAddress(inputValue);
    };

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

    const handleAddressSelect = (address: string) => {
      setAddress(address);
      setShowRecentSearches(false);
      addressErr && resetErrors();
    };

    const handleRemoveAddress = () => {
      setAddress("");
      addressErr && resetErrors();
    };

    const handleInputFocus = () => {
      setIsInputFocused(true);
      setShowRecentSearches(true);
    };

    const handleInputBlur = async () => {
      if (!isHome) {
        await validateAddress();
      }
      setIsInputFocused(false);
      setTimeout(() => {
        setShowRecentSearches(false);
      }, 500);
    };

    const handleKeyDownPress = async (e: any) => {
      if (e.key === "Enter") {
        if (!errorCheck) {
          await validateAddress();
        } else {
          if (!isLoading) {
            toast({
              title: "Enter a valid address",
              variant: "destructive"
            });
          }
        }
      }
    };

    const errorCheck = addressErr || address === "" || buttonDisabled;

    return (
      <ClickAwayListener
        className={cn(
          `flex w-full items-center justify-center sm:space-x-2`,
          className
        )}
        onClickAway={() => setShowRecentSearches(false)}
      >
        {/* Desktop search */}
        <div
          className={`sm:flex flex-col w-9/12 max-w-xl bg-white relative ${
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
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDownPress}
            ></Input>
            <Button
              variant={"ghost"}
              className={`py-2 px-0 sm:py-2 sm:px-0 ${
                (isInputFocused || isInputHovered) && address.length > 0
                  ? "sm:visible"
                  : "sm:invisible"
              } ${address.length > 0 ? "visible" : "invisible"}`}
              onClick={handleRemoveAddress}
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
              onClick={validateAddress}
            >
              {getSearchButtonOrImage(isHome, isLoading)}
            </Button>
          </div>
          {isHome && showRecentSearches && (
            <RecentSearchesDropdown
              userRecentSearches={userRecentSearches}
              handleAddressSelect={handleAddressSelect}
            />
          )}
          {getValidationMessage(addressErr, isLoading)}
        </div>

        {/* Mobile search */}
        <div
          className={`flex flex-col sm:hidden w-full relative ${
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
              onFocus={handleInputFocus}
              onChange={handleChange}
              onBlur={handleInputBlur}
            />
            <Button
              variant={"ghost"}
              className={`py-2 px-0 ${
                address.length > 0 ? "visible" : "invisible hidden"
              }`}
              onClick={handleRemoveAddress}
            >
              <Image
                src={"/cross.svg"}
                alt="clear input"
                width={40}
                height={40}
              />
            </Button>
          </div>
          {isHome && showRecentSearches && (
            <RecentSearchesDropdown
              userRecentSearches={userRecentSearches}
              handleAddressSelect={handleAddressSelect}
            />
          )}
          {getValidationMessage(addressErr, isLoading)}
          <Button
            disabled={!isHome || errorCheck}
            className={`bg-[#F43F5E] text-white rounded-2xl py-4 px-8 w-full mt-2 ml-0 hover:bg-[#F43F5E] hover:opacity-80 ${
              !isHome && "disabled:opacity-0"
            }`}
            onClick={validateAddress}
          >
            {getSearchButtonOrImage(isHome, isLoading)}
          </Button>
        </div>
      </ClickAwayListener>
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

function getValidationMessage(addressErr: boolean, isLoading: boolean) {
  return (
    <div
      className={`text-sm pl-3 pt-1 min-h-6 ${
        isLoading || addressErr ? "visible" : "invisible"
      }`}
    >
      {isLoading && (
        <div className="flex items-center text-gray-500">
          <Spinner />
          <span className="ml-2">Validating address</span>
        </div>
      )}
      {addressErr && !isLoading && (
        <div className={"text-red-500"}>Enter a valid address</div>
      )}
    </div>
  );
}

function RecentSearchesDropdown({
  userRecentSearches,
  handleAddressSelect
}: {
  userRecentSearches: string[];
  handleAddressSelect: (val: string) => void;
}) {
  return (
    <div className="bg-white h-30 absolute top-12 mt-1 px-4 border-x border-b  right-0 left-0 shadow-lg border-slate-100 z-50 max-h-64 overflow-y-scroll rounded-md">
      {userRecentSearches?.length > 0 && (
        <div className="py-5">
          <div className="text-xs sm:text-sm text-slate-500 pb-2">
            Recent Searches
          </div>
          {userRecentSearches.slice(0, 3).map((address) => (
            <div
              onClick={() => {
                handleAddressSelect(address);
              }}
              key={address}
              className="text-slate-800 text-xs sm:text-sm cursor-pointer border p-1 rounded-md mb-2 w-max sm:w-fit"
            >
              {address}
            </div>
          ))}
        </div>
      )}
      <div className={`pb-5 ${userRecentSearches?.length === 0 && "pt-5"}`}>
        <div className="text-xs sm:text-sm text-slate-500 pb-2">
          Example Searches
        </div>
        {TEST_ADDRESS_MAP.map((address) => (
          <div
            onClick={() => {
              handleAddressSelect(address.address);
            }}
            key={address.address}
            className="flex row items-center text-slate-800 text-xs sm:text-sm cursor-pointer border p-1 rounded-md mb-2 w-max sm:w-fit"
          >
            <Image
              src={`/${address.protocol}.png`}
              alt=""
              width={20}
              height={20}
              className="rounded mr-2"
            />
            <div>{address.address}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
