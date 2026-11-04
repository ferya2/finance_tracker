"use client";

import { useCallback, useEffect, useState } from "react";
import type { PostgrestError } from "@supabase/supabase-js";
import { listAccounts } from "@/lib/supabase/accounts";
import type { Account } from "@/types/account";

export type AccountsStatus = "loading" | "ready" | "error";

export interface UseAccountsResult {
  status: AccountsStatus;
  accounts: Account[] | null;
  error: PostgrestError | null;
  reload: () => void;
}

export function useAccounts(): UseAccountsResult {
  const [status, setStatus] = useState<AccountsStatus>("loading");
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setStatus("loading");
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;

    void listAccounts().then((result) => {
      if (!active) return;
      if (result.error) {
        setError(result.error);
        setAccounts(null);
        setStatus("error");
      } else {
        setAccounts(result.data ?? []);
        setError(null);
        setStatus("ready");
      }
    });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { status, accounts, error, reload };
}
