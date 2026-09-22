import { isOk, type Result } from "./result";

/**
 * One of the familiar async UI states, as a discriminated union so the guards
 * below narrow without extra casts:
 * - `loading` — the fetch is in flight (no data, no error)
 * - `ready` — the fetch resolved (data available)
 * - `error` — the fetch failed (error available)
 */
export type LoadingState<T, E = unknown> =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: T; error: null }
  | { status: "error"; data: null; error: E };

/** The initial state before an async fetch resolves. */
export function loading<T = never, E = unknown>(): LoadingState<T, E> {
  return { status: "loading", data: null, error: null };
}

/** The state produced when an async fetch resolves with data. */
export function ready<T, E = unknown>(data: T): LoadingState<T, E> {
  return { status: "ready", data, error: null };
}

/** The state produced when an async fetch fails. */
export function failed<T = never, E = unknown>(error: E): LoadingState<T, E> {
  return { status: "error", data: null, error };
}

/** Map a `Result<T>` to the matching loading state (ready or error). */
export function fromResult<T, E = unknown>(
  result: Result<T, E>,
): LoadingState<T, E> {
  return isOk(result) ? ready<T, E>(result.data) : failed<T, E>(result.error);
}

/** True when the state is loading (fetch in flight). */
export function isLoading<T, E>(
  state: LoadingState<T, E>,
): state is { status: "loading"; data: null; error: null } {
  return state.status === "loading";
}

/** True when the state is ready and carries data. */
export function isReady<T, E>(
  state: LoadingState<T, E>,
): state is { status: "ready"; data: T; error: null } {
  return state.status === "ready";
}

/** True when the state is a failure and carries an error. */
export function isError<T, E>(
  state: LoadingState<T, E>,
): state is { status: "error"; data: null; error: E } {
  return state.status === "error";
}