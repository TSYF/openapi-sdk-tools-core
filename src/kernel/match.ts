import { STATUS_TO_CODE_MAP } from "../maps";
import { __SDK_UNDECLARED_ERROR__ } from "../types";
import type { ResultLike } from "./result";

// ─── Error Match Context ───────────────────────────────────────────────────────

export type ErrorMatchSource =
  | "discriminator"
  | "status"
  | "undeclared"
  | "wildcard";

export type ErrorMatchContext<TError> = {
  error: TError;
  metadata: {
    source: ErrorMatchSource;
    discriminatorKey: string[];
    discriminant?: string;
    status?: number;
  };
};

// ─── Exhaustive Error Handler ─────────────────────────────────────────────────

export type ExhaustiveErrorHandler<TCode extends string, TError, A> = {
  [K in TCode]: (ctx: ErrorMatchContext<TError>) => A;
} & {
  _: (ctx: ErrorMatchContext<TError>) => A;
} & {
  [__SDK_UNDECLARED_ERROR__]?: (ctx: ErrorMatchContext<TError>) => A;
};

/**
 * `.match()` accepts either the exhaustive object form above, or a plain
 * function. The function form is the escape hatch for ts-pattern, Effect
 * Match, or any custom matching logic.
 */
export type ErrorHandler<TCode extends string, TError, A> =
  | ExhaustiveErrorHandler<TCode, TError, A>
  | ((error: TError) => A);

// ─── Match Strategy ───────────────────────────────────────────────────────────

export interface MatchContext<TCode extends string = string, TError = unknown> {
  declaredCodes: readonly TCode[];
  discriminatorKey: string[];
}

/**
 * Matching capability. Plugins can change how an error is resolved to a
 * handler (custom discriminators, validation, different resolution order).
 */
export interface MatchStrategy {
  readonly name: string;
  match<T, TCode extends string, TError, A>(
    result: ResultLike<T, TError>,
    ok: (value: T) => A,
    handlers: ExhaustiveErrorHandler<TCode, TError, A>,
    context: MatchContext<TCode, TError>,
  ): Promise<A>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getDiscriminantFromPath(
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

export function getStatusFromError(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const status = (error as Record<string, unknown>).status;
    return typeof status === "number" ? status : undefined;
  }
  return undefined;
}

// ─── Default strategy ─────────────────────────────────────────────────────────

/**
 * Resolution order: discriminator path → status code → undeclared handler →
 * wildcard `_`.
 */
export const defaultMatchStrategy: MatchStrategy = {
  name: "default",
  match<T, TCode extends string, TError, A>(
    result: ResultLike<T, TError>,
    ok: (value: T) => A,
    handlers: ExhaustiveErrorHandler<TCode, TError, A>,
    context: MatchContext<TCode, TError>,
  ): Promise<A> {
    const handlerMap = handlers as unknown as Record<
      string,
      ((ctx: ErrorMatchContext<TError>) => A) | undefined
    >;

    return result.match(ok, (error) => {
      // Step 1: Try discriminator path lookup
      const discriminant = getDiscriminantFromPath(
        error,
        context.discriminatorKey,
      );
      if (discriminant !== undefined && discriminant in handlers) {
        return handlerMap[discriminant]!({
          error,
          metadata: {
            source: "discriminator",
            discriminatorKey: context.discriminatorKey,
            discriminant,
          },
        });
      }

      // Step 2: Try status code lookup (scoped to declared codes)
      const status = getStatusFromError(error);
      if (status !== undefined) {
        const statusCode = STATUS_TO_CODE_MAP[status];
        if (
          statusCode !== undefined &&
          context.declaredCodes.includes(statusCode as TCode)
        ) {
          return handlerMap[statusCode]!({
            error,
            metadata: {
              source: "status",
              discriminatorKey: context.discriminatorKey,
              status,
            },
          });
        }
      }

      // Step 3: Try __SDK_UNDECLARED_ERROR__ handler
      const undeclaredHandler = handlerMap[__SDK_UNDECLARED_ERROR__];
      if (undeclaredHandler) {
        return undeclaredHandler({
          error,
          metadata: {
            source: "undeclared",
            discriminatorKey: context.discriminatorKey,
            discriminant,
            status,
          },
        });
      }

      // Step 4: Fall back to wildcard `_` handler
      return handlerMap._!({
        error,
        metadata: {
          source: "wildcard",
          discriminatorKey: context.discriminatorKey,
          discriminant,
          status,
        },
      });
    });
  },
};
