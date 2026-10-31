import { describe, expect, it } from "vitest";
import type { RecurrenceFrequency } from "@/types/recurring";
import {
  isOccurrenceOn,
  nextOccurrence,
  occurrencesBetween,
  upcomingOccurrences,
  type RecurrenceSchedule,
} from "./recurring";

function makeSchedule(
  overrides: Partial<RecurrenceSchedule> = {},
): RecurrenceSchedule {
  return {
    startOn: "2026-09-01",
    frequency: "daily",
    interval: 1,
    ...overrides,
  };
}

describe("nextOccurrence", () => {
  it("returns the day after a daily occurrence", () => {
    expect(nextOccurrence(makeSchedule(), "2026-09-01")).toBe("2026-09-02");
  });

  it("returns the start date when asked from before the schedule", () => {
    expect(nextOccurrence(makeSchedule(), "2026-08-20")).toBe("2026-09-01");
  });

  it("returns the start date when asked the day before it", () => {
    expect(nextOccurrence(makeSchedule(), "2026-08-31")).toBe("2026-09-01");
  });

  it("honours a multi-day interval", () => {
    const schedule = makeSchedule({ interval: 3 });
    expect(nextOccurrence(schedule, "2026-09-01")).toBe("2026-09-04");
    expect(nextOccurrence(schedule, "2026-09-02")).toBe("2026-09-04");
    expect(nextOccurrence(schedule, "2026-09-04")).toBe("2026-09-07");
  });

  it("crosses month and year boundaries for daily schedules", () => {
    const schedule = makeSchedule({ startOn: "2026-12-30" });
    expect(nextOccurrence(schedule, "2026-12-30")).toBe("2026-12-31");
    expect(nextOccurrence(schedule, "2026-12-31")).toBe("2027-01-01");
  });

  it("returns the next weekly occurrence", () => {
    const schedule = makeSchedule({ frequency: "weekly" });
    expect(nextOccurrence(schedule, "2026-09-01")).toBe("2026-09-08");
    expect(nextOccurrence(schedule, "2026-09-02")).toBe("2026-09-08");
  });

  it("honours a multi-week interval", () => {
    const schedule = makeSchedule({ frequency: "weekly", interval: 2 });
    expect(nextOccurrence(schedule, "2026-09-01")).toBe("2026-09-15");
    expect(nextOccurrence(schedule, "2026-09-15")).toBe("2026-09-29");
  });

  it("returns the next monthly occurrence", () => {
    const schedule = makeSchedule({
      frequency: "monthly",
      startOn: "2026-11-15",
    });
    expect(nextOccurrence(schedule, "2026-11-15")).toBe("2026-12-15");
    expect(nextOccurrence(schedule, "2026-12-15")).toBe("2027-01-15");
  });

  it("clamps a month-end schedule to the target month's last day", () => {
    const schedule = makeSchedule({
      frequency: "monthly",
      startOn: "2026-01-31",
    });
    expect(nextOccurrence(schedule, "2026-01-31")).toBe("2026-02-28");
    expect(nextOccurrence(schedule, "2026-02-28")).toBe("2026-03-31");
    expect(nextOccurrence(schedule, "2026-03-31")).toBe("2026-04-30");
    expect(nextOccurrence(schedule, "2026-04-30")).toBe("2026-05-31");
  });

  it("clamps to Feb 29 in a leap year", () => {
    const schedule = makeSchedule({
      frequency: "monthly",
      startOn: "2024-01-31",
    });
    expect(nextOccurrence(schedule, "2024-01-31")).toBe("2024-02-29");
    expect(nextOccurrence(schedule, "2024-02-29")).toBe("2024-03-31");
  });

  it("honours a multi-month interval", () => {
    const schedule = makeSchedule({
      frequency: "monthly",
      startOn: "2026-01-31",
      interval: 2,
    });
    expect(nextOccurrence(schedule, "2026-01-31")).toBe("2026-03-31");
    expect(nextOccurrence(schedule, "2026-02-01")).toBe("2026-03-31");
    expect(nextOccurrence(schedule, "2026-03-31")).toBe("2026-05-31");
  });

  it("returns the next yearly occurrence", () => {
    const schedule = makeSchedule({
      frequency: "yearly",
      startOn: "2026-09-01",
    });
    expect(nextOccurrence(schedule, "2026-09-01")).toBe("2027-09-01");
  });

  it("keeps Feb 29 yearly plans anchored to leap years", () => {
    const schedule = makeSchedule({
      frequency: "yearly",
      startOn: "2024-02-29",
    });
    expect(nextOccurrence(schedule, "2024-02-29")).toBe("2025-02-28");
    expect(nextOccurrence(schedule, "2025-02-28")).toBe("2026-02-28");
    expect(nextOccurrence(schedule, "2027-02-28")).toBe("2028-02-29");
  });

  it("honours a multi-year interval", () => {
    const schedule = makeSchedule({
      frequency: "yearly",
      startOn: "2024-02-29",
      interval: 2,
    });
    expect(nextOccurrence(schedule, "2024-02-29")).toBe("2026-02-28");
    expect(nextOccurrence(schedule, "2026-02-28")).toBe("2028-02-29");
  });

  it("returns null once the schedule has passed its end date", () => {
    const schedule = makeSchedule({ endOn: "2026-09-03" });
    expect(nextOccurrence(schedule, "2026-09-02")).toBe("2026-09-03");
    expect(nextOccurrence(schedule, "2026-09-03")).toBeNull();
  });

  it("includes an end date that is itself an occurrence", () => {
    const schedule = makeSchedule({
      frequency: "monthly",
      startOn: "2026-01-31",
      endOn: "2026-02-28",
    });
    expect(nextOccurrence(schedule, "2026-01-31")).toBe("2026-02-28");
    expect(nextOccurrence(schedule, "2026-02-28")).toBeNull();
  });

  it("ignores an unparseable end date", () => {
    const schedule = makeSchedule({ endOn: "not-a-date" });
    expect(nextOccurrence(schedule, "2026-09-01")).toBe("2026-09-02");
  });

  it("returns null for invalid start or reference dates", () => {
    expect(nextOccurrence(makeSchedule({ startOn: "2026-02-30" }), "2026-01-01")).toBeNull();
    expect(nextOccurrence(makeSchedule({ startOn: "01/09/2026" }), "2026-01-01")).toBeNull();
    expect(nextOccurrence(makeSchedule(), "2026-13-01")).toBeNull();
    expect(nextOccurrence(makeSchedule(), "not-a-date")).toBeNull();
  });

  it("returns null for an interval below one or not finite", () => {
    expect(nextOccurrence(makeSchedule({ interval: 0 }), "2026-09-01")).toBeNull();
    expect(nextOccurrence(makeSchedule({ interval: -2 }), "2026-09-01")).toBeNull();
    expect(nextOccurrence(makeSchedule({ interval: Number.NaN }), "2026-09-01")).toBeNull();
  });

  it("returns null for an unknown frequency", () => {
    const schedule = makeSchedule({
      frequency: "hourly" as unknown as RecurrenceFrequency,
    });
    expect(nextOccurrence(schedule, "2026-09-01")).toBeNull();
  });

  it("does not mutate the schedule it was given", () => {
    const schedule = makeSchedule({ frequency: "monthly", startOn: "2026-01-31" });
    nextOccurrence(schedule, "2026-01-31");
    expect(schedule).toEqual({
      startOn: "2026-01-31",
      frequency: "monthly",
      interval: 1,
    });
  });
});

