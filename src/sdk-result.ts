import { SdkKernel } from "./kernel/kernel";
import type { ErrorHandler, MatchContext } from "./kernel/match";
import type { ResultLike } from "./kernel/result";

// ─── Brand ────────────────────────────────────────────────────────────────────

/**
 * Cross-copy brand. Symbol.for keeps the check working when multiple copies of
 * @openapi-sdk-tools/core exist in an application.
 */
export const SDK_RESULT_BRAND: unique symbol = Symbol.for(
  "@openapi-sdk-tools/core/SdkResultAsync",
);

export function isSdkResult(
  value: unknown,
): value is SdkResultAsync<unknown, string, unknown> {
  return (
    typeof value === "object" && value !== null && SDK_RESULT_BRAND in value
  );
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface SdkResultOptions<TCode extends string = string> {
  discriminatorKey?: string[];
  declaredCodes?: readonly TCode[];
}

// ─── SdkResultAsync ───────────────────────────────────────────────────────────

/**
 * Public result facade returned by generated SDK methods.
 *
 * The facade is plugin-agnostic: `map`/`mapErr`/`andThen`/`orElse` delegate to
 * the plugin-provided ResultLike, and `.match()` delegates object handlers to
 * the kernel's MatchStrategy. Function handlers bypass the strategy and are
 * handled directly by the backend, which is the escape hatch for ts-pattern,
 * Effect Match, and custom matching.
 */
export class SdkResultAsync<
  T,
  TCode extends string = string,
  TError = unknown,
> {
  readonly [SDK_RESULT_BRAND] = true;

  constructor(
    readonly _result: ResultLike<T, TError>,
    private readonly _kernel: SdkKernel = new SdkKernel(),
    private readonly _options: SdkResultOptions<TCode> = {},
  ) {}

  /** Native result provided by the active backend. */
  get native(): ResultLike<T, TError> {
    return this._result;
  }

  match<A>(
    ok: (value: T) => A,
    handlers: ErrorHandler<TCode, TError, NoInfer<A>>,
  ): Promise<A> {
    if (typeof handlers === "function") {
      return this._result.match(ok, handlers);
    }

    const context: MatchContext<TCode, TError> = {
      declaredCodes: this._options.declaredCodes ?? [],
      discriminatorKey: this._options.discriminatorKey ?? ["code"],
    };

    return this._kernel.match.match(this._result, ok, handlers, context);
  }

  map<U>(f: (value: T) => U): SdkResultAsync<U, TCode, TError> {
    return new SdkResultAsync(this._result.map(f), this._kernel, this._options);
  }

  mapErr<F>(f: (error: TError) => F): SdkResultAsync<T, TCode, F> {
    return new SdkResultAsync(
      this._result.mapErr(f),
      this._kernel,
      this._options,
    );
  }

  andThen<U, F = never>(
    f: (value: T) => SdkResultAsync<U, TCode, F> | ResultLike<U, F>,
  ): SdkResultAsync<U, TCode, TError | F> {
    return new SdkResultAsync(
      this._result.andThen((value) => {
        const next = f(value);
        return (isSdkResult(next) ? next._result : next) as ResultLike<U, F>;
      }),
      this._kernel,
      this._options,
    );
  }

  orElse<F = never>(
    f: (error: TError) => SdkResultAsync<T, TCode, F> | ResultLike<T, F>,
  ): SdkResultAsync<T, TCode, F> {
    return new SdkResultAsync(
      this._result.orElse((error) => {
        const next = f(error);
        return (isSdkResult(next) ? next._result : next) as ResultLike<T, F>;
      }),
      this._kernel,
      this._options,
    );
  }
}
