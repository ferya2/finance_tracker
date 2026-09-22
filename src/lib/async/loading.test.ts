import { describe, expect, it } from "vitest";
import { fail, ok, type Result } from "./result";
import {
  failed,
  fromResult,
  isError,
  isLoading,
  isReady,
  loading,
  ready,
  type LoadingState,
} from "./loading";

describe("loading helpers", () => {
  it("loading builds the initial state with no data or error", () => {
    expect(loading()).toEqual({ status: "loading", data: null, error: null });
  });

  it("ready builds a ready state carrying data", () => {
    expect(ready(10)).toEqual({ status: "ready", data: 10, error: null });
  });

  it("failed builds an error state carrying the error", () => {
    const err = new Error("boom");
    expect(failed(err)).toEqual({ status: "error", data: null, error: err });
  });

  it("fromResult maps a success result to ready", () => {
    const result: Result<number> = ok(5);
    expect(fromResult(result)).toEqual({
      status: "ready",
      data: 5,
      error: null,
    });
  });

  it("fromResult maps a failure result to error", () => {
    const err = new Error("boom");
    const result: Result<number> = fail(err);
    expect(fromResult(result)).toEqual({ status: "error", data: null, error: err });
  });

  it("isLoading narrows only the loading state", () => {
    const state: LoadingState<number> = loading();
    expect(isLoading(state)).toBe(true);
    expect(isReady(state)).toBe(false);
    expect(isError(state)).toBe(false);
  });

  it("isReady narrows the ready state so the data is accessible", () => {
    const state: LoadingState<string> = ready("done");
    expect(isReady(state)).toBe(true);
    if (isReady(state)) {
      expect(state.data).toBe("done");
    }
  });

  it("isError narrows the error state so the error is accessible", () => {
    const err = new Error("boom");
    const state: LoadingState<number> = failed(err);
    expect(isError(state)).toBe(true);
    if (isError(state)) {
      expect(state.error).toBe(err);
    }
  });
});