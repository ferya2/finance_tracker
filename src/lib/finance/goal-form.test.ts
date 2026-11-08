import { describe, expect, it } from "vitest";
import type { NewSavingsGoal, SavingsGoal } from "@/types/goal";
import {
  DEFAULT_GOAL_COLOR,
  emptyGoalForm,
  goalToFormValues,
  isSavingsGoal,
  sanitizeSavingsGoals,
  toNewGoal,
  validateGoalForm,
  validateGoalInput,
} from "./goal-form";

const GOAL: SavingsGoal = {
  id: "goal-1",
  name: "Holiday",
  savedAmount: 120000,
  targetAmount: 500000,
  targetDate: "2027-06-01",
  color: "#2563eb",
};

describe("emptyGoalForm", () => {
  it("starts blank with the default colour", () => {
    expect(emptyGoalForm()).toEqual({
      name: "",
      savedAmount: "",
      targetAmount: "",
      targetDate: "",
      color: DEFAULT_GOAL_COLOR,
    });
  });

  it("accepts a chosen colour", () => {
    expect(emptyGoalForm("#e11d48").color).toBe("#e11d48");
  });
});

describe("goalToFormValues", () => {
  it("formats the stored cents back into amount inputs", () => {
    expect(goalToFormValues(GOAL)).toEqual({
      name: "Holiday",
      savedAmount: "1200",
      targetAmount: "5000",
      targetDate: "2027-06-01",
      color: "#2563eb",
    });
  });

  it("handles a missing date and colour", () => {
    const goal: SavingsGoal = {
      id: "goal-2",
      name: "Buffer",
      savedAmount: 5,
      targetAmount: 1000,
    };

    expect(goalToFormValues(goal)).toEqual({
      name: "Buffer",
      savedAmount: "0.05",
      targetAmount: "10",
      targetDate: "",
      color: DEFAULT_GOAL_COLOR,
    });
  });
});

describe("toNewGoal", () => {
  it("parses amounts into cents and trims the name", () => {
    expect(
      toNewGoal({
        name: "  New laptop  ",
        savedAmount: "1,234.56",
        targetAmount: "2500",
        targetDate: " 2027-01-15 ",
        color: "#7c3aed",
      }),
    ).toEqual({
      name: "New laptop",
      savedAmount: 123456,
      targetAmount: 250000,
      targetDate: "2027-01-15",
      color: "#7c3aed",
    });
  });

  it("treats a blank saved amount as zero and drops an empty date", () => {
    expect(
      toNewGoal({
        name: "Camera",
        savedAmount: "",
        targetAmount: "800",
        targetDate: "",
        color: "#0d9488",
      }),
    ).toEqual({
      name: "Camera",
      savedAmount: 0,
      targetAmount: 80000,
      color: "#0d9488",
    });
  });
});

describe("validateGoalForm", () => {
  const valid = {
    name: "Holiday",
    savedAmount: "1200",
    targetAmount: "5000",
    targetDate: "2027-06-01",
    color: "#2563eb",
  };

  it("accepts a complete goal", () => {
    expect(validateGoalForm(valid)).toEqual({});
  });

  it("requires a name within the length limit", () => {
    expect(validateGoalForm({ ...valid, name: "   " }).name).toBe(
      "Name is required.",
    );
    expect(
      validateGoalForm({ ...valid, name: "x".repeat(61) }).name,
    ).toContain("at most 60");
  });

  it("requires a positive target amount", () => {
    expect(validateGoalForm({ ...valid, targetAmount: "" }).targetAmount).toBe(
      "Enter a valid target amount.",
    );
    expect(
      validateGoalForm({ ...valid, targetAmount: "abc" }).targetAmount,
    ).toBe("Enter a valid target amount.");
    expect(validateGoalForm({ ...valid, targetAmount: "0" }).targetAmount).toBe(
      "Target must be greater than zero.",
    );
  });

  it("allows a blank saved amount but rejects invalid or negative values", () => {
    expect(validateGoalForm({ ...valid, savedAmount: "" }).savedAmount).toBe(
      undefined,
    );
    expect(
      validateGoalForm({ ...valid, savedAmount: "lots" }).savedAmount,
    ).toBe("Enter a valid saved amount.");
    expect(
      validateGoalForm({ ...valid, savedAmount: "-5" }).savedAmount,
    ).toBe("Saved amount cannot be negative.");
  });

  it("allows an empty target date but rejects an unreal one", () => {
    expect(validateGoalForm({ ...valid, targetDate: "" }).targetDate).toBe(
      undefined,
    );
    expect(
      validateGoalForm({ ...valid, targetDate: "2027-02-30" }).targetDate,
    ).toBe("Target date must be a valid YYYY-MM-DD date.");
  });

  it("requires a palette colour", () => {
    expect(validateGoalForm({ ...valid, color: "blue" }).color).toBe(
      "Choose a valid colour.",
    );
  });
});

describe("validateGoalInput", () => {
  it("rejects non-integer and non-finite amounts", () => {
    const input: NewSavingsGoal = {
      name: "Goal",
      savedAmount: 1.5,
      targetAmount: Number.POSITIVE_INFINITY,
      color: "#2563eb",
    };

    expect(validateGoalInput(input)).toMatchObject({
      savedAmount: "Saved amount must be zero or more.",
      targetAmount: "Target must be greater than zero.",
    });
  });
});

describe("isSavingsGoal", () => {
  it("accepts a valid stored goal", () => {
    expect(isSavingsGoal(GOAL)).toBe(true);
  });

  it("rejects missing ids, bad amounts and bad dates", () => {
    expect(isSavingsGoal({ ...GOAL, id: "" })).toBe(false);
    expect(isSavingsGoal({ ...GOAL, targetAmount: 0 })).toBe(false);
    expect(isSavingsGoal({ ...GOAL, savedAmount: -1 })).toBe(false);
    expect(isSavingsGoal({ ...GOAL, targetDate: "tomorrow" })).toBe(false);
    expect(isSavingsGoal(null)).toBe(false);
  });
});

describe("sanitizeSavingsGoals", () => {
  it("keeps valid goals and drops invalid or duplicate ones", () => {
    const duplicate = { ...GOAL, name: "Duplicate" };
    const invalid = { ...GOAL, id: "goal-bad", targetAmount: 0 };

    expect(
      sanitizeSavingsGoals([GOAL, duplicate, invalid, "nope"]),
    ).toEqual([GOAL]);
  });

  it("returns nothing for a non-array payload", () => {
    expect(sanitizeSavingsGoals({ nope: true })).toEqual([]);
  });
});
