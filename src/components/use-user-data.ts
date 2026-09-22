"use client";

import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { loadUserData, type UserData } from "@/lib/supabase/dashboard";

export type UserDataStatus = "loading" | "ready" | "error";

export interface UseUserDataResult {
  status: UserDataStatus;
  data: UserData | null;
  error: PostgrestError | null;
  reload: () => void;
}

/**
 * Fetches the current user's transactions, categories and budgets on mount.
 * Returns a status so the UI can render loading, error or ready states.
 */
export function useUserData(): UseUserDataResult {
  const [status, setStatus] = useState<UserDataStatus>("loading");
  const [data, setData] = useState<UserData | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;

    void loadUserData().then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setData(null);
        setStatus("error");
      } else {
        setData(result.data);
        setError(null);
        setStatus("ready");
      }
    });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { status, data, error, reload };
}