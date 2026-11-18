import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadOnboardingCompleted,
  ONBOARDING_CHANGE_EVENT,
  ONBOARDING_COMPLETED_VALUE,
  ONBOARDING_STORAGE_PREFIX,
  onboardingStorageKey,
  saveOnboardingCompleted,
  type OnboardingStorage,
} from "./onboarding";

function memoryStorage(initial: Record<string, string> = {}): OnboardingStorage & {
  values: Record<string, string>;
} {
  const values = { ...initial };
  return {
    values,
    getItem: (key) => (key in values ? values[key] : null),
    setItem: (key, value) => {
      values[key] = value;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("onboardingStorageKey", () => {
  it("scopes the key to the user", () => {
    expect(onboardingStorageKey("user-1")).toBe(
      `${ONBOARDING_STORAGE_PREFIX}:user-1`,
    );
  });

  it("uses an anonymous key when there is no user", () => {
    expect(onboardingStorageKey(null)).toBe(
      `${ONBOARDING_STORAGE_PREFIX}:anonymous`,
    );
    expect(onboardingStorageKey("  ")).toBe(
      `${ONBOARDING_STORAGE_PREFIX}:anonymous`,
    );
  });
});

describe("loadOnboardingCompleted", () => {
  it("reads a saved completion for the user", () => {
    const storage = memoryStorage({
      [onboardingStorageKey("user-1")]: ONBOARDING_COMPLETED_VALUE,
    });
    expect(loadOnboardingCompleted("user-1", storage)).toBe(true);
  });

  it("is false for missing or partial values", () => {
    const storage = memoryStorage({
      [onboardingStorageKey("user-1")]: "started",
    });
    expect(loadOnboardingCompleted("user-1", storage)).toBe(false);
    expect(loadOnboardingCompleted("user-2", storage)).toBe(false);
  });

  it("is false when storage is unavailable or throws", () => {
    const storage: OnboardingStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: vi.fn(),
    };
    expect(loadOnboardingCompleted("user-1", null)).toBe(false);
    expect(loadOnboardingCompleted("user-1", storage)).toBe(false);
  });
});

describe("saveOnboardingCompleted", () => {
  it("saves the completion under the user's key", () => {
    const storage = memoryStorage();
    saveOnboardingCompleted("user-1", storage);
    expect(storage.values[onboardingStorageKey("user-1")]).toBe(
      ONBOARDING_COMPLETED_VALUE,
    );
  });

  it("dispatches a change event", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });

    saveOnboardingCompleted("user-1", memoryStorage());

    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: ONBOARDING_CHANGE_EVENT }),
    );
  });

  it("does nothing without storage", () => {
    expect(() => saveOnboardingCompleted("user-1", null)).not.toThrow();
  });
});
