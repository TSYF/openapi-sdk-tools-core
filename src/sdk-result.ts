import { ResultAsync } from "neverthrow";
import type { ExhaustiveErrorHandler, ErrorMatchContext } from "./match-patch";
import { STATUS_TO_CODE_MAP } from "./maps";
import { __SDK_UNDECLARED_ERROR__ } from "./types";

// ─── Path-array lookup helper ───────────────────────────────────────────────────

function getDiscriminantFromPath(
  error: unknown,
  path: string[],
): string | undefined {
  if (!path || path.length === 0) return undefined;
  let current: unknown = error;
  for (const segment of path) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)?.[segment];
  }
  return typeof current === "string" ? current : undefined;
}

// ─── Get status from error ─────────────────────────────────────────────────────

function getStatusFromError(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const status = (error as Record<string, unknown>).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

/**
 * Wraps neverthrow's ResultAsync to enforce exhaustive error handling.
 * `.match()` requires a handler object covering every error code in TCode,
 * plus a mandatory wildcard `_` handler.
 */
export class SdkResultAsync<
  T,
  TCode extends string = string,
  TError = unknown,
> {
  constructor(
    readonly _result: ResultAsync<T, TError>,
    private readonly _discriminatorKey: string[] = ["code"],
    private readonly _declaredCodes: readonly TCode[] = [],
  ) {}

  match<A>(
    ok: (val: T) => A,
    err: ExhaustiveErrorHandler<TCode, TError, NoInfer<A>>,
  ): Promise<A> {
    const discriminatorKey = this._discriminatorKey;
    const declaredCodes = this._declaredCodes;

    return this._result.match(ok, (e) => {
      // Step 1: Try discriminator path lookup
      const discriminant = getDiscriminantFromPath(e, discriminatorKey);
      if (discriminant !== undefined && discriminant in err) {
        return (err as Record<string, (ctx: ErrorMatchContext<TError>) => A>)[
          discriminant
        ]({
          error: e,
          metadata: {
            source: "discriminator",
            discriminatorKey,
            discriminant,
          },
        });
      }

      // Step 2: Try status code lookup (scoped to declared codes)
      const status = getStatusFromError(e);
      if (status !== undefined) {
        const statusCode = STATUS_TO_CODE_MAP[status];
        if (
          statusCode !== undefined &&
          declaredCodes.includes(statusCode as TCode)
        ) {
          return (err as Record<string, (ctx: ErrorMatchContext<TError>) => A>)[
            statusCode
          ]({
            error: e,
            metadata: {
              source: "status",
              discriminatorKey,
              status,
            },
          });
        }
      }

      // Step 3: Try __SDK_UNDECLARED_ERROR__ handler
      const undeclaredHandler = (
        err as Record<string, (ctx: ErrorMatchContext<TError>) => A>
      )[__SDK_UNDECLARED_ERROR__];
      if (undeclaredHandler) {
        return undeclaredHandler({
          error: e,
          metadata: {
            source: "undeclared",
            discriminatorKey,
            discriminant,
            status,
          },
        });
      }

      // Step 4: Fall back to wildcard `_` handler
      return (err as Record<string, (ctx: ErrorMatchContext<TError>) => A>)._({
        error: e,
        metadata: {
          source: "wildcard",
          discriminatorKey,
          discriminant,
          status,
        },
      });
    });
  }

  map<U>(f: (val: T) => U): SdkResultAsync<U, TCode, TError> {
    return new SdkResultAsync(
      this._result.map(f),
      this._discriminatorKey,
      this._declaredCodes,
    );
  }

  mapErr<F>(f: (e: TError) => F): SdkResultAsync<T, TCode, F> {
    return new SdkResultAsync(
      this._result.mapErr(f),
      this._discriminatorKey,
      this._declaredCodes,
    );
  }

  andThen<U, F = never>(
    f: (val: T) => SdkResultAsync<U, TCode, F> | ResultAsync<U, F>,
  ): SdkResultAsync<U, TCode, TError | F> {
    return new SdkResultAsync(
      this._result.andThen((v) => {
        const r = f(v);
        return (r instanceof SdkResultAsync ? r._result : r) as ResultAsync<
          U,
          F
        >;
      }) as unknown as ResultAsync<U, TError | F>,
      this._discriminatorKey,
      this._declaredCodes,
    );
  }

  orElse<F = never>(
    f: (e: TError) => SdkResultAsync<T, TCode, F> | ResultAsync<T, F>,
  ): SdkResultAsync<T, TCode, F> {
    return new SdkResultAsync(
      this._result.orElse((e) => {
        const r = f(e);
        return (r instanceof SdkResultAsync ? r._result : r) as ResultAsync<
          T,
          F
        >;
      }) as unknown as ResultAsync<T, F>,
      this._discriminatorKey,
      this._declaredCodes,
    );
  }
}
