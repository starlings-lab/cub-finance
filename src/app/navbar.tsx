"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  return (
    <div className="bg-white shadow-sm">
      <div className="mx-auto max-w-8xl px-4 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex flex-row py-5 items-center">
            <Link href="/" passHref>
              <p className="nav-home text-2xl text-[#F43F5E] font-bold">ReFi</p>
            </Link>
          </div>
          {/* TODO: add logic here for getting the data */}
          {pathname.includes("user") && (
            <div className="flex w-full items-center justify-center space-x-2">
              <div className="flex w-full max-w-xl space-x-2 py-1 pl-3 pr-1 border rounded-3xl">
                <Image
                  src={"/search_black.svg"}
                  alt="icon"
                  width="32"
                  height="32"
                />
                <Input
                  // ref={inputRef}
                  className="placeholder:text-slate-400"
                  type="text"
                  // value={value}
                  placeholder="Enter your wallet address"
                  // onChange={handleChange}
                ></Input>
                {/* <Button className="bg-[#F43F5E] text-white rounded-3xl w-36">
                <Link href={`/user`}>Find Now</Link>
              </Button> */}
              </div>
            </div>
          )}
          <div className="mt-auto mb-auto">
            <Button className="bg-[#F43F5E3a] hover:bg-[#F43F5E] text-black hover:text-white rounded-3xl w-36">
              <Link
                target="_blank"
                href="https://t.me/+WN0vHN-RU2g1ZTkx"
                passHref
              >
                <p className="text-md font-normal">Talk to us</p>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
