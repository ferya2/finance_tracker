"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { ThemePreference } from "@/lib/auth/settings";
import {
  DEFAULT_ACCENT_COLOR,
  accentPalette,
  parseAccentSetting,
  sanitizeAccentColor,
  type AccentColor,
} from "@/lib/finance/accent-color";

function getInitialDark(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

let isDark = false;
let accentColor: AccentColor = DEFAULT_ACCENT_COLOR;

const ACCENT_STORAGE_KEY = "accent-color";

function applyAccent(color: AccentColor): void {
  const palette = accentPalette(color);
  const root = document.documentElement;
  root.style.setProperty("--accent-light", palette.light);
  root.style.setProperty("--accent-dark", palette.dark);
  root.style.setProperty("--accent-soft", palette.soft);
  root.style.setProperty("--accent-soft-dark", palette.softDark);
  root.style.setProperty("--accent-secondary-light", palette.secondaryLight);
  root.style.setProperty("--accent-secondary-dark", palette.secondaryDark);
}

export function getAccentColor(): AccentColor {
  return accentColor;
}

export function setAccentColor(color: AccentColor): void {
  accentColor = sanitizeAccentColor(color);
  applyAccent(accentColor);
  localStorage.setItem(ACCENT_STORAGE_KEY, accentColor);
  window.dispatchEvent(new Event("theme-change"));
}

function getServerAccentSnapshot(): AccentColor {
  return DEFAULT_ACCENT_COLOR;
}

export function useAccentColor(): AccentColor {
  return useSyncExternalStore(
    subscribe,
    getAccentColor,
    getServerAccentSnapshot,
  );
}

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

export function getTheme(): ThemePreference {
  return isDark ? "dark" : "light";
}

export function setTheme(theme: ThemePreference): void {
  isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("theme", theme);
  window.dispatchEvent(new Event("theme-change"));
}

export function DarkModeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      isDark = getInitialDark();
      accentColor = parseAccentSetting(localStorage.getItem(ACCENT_STORAGE_KEY));
      document.documentElement.classList.toggle("dark", isDark);
      applyAccent(accentColor);
      initialized.current = true;
      window.dispatchEvent(new Event("theme-change"));
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
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
