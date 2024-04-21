import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="bg-white shadow-sm">
      <div className="mx-auto max-w-8xl px-4 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex flex-row py-5 items-center">
            <Link href="/" passHref>
              <p className="nav-home text-2xl text-[#F43F5E] font-bold">ReFi</p>
            </Link>
          </div>

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
