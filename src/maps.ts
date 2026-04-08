import { type ErrorCode, ERROR_CODE_STATUS_MAP } from "./types";

// ─── Status → Code reverse map ──────────────────────────────────────────────

export const STATUS_TO_CODE_MAP: Record<number, ErrorCode> = Object.fromEntries(
  Object.entries(ERROR_CODE_STATUS_MAP).map(([code, status]) => [
    status,
    code as ErrorCode,
  ]),
) as Record<number, ErrorCode>;

// ─── Error Code → Interface Name map (used by SDK generator) ────────────────

export const ERROR_CODE_INTERFACE_MAP: Record<ErrorCode, string> = {
  BAD_REQUEST: "BadRequestError",
  UNAUTHORIZED: "UnauthorizedError",
  FORBIDDEN: "ForbiddenError",
  NOT_FOUND: "NotFoundError",
  METHOD_NOT_ALLOWED: "MethodNotAllowedError",
  NOT_ACCEPTABLE: "NotAcceptableError",
  REQUEST_TIMEOUT: "RequestTimeoutError",
  CONFLICT: "ConflictError",
  GONE: "GoneError",
  PAYLOAD_TOO_LARGE: "PayloadTooLargeError",
  UNSUPPORTED_MEDIA_TYPE: "UnsupportedMediaTypeError",
  I_AM_A_TEAPOT: "ImATeapotError",
  UNPROCESSABLE_ENTITY: "UnprocessableEntityError",
  TOO_MANY_REQUESTS: "TooManyRequestsError",
  INTERNAL_SERVER_ERROR: "InternalServerError",
  SERVICE_UNAVAILABLE: "ServiceUnavailableError",
};

export function codeToStatus(code: string): number | undefined {
  return (ERROR_CODE_STATUS_MAP as Record<string, number>)[code];
}
