export const ONBOARDING_STORAGE_PREFIX = "finance-tracker:onboarding";

export const ONBOARDING_CHANGE_EVENT = "finance-tracker:onboarding-change";

export const ONBOARDING_COMPLETED_VALUE = "completed";

export interface OnboardingStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): OnboardingStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function onboardingStorageKey(userId?: string | null): string {
  const id = typeof userId === "string" ? userId.trim() : "";
  return `${ONBOARDING_STORAGE_PREFIX}:${id.length > 0 ? id : "anonymous"}`;
}

export function loadOnboardingCompleted(
  userId?: string | null,
  storage: OnboardingStorage | null = browserStorage(),
): boolean {
  if (!storage) return false;

  try {
    return (
      storage.getItem(onboardingStorageKey(userId)) ===
      ONBOARDING_COMPLETED_VALUE
    );
  } catch {
    return false;
  }
}

export function saveOnboardingCompleted(
  userId: string | null | undefined,
  storage: OnboardingStorage | null = browserStorage(),
): void {
  if (!storage) return;

  try {
    storage.setItem(onboardingStorageKey(userId), ONBOARDING_COMPLETED_VALUE);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(ONBOARDING_CHANGE_EVENT));
    }
  } catch {
    return;
  }
}
