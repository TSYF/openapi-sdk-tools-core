import { __SDK_UNDECLARED_ERROR__ } from "./types";

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
