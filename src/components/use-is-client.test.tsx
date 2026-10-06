import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsClient } from "./use-is-client";

describe("useIsClient", () => {
  it("reports the client as hydrated", () => {
    const { result } = renderHook(() => useIsClient());
    expect(result.current).toBe(true);
  });

  it("stays hydrated across re-renders", () => {
    const { result, rerender } = renderHook(() => useIsClient());
    rerender();
    expect(result.current).toBe(true);
  });
});
