import React from "react";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import Image from "next/image";

const Header = async () => {
  await checkUser();

  return (
    <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
      <nav className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <Image
            src={"/logo.png"}
            alt="Welth Logo"
            width={200}
            height={60}
            className="h-10 sm:h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Navigation Links - Different for signed in/out users */}
        <div className="hidden md:flex items-center space-x-8">
          <SignedOut>
            <a href="#features" className="text-gray-600 hover:text-blue-600 text-sm">
              Features
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600 text-sm"
            >
              Testimonials
            </a>
          </SignedOut>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
            >
              <Button variant="outline" size="sm" className="h-9">
                <LayoutDashboard size={16} className="sm:mr-2" />
                <span className="hidden sm:inline text-sm">Dashboard</span>
              </Button>
            </Link>
            <a href="/transaction/create">
              <Button size="sm" className="flex items-center gap-2 h-9">
                <PenBox size={16} className="sm:mr-2" />
                <span className="hidden sm:inline text-sm">Add Transaction</span>
              </Button>
            </a>
          </SignedIn>
          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline" size="sm" className="text-sm">Login</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 sm:w-10 sm:h-10",
                },
              }}
            />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
