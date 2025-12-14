"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Powered by
          </span>
          <Link href="https://vuedapt.com" target="_blank">
            <Image
              src="/vuedapt-blue-black.png"
              alt="Vuedapt"
              width={100}
              height={30}
              className="h-4 w-auto object-contain"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
