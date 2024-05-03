"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-8xl px-4 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <Link href="/" passHref>
            <Image src="/refi-v2.png" width={64} height={64} alt="" />
          </Link>
          <div className="flex items-center">
            <Button className="bg-[#F43F5E3a] hover:bg-[#F43F5E] text-black hover:text-white rounded-3xl w-36">
              <Link
                target="_blank"
                href="https://t.me/+pL8nGAh5P5k4MWZh"
                passHref
              >
                <p className="text-md font-normal font-notoSerif">Talk to us</p>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
