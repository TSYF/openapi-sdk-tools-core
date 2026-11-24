import type { ErrorDecoder } from "./error-decoder";
import { defaultMatchStrategy, type MatchStrategy } from "./match";
import type { SdkPlugin } from "./plugin";
import { defaultResultBackend, type ResultBackend } from "./result";

function pick<T>(
  plugins: readonly SdkPlugin[],
  key: "result" | "match" | "errorDecoder",
  label: string,
): T | undefined {
  const providers = plugins.filter((plugin) => plugin[key] !== undefined);
  if (providers.length > 1) {
    throw new Error(
      `SdkKernel: multiple plugins provide the "${label}" capability: ` +
        providers.map((plugin) => plugin.name).join(", "),
    );
  }
  return providers[0]?.[key] as T | undefined;
}

/**
 * Microkernel runtime. Resolves plugin capabilities once per client and
 * supplies core defaults when a capability is absent.
 */
export class SdkKernel {
  private readonly _result: ResultBackend;
  private readonly _match: MatchStrategy;
  private readonly _errorDecoder: ErrorDecoder | undefined;

  constructor(plugins: readonly SdkPlugin[] = []) {
    this._result =
      pick<ResultBackend>(plugins, "result", "result") ?? defaultResultBackend;
    this._match =
      pick<MatchStrategy>(plugins, "match", "match") ?? defaultMatchStrategy;
    this._errorDecoder = pick<ErrorDecoder>(
      plugins,
      "errorDecoder",
      "errorDecoder",
    );
  }

  get result(): ResultBackend {
    return this._result;
  }

  get match(): MatchStrategy {
    return this._match;
  }

  get errorDecoder(): ErrorDecoder | undefined {
    return this._errorDecoder;
  }
}
