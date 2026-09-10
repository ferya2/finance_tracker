import { describe, expect, it } from "vitest";
import {
  initialSessionState,
  sessionReducer,
  toAuthUser,
  type SessionAction,
} from "./session";

describe("initialSessionState", () => {
  it("starts in a loading state with no user", () => {
    expect(initialSessionState).toEqual({ status: "loading", user: null });
  });
});

describe("sessionReducer", () => {
  it("returns the initial state for setLoading", () => {
    const state = {
      status: "signedIn" as const,
      user: { id: "user-1", email: "ada@example.com" },
    };
    expect(sessionReducer(state, { type: "setLoading" })).toEqual(
      initialSessionState,
    );
  });

  it("transitions to signedIn with the given user for setSession", () => {
    const action: SessionAction = {
      type: "setSession",
      user: { id: "user-1", email: "ada@example.com" },
    };
    expect(sessionReducer(initialSessionState, action)).toEqual({
      status: "signedIn",
      user: { id: "user-1", email: "ada@example.com" },
    });
  });

  it("transitions to signedOut when setSession carries no user", () => {
    expect(
      sessionReducer(initialSessionState, { type: "setSession", user: null }),
    ).toEqual({ status: "signedOut", user: null });
  });

  it("wipes the user and transitions to signedOut for signOut", () => {
    const state = {
      status: "signedIn" as const,
      user: { id: "user-1", email: "ada@example.com" },
    };
    expect(sessionReducer(state, { type: "signOut" })).toEqual({
      status: "signedOut",
      user: null,
    });
  });

  it("ignores unknown actions", () => {
    const state = {
      status: "signedOut" as const,
      user: null,
    };
    expect(sessionReducer(state, { type: "unknown" } as SessionAction)).toBe(
      state,
    );
  });
});

describe("toAuthUser", () => {
  it("keeps the id and email of the user", () => {
    expect(
      toAuthUser({ id: "user-1", email: "ada@example.com" }),
    ).toEqual({ id: "user-1", email: "ada@example.com" });
  });

  it("omits the email property when it is missing", () => {
    expect(toAuthUser({ id: "user-1" })).toEqual({ id: "user-1" });
  });

  it("omits the email property when it is null", () => {
    expect(toAuthUser({ id: "user-1", email: null })).toEqual({ id: "user-1" });
  });
});