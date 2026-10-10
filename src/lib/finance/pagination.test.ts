import { describe, expect, it } from "vitest";
import { clampPage, countPages, paginate } from "./pagination";

const ITEMS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

describe("countPages", () => {
  it("is one page for an empty list", () => {
    expect(countPages(0, 10)).toBe(1);
  });

  it("rounds up any partial last page", () => {
    expect(countPages(11, 10)).toBe(2);
  });

  it("splits evenly when the list fills the pages exactly", () => {
    expect(countPages(20, 10)).toBe(2);
  });

  it("is one page when everything fits", () => {
    expect(countPages(9, 10)).toBe(1);
  });

  it("guards against a non-positive page size", () => {
    // A non-positive page size falls back to one item per page.
    expect(countPages(5, 0)).toBe(5);
    expect(countPages(5, -3)).toBe(5);
  });
});

describe("clampPage", () => {
  it("keeps a page inside the range", () => {
    expect(clampPage(1, 25, 10)).toBe(1);
    expect(clampPage(2, 25, 10)).toBe(2);
    expect(clampPage(3, 25, 10)).toBe(3);
  });

  it("clamps page zero up to the first page", () => {
    expect(clampPage(0, 25, 10)).toBe(1);
  });

  it("clamps a negative page up to the first page", () => {
    expect(clampPage(-4, 25, 10)).toBe(1);
  });

  it("clamps a page past the end down to the last page", () => {
    expect(clampPage(9, 25, 10)).toBe(3);
  });

  it("settles on the first page for a non-numeric page", () => {
    expect(clampPage(Number.NaN, 25, 10)).toBe(1);
  });

  it("settles on the first page for an empty list", () => {
    expect(clampPage(5, 0, 10)).toBe(1);
  });
});

describe("paginate", () => {
  it("takes the slice for the requested page", () => {
    expect(paginate(ITEMS, 1, 4)).toEqual([0, 1, 2, 3]);
    expect(paginate(ITEMS, 2, 4)).toEqual([4, 5, 6, 7]);
  });

  it("gives the shorter last page the remainder", () => {
    expect(paginate(ITEMS, 3, 4)).toEqual([8, 9]);
  });

  it("clamps a page past the end to the last page", () => {
    expect(paginate(ITEMS, 9, 4)).toEqual([8, 9]);
  });

  it("clamps page zero to the first page", () => {
    expect(paginate(ITEMS, 0, 4)).toEqual([0, 1, 2, 3]);
  });

  it("handles a list that exactly fills the pages", () => {
    expect(paginate(ITEMS, 1, 5)).toEqual([0, 1, 2, 3, 4]);
    expect(paginate(ITEMS, 2, 5)).toEqual([5, 6, 7, 8, 9]);
  });

  it("returns an empty slice for an empty list", () => {
    expect(paginate([], 1, 4)).toEqual([]);
    expect(paginate([], 7, 4)).toEqual([]);
  });

  it("does not mutate the rows it was given", () => {
    const before = [...ITEMS];

    paginate(ITEMS, 2, 4);

    expect(ITEMS).toEqual(before);
  });
});