import React from "react";
import Link from "next/link";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";
import { HeaderAuth } from "./header-auth";

const Header = async () => {
  await checkUser();

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <Image
            src={"/logo.png"}
            alt="Welth Logo"
            width={200}
            height={60}
            className="h-12 w-auto object-contain"
          />
        </Link>

        <HeaderAuth />
      </nav>
    </header>
  );
};

export default Header;
