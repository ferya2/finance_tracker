"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

function getInitialDark(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

let isDark = false;

function subscribe(callback: () => void): () => void {
  window.addEventListener("theme-change", callback);
  return () => window.removeEventListener("theme-change", callback);
}

function getSnapshot(): boolean {
  return isDark;
}

function getServerSnapshot(): boolean {
  return false;
}

export function DarkModeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      isDark = getInitialDark();
      document.documentElement.classList.toggle("dark", isDark);
      initialized.current = true;
    }
  }, []);

  const toggle = useCallback(() => {
    isDark = !isDark;
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    window.dispatchEvent(new Event("theme-change"));
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text"
    >
      <Sun
        className={`absolute h-4 w-4 transition-all duration-200 ${dark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"}`}
      />
      <Moon
        className={`absolute h-4 w-4 transition-all duration-200 ${dark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
      />
    </button>
  );
}
