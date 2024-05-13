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
            <Image src="/cub_logo.png" width={64} height={64} alt="" />
          </Link>
          <div className="flex items-center">
            <Button className="bg-[#009DC4] hover:bg-[#009dc4d6] text-white hover:text-white rounded-2xl py-4 px-8 transition-colors">
              <Link
                target="_blank"
                href="https://t.me/+pL8nGAh5P5k4MWZh"
                passHref
              >
                <p className="text-md font-normal font-hkGrotesk">Talk to Us</p>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
