"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/components/auth/session-provider";
import { useCurrency } from "@/components/currency-provider";
import { setAccentColor, setTheme } from "@/components/dark-mode-toggle";

export function UserSettingsSync() {
  const { user } = useSession();
  const { setCurrency } = useCurrency();
  const settings = user?.settings;
  const appliedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !settings) return;

    const key = [
      user.id,
      settings.displayName ?? "",
      settings.currency ?? "",
      settings.theme ?? "",
      settings.accentColor ?? "",
    ].join(":");
    if (appliedKey.current === key) return;
    appliedKey.current = key;

    if (settings.currency) setCurrency(settings.currency);
    if (settings.theme) setTheme(settings.theme);
    if (settings.accentColor) setAccentColor(settings.accentColor);
  }, [user, settings, setCurrency]);

  return null;
}
