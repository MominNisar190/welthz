

import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Welth - Personal Finance Management",
  description: "One stop Finance Platform for managing your accounts, budgets, and transactions",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  themeColor: "#2563EB",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo-sm.png" sizes="any" />
        </head>
        <body className={`${inter.className}`} suppressHydrationWarning>
          <Header />
          <main className="min-h-screen pt-10">{children}</main>
          <Toaster richColors />

          <footer className="bg-blue-50 py-8 sm:py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p className="text-sm sm:text-base">
                 ©2026 Made By | •
                  <a href="https://instagram.com/nisar_momin.45" target="_blank" rel="noopener noreferrer"> Nisar </a> •  
                 <a href="https://instagram.com/dilraj_s_p" target="_blank" rel="noopener noreferrer"> Dilraj </a> • 
                 <a href="https://instagram.com/arbaz_username" target="_blank" rel="noopener noreferrer"> Arbaz </a> |
                 
               </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
