import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Wallet } from "lucide-react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Tracker — Track income, budget smarter",
  description:
    "A modern personal finance tracker. Track income and expenses, set monthly budgets, and understand your spending with clear reports.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { color: "#ffffff" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-text">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Wallet className="h-4 w-4" />
              </span>
              Finance Tracker
            </p>
            <Nav />
            <DarkModeToggle />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
