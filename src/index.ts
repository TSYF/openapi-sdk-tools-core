// Side-effect: patches neverthrow's .match() to accept exhaustive object handlers
import "./match-patch";

export {
  type ErrorCode,
  type AppHttpResult,
  type SdkErrorMapper,
  ERROR_CODE_STATUS_MAP,
  __SDK_UNDECLARED_ERROR__,
} from "./types";

export type {
  ExhaustiveErrorHandler,
  ErrorMatchContext,
  ErrorMatchSource,
} from "./match-patch";

export { STATUS_TO_CODE_MAP, codeToStatus } from "./maps";

export {
  type HttpAdapter,
  type RequestOptions,
  type HttpRequestError,
  FetchAdapter,
} from "./http/adapter";

export { SdkResultAsync } from "./sdk-result";
