export {
  type ErrorCode,
  type AppHttpResult,
  type SdkErrorMapper,
  ERROR_CODE_STATUS_MAP,
  __SDK_UNDECLARED_ERROR__,
} from "./types";

export type {
  ErrorMatchSource,
  ErrorMatchContext,
  ExhaustiveErrorHandler,
  ErrorHandler,
  MatchContext,
  MatchStrategy,
} from "./kernel/match";

export {
  defaultMatchStrategy,
  getDiscriminantFromPath,
  getStatusFromError,
} from "./kernel/match";

export type { ResultLike, ResultBackend } from "./kernel/result";
export { defaultResultBackend } from "./kernel/result";

export type { ErrorDecoder } from "./kernel/error-decoder";
export { identityErrorDecoder, mapError } from "./kernel/error-decoder";

export type { SdkPlugin } from "./kernel/plugin";
export { defineSdkPlugin } from "./kernel/plugin";

export { SdkKernel } from "./kernel/kernel";

export { STATUS_TO_CODE_MAP, codeToStatus } from "./maps";

export {
  type HttpAdapter,
  type RequestOptions,
  type HttpRequestError,
  FetchAdapter,
  isHttpRequestError,
} from "./http/adapter";

export {
  SdkResultAsync,
  isSdkResult,
  SDK_RESULT_BRAND,
  type SdkResultOptions,
} from "./sdk-result";
