import { describe, expect, it } from "vitest";
import { BAR_COUNT, createChartBars } from "./chart-scene";

describe("createChartBars", () => {
  it("creates the requested number of bars by default", () => {
    expect(createChartBars()).toHaveLength(BAR_COUNT);
    expect(createChartBars(4)).toHaveLength(4);
  });

  it("keeps every bar height inside the decorative range", () => {
    for (const bar of createChartBars(40)) {
      expect(bar.height).toBeGreaterThanOrEqual(0.6);
      expect(bar.height).toBeLessThanOrEqual(2.0);
    }
  });

  it("is deterministic for a given random source", () => {
    const random = () => 0.75;
    expect(createChartBars(5, random)).toEqual(createChartBars(5, random));
  });
});