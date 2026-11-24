// ─── ResultLike ───────────────────────────────────────────────────────────────

/**
 * Minimal asynchronous result contract the SDK facade delegates to.
 *
 * Plugins implement this backed by neverthrow, Effect, plain promises, or any
 * other result library. The generated SDK only depends on this interface.
 */
export interface ResultLike<T, E> {
  match<A>(ok: (value: T) => A, err: (error: E) => A): Promise<A>;
  map<U>(fn: (value: T) => U): ResultLike<U, E>;
  mapErr<F>(fn: (error: E) => F): ResultLike<T, F>;
  andThen<U, F>(fn: (value: T) => ResultLike<U, F>): ResultLike<U, E | F>;
  orElse<U, F>(fn: (error: E) => ResultLike<U, F>): ResultLike<T | U, F>;
}

// ─── ResultBackend ────────────────────────────────────────────────────────────

/**
 * Result creation capability. A plugin that wants to change how the SDK
 * handles returns provides one of these.
 */
export interface ResultBackend {
  readonly name: string;
  fromPromise<T, E>(
    promise: Promise<T>,
    mapError: (error: unknown) => E,
  ): ResultLike<T, E>;
  ok<T, E = never>(value: T): ResultLike<T, E>;
  err<T = never, E = unknown>(error: E): ResultLike<T, E>;
}

// ─── Default plain-promise backend ────────────────────────────────────────────

type Outcome<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

class DefaultResult<T, E> implements ResultLike<T, E> {
  constructor(private readonly _outcome: Promise<Outcome<T, E>>) {}

  match<A>(ok: (value: T) => A, err: (error: E) => A): Promise<A> {
    return this._outcome.then<A>((outcome) => {
      if ("value" in outcome) return ok(outcome.value);
      return err(outcome.error);
    });
  }

  map<U>(fn: (value: T) => U): ResultLike<U, E> {
    return new DefaultResult<U, E>(
      this._outcome.then<Outcome<U, E>>((outcome) => {
        if ("error" in outcome) {
          return { ok: false as const, error: outcome.error };
        }
        return { ok: true as const, value: fn(outcome.value) };
      }),
    );
  }

  mapErr<F>(fn: (error: E) => F): ResultLike<T, F> {
    return new DefaultResult<T, F>(
      this._outcome.then<Outcome<T, F>>((outcome) => {
        if ("value" in outcome) {
          return { ok: true as const, value: outcome.value };
        }
        return { ok: false as const, error: fn(outcome.error) };
      }),
    );
  }

  andThen<U, F>(fn: (value: T) => ResultLike<U, F>): ResultLike<U, E | F> {
    return new DefaultResult<U, E | F>(
      this._outcome.then<Outcome<U, E | F>>((outcome) => {
        if ("error" in outcome) {
          return { ok: false as const, error: outcome.error };
        }
        return fn(outcome.value).match<Outcome<U, F>>(
          (value) => ({ ok: true as const, value }),
          (error) => ({ ok: false as const, error }),
        );
      }),
    );
  }

  orElse<U, F>(fn: (error: E) => ResultLike<U, F>): ResultLike<T | U, F> {
    return new DefaultResult<T | U, F>(
      this._outcome.then<Outcome<T | U, F>>((outcome) => {
        if ("value" in outcome) {
          return { ok: true as const, value: outcome.value };
        }
        return fn(outcome.error).match<Outcome<U, F>>(
          (value) => ({ ok: true as const, value }),
          (error) => ({ ok: false as const, error }),
        );
      }),
    );
  }
}

/**
 * Zero-dependency result backend used when no result plugin is installed.
 * The public API is still SdkResultAsync; this only controls the plumbing.
 */
export const defaultResultBackend: ResultBackend = {
  name: "default",
  fromPromise<T, E>(
    promise: Promise<T>,
    mapError: (error: unknown) => E,
  ): ResultLike<T, E> {
    return new DefaultResult<T, E>(
      promise.then(
        (value) => ({ ok: true as const, value }),
        (error) => ({ ok: false as const, error: mapError(error) }),
      ),
    );
  },
  ok<T, E = never>(value: T): ResultLike<T, E> {
    return new DefaultResult<T, E>(
      Promise.resolve({ ok: true as const, value }),
    );
  },
  err<T = never, E = unknown>(error: E): ResultLike<T, E> {
    return new DefaultResult<T, E>(
      Promise.resolve({ ok: false as const, error }),
    );
  },
};
