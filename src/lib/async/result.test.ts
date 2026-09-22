import { describe, expect, it } from "vitest";
import { fail, isErr, isOk, ok, type Result } from "./result";

describe("result", () => {
  it("ok builds a successful result with data and a null error", () => {
    expect(ok([1, 2])).toEqual({ data: [1, 2], error: null });
  });

  it("fail builds a failed result with null data and the error", () => {
    const err = new Error("boom");
    expect(fail(err)).toEqual({ data: null, error: err });
  });

  it("isOk returns true only for successful results", () => {
    expect(isOk(ok("data"))).toBe(true);
    expect(isOk(fail(new Error("boom")))).toBe(false);
  });

  it("isErr returns true only for failed results", () => {
    expect(isErr(fail(new Error("boom")))).toBe(true);
    expect(isErr(ok("data"))).toBe(false);
  });

  it("isOk narrows the result so the data is accessible", () => {
    const result: Result<string> = ok("payload");
    if (isOk(result)) {
      expect(result.data).toBe("payload");
    }
  });

  it("isErr narrows the result so the error is accessible", () => {
    const err = new Error("boom");
    const result: Result<string> = fail(err);
    if (isErr(result)) {
      expect(result.error).toBe(err);
    }
  });

  it("works with non-Error error values", () => {
    const result: Result<number, string> = fail("nope");
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBe("nope");
    }
  });
});