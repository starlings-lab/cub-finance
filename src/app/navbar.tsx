import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="bg-white shadow-sm">
      <div className="mx-auto max-w-8xl px-4 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex flex-row p-5 ml-5 items-center">
            <Link href="/" passHref>
              <p className="nav-home text-2xl text-[#F43F5E] font-bold">ReFi</p>
            </Link>
          </div>

          <div className="mt-auto mb-auto">
            <Link target="_blank" href="https://t.me/+WN0vHN-RU2g1ZTkx">
              <Image
                className="mr-1 hover:opacity-80"
                alt="icon"
                width="32"
                height="32"
                src={`/Telegram.svg`}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
