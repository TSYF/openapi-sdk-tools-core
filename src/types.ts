// ─── Error Code ↔ Status Mapping ──────────────────────────────────────────────

export const ERROR_CODE_STATUS_MAP = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  I_AM_A_TEAPOT: 418,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type ErrorCode = keyof typeof ERROR_CODE_STATUS_MAP;

// ─── ServiceError Interface (discriminant = `code`) ──────────────────────────

export interface ServiceError {
  code: string;
  status: number;
  message: string;
  provider?: string;
  response?: unknown;
}

// ─── Concrete Error Interfaces (one per known code, literal code + status) ───

export interface BadRequestError extends ServiceError {
  code: "BAD_REQUEST";
  status: 400;
}
export interface UnauthorizedError extends ServiceError {
  code: "UNAUTHORIZED";
  status: 401;
}
export interface ForbiddenError extends ServiceError {
  code: "FORBIDDEN";
  status: 403;
}
export interface NotFoundError extends ServiceError {
  code: "NOT_FOUND";
  status: 404;
}
export interface MethodNotAllowedError extends ServiceError {
  code: "METHOD_NOT_ALLOWED";
  status: 405;
}
export interface NotAcceptableError extends ServiceError {
  code: "NOT_ACCEPTABLE";
  status: 406;
}
export interface RequestTimeoutError extends ServiceError {
  code: "REQUEST_TIMEOUT";
  status: 408;
}
export interface ConflictError extends ServiceError {
  code: "CONFLICT";
  status: 409;
}
export interface GoneError extends ServiceError {
  code: "GONE";
  status: 410;
}
export interface PayloadTooLargeError extends ServiceError {
  code: "PAYLOAD_TOO_LARGE";
  status: 413;
}
export interface UnsupportedMediaTypeError extends ServiceError {
  code: "UNSUPPORTED_MEDIA_TYPE";
  status: 415;
}
export interface ImATeapotError extends ServiceError {
  code: "I_AM_A_TEAPOT";
  status: 418;
}
export interface UnprocessableEntityError extends ServiceError {
  code: "UNPROCESSABLE_ENTITY";
  status: 422;
}
export interface TooManyRequestsError extends ServiceError {
  code: "TOO_MANY_REQUESTS";
  status: 429;
}
export interface InternalServerError extends ServiceError {
  code: "INTERNAL_SERVER_ERROR";
  status: 500;
}
export interface ServiceUnavailableError extends ServiceError {
  code: "SERVICE_UNAVAILABLE";
  status: 503;
}

export type KnownServiceError =
  | BadRequestError
  | UnauthorizedError
  | ForbiddenError
  | NotFoundError
  | MethodNotAllowedError
  | NotAcceptableError
  | RequestTimeoutError
  | ConflictError
  | GoneError
  | PayloadTooLargeError
  | UnsupportedMediaTypeError
  | ImATeapotError
  | UnprocessableEntityError
  | TooManyRequestsError
  | InternalServerError
  | ServiceUnavailableError;

export type ServiceErrorOf<C extends ErrorCode> = Extract<
  KnownServiceError,
  { code: C }
>;

export type ServiceErrorUnion<T extends readonly ErrorCode[]> = ServiceErrorOf<
  T[number]
>;

export type AppHttpResult<
  T = Record<string, unknown>,
  E extends ServiceError = ServiceError,
> = import("neverthrow").ResultAsync<T, E>;

// ─── SDK Error Mapper ────────────────────────────────────────────────────────

export type SdkErrorMapper = (error: unknown) => ServiceError;
