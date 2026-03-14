"use client";

import { Button } from "./ui/button";
import { PenBox, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export function HeaderAuth() {
  return (
    <>
      {/* Nav links for signed out */}
      <div className="hidden md:flex items-center space-x-8">
        <SignedOut>
          <a href="#features" className="text-gray-600 hover:text-blue-600">
            Features
          </a>
          <a href="#testimonials" className="text-gray-600 hover:text-blue-600">
            Testimonials
          </a>
        </SignedOut>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        <SignedIn>
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-blue-600 flex items-center gap-2"
          >
            <Button variant="outline">
              <LayoutDashboard size={18} />
              <span className="hidden md:inline">Dashboard</span>
            </Button>
          </Link>
          <a href="/transaction/create">
            <Button className="flex items-center gap-2">
              <PenBox size={18} />
              <span className="hidden md:inline">Add Transaction</span>
            </Button>
          </a>
        </SignedIn>
        <SignedOut>
          <SignInButton forceRedirectUrl="/dashboard">
            <Button variant="outline">Login</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />
        </SignedIn>
      </div>
    </>
  );
}
