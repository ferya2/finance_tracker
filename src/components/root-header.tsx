"use client";

import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { Nav } from "@/components/nav";

/** The public landing header — hidden inside the authed app shell. */
export function RootHeader() {
  const pathname = usePathname();

  if (pathname !== null && pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
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
  );
}