import { describe, expect, it } from "vitest";
import { goalProgress, summarizeGoals } from "./goals";

describe("goalProgress", () => {
  it("reports saved, remaining and percent part-way through a goal", () => {
    expect(goalProgress({ savedAmount: 120000, targetAmount: 500000 })).toEqual({
      saved: 120000,
      target: 500000,
      remaining: 380000,
      percent: 24,
      completed: false,
    });
  });

  it("starts at zero for a brand new goal", () => {
    expect(goalProgress({ savedAmount: 0, targetAmount: 250000 })).toEqual({
      saved: 0,
      target: 250000,
      remaining: 250000,
      percent: 0,
      completed: false,
    });
  });

  it("completes exactly at the target", () => {
    expect(goalProgress({ savedAmount: 250000, targetAmount: 250000 })).toEqual({
      saved: 250000,
      target: 250000,
      remaining: 0,
      percent: 100,
      completed: true,
    });
  });

  it("caps an over-saved goal at 100 percent with no remainder", () => {
    expect(goalProgress({ savedAmount: 300000, targetAmount: 250000 })).toEqual({
      saved: 300000,
      target: 250000,
      remaining: 0,
      percent: 100,
      completed: true,
    });
  });

  it("rounds the percentage to the nearest whole number", () => {
    expect(goalProgress({ savedAmount: 1, targetAmount: 3 }).percent).toBe(33);
    expect(goalProgress({ savedAmount: 2, targetAmount: 3 }).percent).toBe(67);
  });

  it("never reports progress for a zero target", () => {
    expect(goalProgress({ savedAmount: 0, targetAmount: 0 })).toEqual({
      saved: 0,
      target: 0,
      remaining: 0,
      percent: 0,
      completed: false,
    });
  });

  it("rounds fractional cents and treats non-positive input as zero", () => {
    expect(
      goalProgress({ savedAmount: 1234.6, targetAmount: 10000 }),
    ).toEqual({
      saved: 1235,
      target: 10000,
      remaining: 8765,
      percent: 12,
      completed: false,
    });
    expect(goalProgress({ savedAmount: -500, targetAmount: 1000 })).toEqual({
      saved: 0,
      target: 1000,
      remaining: 1000,
      percent: 0,
      completed: false,
    });
  });

  it("treats non-finite amounts as zero", () => {
    expect(
      goalProgress({ savedAmount: Number.NaN, targetAmount: Number.POSITIVE_INFINITY }),
    ).toEqual({
      saved: 0,
      target: 0,
      remaining: 0,
      percent: 0,
      completed: false,
    });
  });

  it("does not mutate the input", () => {
    const goal = { savedAmount: 120000, targetAmount: 500000 };

    goalProgress(goal);

    expect(goal).toEqual({ savedAmount: 120000, targetAmount: 500000 });
  });
});

describe("summarizeGoals", () => {
  const goals = [
    { savedAmount: 120000, targetAmount: 500000 },
    { savedAmount: 80000, targetAmount: 100000 },
    { savedAmount: 150000, targetAmount: 150000 },
  ];

  it("adds up saved, target and remaining across every goal", () => {
    expect(summarizeGoals(goals)).toEqual({
      saved: 350000,
      target: 750000,
      remaining: 400000,
      percent: 47,
      tracked: 3,
      completedCount: 1,
    });
  });

  it("counts every goal that has reached its target", () => {
    const totals = summarizeGoals([
      { savedAmount: 100000, targetAmount: 100000 },
      { savedAmount: 250000, targetAmount: 200000 },
      { savedAmount: 1000, targetAmount: 50000 },
    ]);

    expect(totals.completedCount).toBe(2);
  });

  it("caps the overall percentage when goals are over-saved", () => {
    expect(
      summarizeGoals([{ savedAmount: 120000, targetAmount: 100000 }]),
    ).toEqual({
      saved: 120000,
      target: 100000,
      remaining: 0,
      percent: 100,
      tracked: 1,
      completedCount: 1,
    });
  });

  it("totals to zero for no goals", () => {
    expect(summarizeGoals([])).toEqual({
      saved: 0,
      target: 0,
      remaining: 0,
      percent: 0,
      tracked: 0,
      completedCount: 0,
    });
  });

  it("reports zero percent when no goal has a target", () => {
    expect(summarizeGoals([{ savedAmount: 5000, targetAmount: 0 }])).toEqual({
      saved: 5000,
      target: 0,
      remaining: 0,
      percent: 0,
      tracked: 1,
      completedCount: 0,
    });
  });

  it("does not mutate the goals it is given", () => {
    const input = [{ savedAmount: 120000, targetAmount: 500000 }];

    summarizeGoals(input);

    expect(input[0]).toEqual({ savedAmount: 120000, targetAmount: 500000 });
  });
});
