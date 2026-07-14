// ─── Error Code ↔ Status Mapping ──────────────────────────────────────────────

export const ERROR_CODE_STATUS_MAP = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  REQUESTED_RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  I_AM_A_TEAPOT: 418,
  MISDIRECTED: 421,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  UNRECOVERABLE_ERROR: 456,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  CLOUDFLARE_SERVICE_UNAVAILABLE: 530,
} as const;

export type ErrorCode = keyof typeof ERROR_CODE_STATUS_MAP;

// ─── ServiceError Interface (discriminant = `code`) ──────────────────────────
export type ServiceError = unknown;

export type AppHttpResult<
  T = Record<string, unknown>,
  E extends ServiceError = ServiceError,
> = import("neverthrow").ResultAsync<T, E>;

// ─── SDK Error Mapper ────────────────────────────────────────────────────────

export type SdkErrorMapper<TError = unknown> = (error: unknown) => TError;

// ─── Reserved discriminant for undeclared errors ───────────────────────────────

export const __SDK_UNDECLARED_ERROR__ = "__SDK_UNDECLARED_ERROR__" as const;
export type ReservedUndeclaredErrorKey = typeof __SDK_UNDECLARED_ERROR__;
