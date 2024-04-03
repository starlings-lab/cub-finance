import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <div className="bg-white shadow-sm">
      <div className="mx-auto max-w-8xl px-4 lg:px-8">
        <div className="flex h-16 justify-between">
          <a className="text-2xl text-brand-red font-bold">ReFi</a>
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
