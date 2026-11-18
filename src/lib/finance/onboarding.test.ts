import { describe, expect, it } from "vitest";
import {
  isFirstRun,
  nextOnboardingStep,
  ONBOARDING_STEP_COUNT,
  ONBOARDING_STEP_IDS,
  previousOnboardingStep,
} from "./onboarding";

const empty = { transactions: [], categories: [], budgets: [] };

describe("isFirstRun", () => {
  it("is true when the account has no data", () => {
    expect(isFirstRun(empty)).toBe(true);
  });

  it("is false as soon as any kind of row exists", () => {
    expect(isFirstRun({ ...empty, transactions: [{}] })).toBe(false);
    expect(isFirstRun({ ...empty, categories: [{}] })).toBe(false);
    expect(isFirstRun({ ...empty, budgets: [{}] })).toBe(false);
  });

  it("is false while data is unavailable", () => {
    expect(isFirstRun(null)).toBe(false);
    expect(isFirstRun(undefined)).toBe(false);
  });
});

describe("onboarding steps", () => {
  it("describes the guided setup in order", () => {
    expect(ONBOARDING_STEP_IDS).toEqual(["welcome", "categories", "ready"]);
    expect(ONBOARDING_STEP_COUNT).toBe(3);
  });

  it("advances one step and stops at the end", () => {
    expect(nextOnboardingStep(0)).toBe(1);
    expect(nextOnboardingStep(1)).toBe(2);
    expect(nextOnboardingStep(2)).toBe(2);
    expect(nextOnboardingStep(99)).toBe(2);
  });

  it("goes back one step and stops at the start", () => {
    expect(previousOnboardingStep(2)).toBe(1);
    expect(previousOnboardingStep(1)).toBe(0);
    expect(previousOnboardingStep(0)).toBe(0);
    expect(previousOnboardingStep(-5)).toBe(0);
  });

  it("falls back to the first step for invalid indexes", () => {
    expect(nextOnboardingStep(Number.NaN)).toBe(1);
    expect(previousOnboardingStep(Number.NaN)).toBe(0);
    expect(nextOnboardingStep(1.9)).toBe(2);
  });
});
