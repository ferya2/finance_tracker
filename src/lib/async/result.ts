/** A successful outcome — carries data, no error. */
export type OkResult<T> = {
  data: T;
  error: null;
};

/** A failed outcome — carries an error, no data. */
export type ErrResult<E> = {
  data: null;
  error: E;
};

/**
 * Generic `{ data, error }` outcome returned by async data access, matching
 * the shape already used across the Supabase layer. `E` defaults to `unknown`
 * so it works with plain `Error`s and PostgrestError alike.
 */
export type Result<T, E = unknown> = OkResult<T> | ErrResult<E>;

/** Build a successful result. */
export function ok<T>(data: T): OkResult<T> {
  return { data, error: null };
}

/** Build a failed result. */
export function fail<E = unknown>(error: E): ErrResult<E> {
  return { data: null, error };
}

/** True when the result succeeded and carries data. */
export function isOk<T, E>(result: Result<T, E>): result is OkResult<T> {
  return result.error === null;
}

/** True when the result failed and carries an error. */
export function isErr<T, E>(result: Result<T, E>): result is ErrResult<E> {
  return result.error !== null;
}