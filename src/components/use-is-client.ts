"use client";

import { useSyncExternalStore } from "react";

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * `true` once the client has hydrated. Components that render into a portal on
 * `document.body` — dialogs, snackbars — use this to stand their markup down
 * for the first server-rendered pass, when there is no body to portal into.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
