"use client";

import { useEffect, useState } from "react";

export interface ThemeColors {
  dark: boolean;
  primary: string;
  accent: string;
}

const LIGHT_COLORS: ThemeColors = {
  dark: false,
  primary: "#059669",
  accent: "#0d9488",
};

const DARK_COLORS: ThemeColors = {
  dark: true,
  primary: "#34d399",
  accent: "#2dd4bf",
};

/** Reads the active accent (light or dark variant) for 3D accents. */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(LIGHT_COLORS);

  useEffect(() => {
    const check = () => {
      const dark = document.documentElement.classList.contains("dark");
      const style = getComputedStyle(document.documentElement);
      const fallback = dark ? DARK_COLORS : LIGHT_COLORS;
      const primary =
        style.getPropertyValue("--accent-active").trim() || fallback.primary;
      const accent =
        style.getPropertyValue("--accent-secondary-active").trim() ||
        fallback.accent;
      setColors({ dark, primary, accent });
    };

    check();
    window.addEventListener("theme-change", check);
    return () => window.removeEventListener("theme-change", check);
  }, []);

  return colors;
}
