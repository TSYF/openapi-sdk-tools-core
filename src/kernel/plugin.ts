import type { ErrorDecoder } from "./error-decoder";
import type { MatchStrategy } from "./match";
import type { ResultBackend } from "./result";

/**
 * A plugin contributes one or more optional kernel capabilities.
 *
 * Capabilities are independent and composable:
 *   [neverthrowPlugin(), zodPlugin(schema)]  // result + validation
 *   [effectPlugin(), tsPatternPlugin()]      // result + matching
 *
 * Two plugins providing the same capability is a kernel configuration error.
 */
export interface SdkPlugin {
  readonly name: string;
  /** How results are created and chained. */
  readonly result?: ResultBackend;
  /** How errors are resolved to exhaustive handlers. */
  readonly match?: MatchStrategy;
  /** How raw errors are validated/decoded before matching. */
  readonly errorDecoder?: ErrorDecoder;
}

/** Identity helper for plugin authors. */
export function defineSdkPlugin(plugin: SdkPlugin): SdkPlugin {
  return plugin;
}
