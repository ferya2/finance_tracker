import { describe, expect, it } from "vitest";
import { MAX_STAGGER_DELAY, WIDGET_CARD_CLASS, staggerDelay } from "./motion";

describe("staggerDelay", () => {
  it("starts at the base delay and steps once per item", () => {
    expect(staggerDelay(0)).toBe(0.05);
    expect(staggerDelay(1)).toBe(0.1);
    expect(staggerDelay(3, 0.1, 0)).toBeCloseTo(0.3);
  });

  it("caps the delay so long lists never crawl in", () => {
    expect(staggerDelay(99)).toBe(MAX_STAGGER_DELAY);
    expect(staggerDelay(20, 0.08, 0.1)).toBe(MAX_STAGGER_DELAY);
  });

  it("keeps every delay non-negative and finite", () => {
    expect(staggerDelay(-5)).toBe(0.05);
    expect(staggerDelay(1.9)).toBe(staggerDelay(1));
    expect(staggerDelay(Number.NaN)).toBe(0.05);
    expect(staggerDelay(Number.POSITIVE_INFINITY)).toBe(0.05);
  });
});

describe("WIDGET_CARD_CLASS", () => {
  it("keeps cards responsive and honours reduced motion", () => {
    expect(WIDGET_CARD_CLASS).toContain("p-5");
    expect(WIDGET_CARD_CLASS).toContain("sm:p-6");
    expect(WIDGET_CARD_CLASS).toContain("motion-reduce:transition-none");
  });
});