describe("occurrencesBetween", () => {
  it("includes both ends of an inclusive daily range", () => {
    expect(occurrencesBetween(makeSchedule(), "2026-09-01", "2026-09-05")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
    ]);
  });

  it("starts at the first occurrence on or after the range start", () => {
    expect(occurrencesBetween(makeSchedule(), "2026-09-02", "2026-09-04")).toEqual([
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
    ]);
  });

  it("returns a single occurrence for a one-day range", () => {
    expect(occurrencesBetween(makeSchedule(), "2026-09-01", "2026-09-01")).toEqual([
      "2026-09-01",
    ]);
  });

  it("returns nothing for a one-day range that is not an occurrence", () => {
    const schedule = makeSchedule({ interval: 2 });
    expect(occurrencesBetween(schedule, "2026-09-02", "2026-09-02")).toEqual([]);
  });

  it("handles monthly clamping inside a range", () => {
    const schedule = makeSchedule({
      frequency: "monthly",
      startOn: "2026-01-31",
    });
    expect(occurrencesBetween(schedule, "2026-01-01", "2026-04-30")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });

  it("handles a multi-week interval", () => {
    const schedule = makeSchedule({ frequency: "weekly", interval: 2 });
    expect(occurrencesBetween(schedule, "2026-09-01", "2026-09-20")).toEqual([
      "2026-09-01",
      "2026-09-15",
    ]);
  });

  it("stops at the schedule's end date", () => {
    const schedule = makeSchedule({ endOn: "2026-09-03" });
    expect(occurrencesBetween(schedule, "2026-09-01", "2026-09-10")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("returns nothing when the range ends before the schedule starts", () => {
    expect(occurrencesBetween(makeSchedule(), "2026-08-01", "2026-08-31")).toEqual([]);
  });

  it("returns nothing for invalid or inverted ranges", () => {
    expect(occurrencesBetween(makeSchedule(), "2026-09-05", "2026-09-01")).toEqual([]);
    expect(occurrencesBetween(makeSchedule(), "2026-13-01", "2026-09-05")).toEqual([]);
    expect(occurrencesBetween(makeSchedule(), "2026-09-01", "nope")).toEqual([]);
  });
});

describe("upcomingOccurrences", () => {
  it("returns the requested number of future occurrences", () => {
    expect(upcomingOccurrences(makeSchedule(), "2026-09-01", 3)).toEqual([
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
    ]);
  });

  it("includes the start date when asking from before the schedule", () => {
    expect(upcomingOccurrences(makeSchedule(), "2026-08-30", 2)).toEqual([
      "2026-09-01",
      "2026-09-02",
    ]);
  });

  it("stops early when the schedule ends", () => {
    const schedule = makeSchedule({ endOn: "2026-09-03" });
    expect(upcomingOccurrences(schedule, "2026-09-01", 5)).toEqual([
      "2026-09-02",
      "2026-09-03",
    ]);
  });

  it("returns nothing for a non-positive or non-finite count", () => {
    expect(upcomingOccurrences(makeSchedule(), "2026-09-01", 0)).toEqual([]);
    expect(upcomingOccurrences(makeSchedule(), "2026-09-01", -1)).toEqual([]);
    expect(upcomingOccurrences(makeSchedule(), "2026-09-01", Number.NaN)).toEqual([]);
  });

  it("returns nothing for an invalid reference date", () => {
    expect(upcomingOccurrences(makeSchedule(), "nope", 3)).toEqual([]);
  });
});

describe("isOccurrenceOn", () => {
  it("recognises the start date and later occurrences", () => {
    const schedule = makeSchedule({ interval: 2 });
    expect(isOccurrenceOn(schedule, "2026-09-01")).toBe(true);
    expect(isOccurrenceOn(schedule, "2026-09-03")).toBe(true);
    expect(isOccurrenceOn(schedule, "2026-09-05")).toBe(true);
  });

  it("rejects days between occurrences", () => {
    const schedule = makeSchedule({ interval: 2 });
    expect(isOccurrenceOn(schedule, "2026-09-02")).toBe(false);
    expect(isOccurrenceOn(schedule, "2026-09-04")).toBe(false);
  });

  it("rejects dates before the schedule starts", () => {
    expect(isOccurrenceOn(makeSchedule(), "2026-08-31")).toBe(false);
  });

  it("recognises clamped month-end occurrences", () => {
    const schedule = makeSchedule({
      frequency: "monthly",
      startOn: "2026-01-31",
    });
    expect(isOccurrenceOn(schedule, "2026-01-31")).toBe(true);
    expect(isOccurrenceOn(schedule, "2026-02-28")).toBe(true);
    expect(isOccurrenceOn(schedule, "2026-03-31")).toBe(true);
    expect(isOccurrenceOn(schedule, "2026-04-30")).toBe(true);
    expect(isOccurrenceOn(schedule, "2026-03-01")).toBe(false);
    expect(isOccurrenceOn(schedule, "2026-05-30")).toBe(false);
  });

  it("rejects dates after the schedule's end", () => {
    const schedule = makeSchedule({ endOn: "2026-09-03" });
    expect(isOccurrenceOn(schedule, "2026-09-03")).toBe(true);
    expect(isOccurrenceOn(schedule, "2026-09-04")).toBe(false);
  });

  it("rejects invalid dates", () => {
    expect(isOccurrenceOn(makeSchedule(), "2026-02-30")).toBe(false);
    expect(isOccurrenceOn(makeSchedule(), "not-a-date")).toBe(false);
  });
});
