// Side-effect: patches neverthrow's .match() to accept exhaustive object handlers
import "./match-patch";

export {
  type ErrorCode,
  type ServiceError,
  type BadRequestError,
  type UnauthorizedError,
  type ForbiddenError,
  type NotFoundError,
  type MethodNotAllowedError,
  type NotAcceptableError,
  type RequestTimeoutError,
  type ConflictError,
  type GoneError,
  type PayloadTooLargeError,
  type UnsupportedMediaTypeError,
  type ImATeapotError,
  type UnprocessableEntityError,
  type TooManyRequestsError,
  type InternalServerError,
  type ServiceUnavailableError,
  type KnownServiceError,
  type ServiceErrorOf,
  type ServiceErrorUnion,
  type AppHttpResult,
  type SdkErrorMapper,
  ERROR_CODE_STATUS_MAP,
} from "./types";

export type { ExhaustiveErrorHandler } from "./match-patch";

export {
  STATUS_TO_CODE_MAP,
  ERROR_CODE_INTERFACE_MAP,
  codeToStatus,
} from "./maps";

export {
  type HttpAdapter,
  type RequestOptions,
  type HttpRequestError,
  FetchAdapter,
} from "./http/adapter";

export { matchError, assertNever, parseServiceErrorGeneric } from "./utils";
