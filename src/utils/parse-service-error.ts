import { type ServiceError } from "../types";
import { STATUS_TO_CODE_MAP } from "../maps";
import { ERROR_CODE_STATUS_MAP } from "../types";
import type { HttpRequestError } from "../http/adapter";

/**
 * Converts an HttpRequestError (from any HttpAdapter) into a typed ServiceError.
 * Prefers the `code` field in the response body when the server sends one
 * (e.g. when the server uses ServiceException from @openapi-sdk-tools/nestjs).
 * Falls back to mapping the HTTP status to a known ErrorCode.
 */
export function parseServiceErrorGeneric(error: HttpRequestError): ServiceError {
  const body =
    error.body && typeof error.body === "object"
      ? (error.body as Record<string, unknown>)
      : null;

  const code: string =
    (body && typeof body.code === "string" ? body.code : null) ??
    STATUS_TO_CODE_MAP[error.status] ??
    "INTERNAL_SERVER_ERROR";

  const resolvedStatus =
    (ERROR_CODE_STATUS_MAP as Record<string, number>)[code] ?? error.status;

  return {
    code,
    status: resolvedStatus,
    message:
      (body && typeof body.message === "string" ? body.message : null) ??
      error.message ??
      "Unknown error",
    provider:
      body && typeof body.provider === "string" ? body.provider : undefined,
    response: body ?? undefined,
  };
}
