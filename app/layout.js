import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Welth",
  description: "One stop Finance Platform",
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
          <main className="min-h-screen">{children}</main>
          <Toaster richColors />

          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>
                 ©2026 Made By | •
                  <a href="https://instagram.com/nisar_momin.45" target="_blank"> Nisar </a> •  
                 <a href="https://instagram.com/dilraj_s_p" target="_blank"> Dilraj </a> • 
                 <a href="https://instagram.com/arbaz_username" target="_blank"> Arbaz </a> |
                 
               </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
