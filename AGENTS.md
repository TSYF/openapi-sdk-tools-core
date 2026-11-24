# AGENTS.md - core

Zero-dependency microkernel and public result facade. Never add a result-library dependency here.

## Kernel

`src/kernel/` defines the plugin contracts:

- `result.ts` — `ResultLike<T, E>`, `ResultBackend`, `defaultResultBackend` (plain promises).
- `match.ts` — `MatchStrategy`, `defaultMatchStrategy`, match context/types, discriminator/status helpers.
- `error-decoder.ts` — `ErrorDecoder`, `identityErrorDecoder`, `mapError(decoder, mapper, raw)`.
- `plugin.ts` — `SdkPlugin` (`{ name, result?, match?, errorDecoder? }`) and `defineSdkPlugin`.
- `kernel.ts` — `SdkKernel`, capability resolution, duplicate detection.

At most one plugin may provide each capability. Duplicate capabilities throw at construction and name the offending plugins.

`SdkKernel` defaults: plain-promise result backend, default match strategy, no decoder. `errorDecoder` runs before the client `errorMapper`, then matching.

## SdkResultAsync

`src/sdk-result.ts`:

- Constructor: `(result: ResultLike, kernel?: SdkKernel, options?: { discriminatorKey?, declaredCodes? })`.
- `map`/`mapErr`/`andThen`/`orElse` delegate to the result backend.
- `.match(ok, handlers)` accepts exhaustive object handlers or a function `(error) => A`. The function form bypasses `MatchStrategy`; it is the ts-pattern/Effect Match escape hatch.
- Object handler resolution: discriminator path → status code → `__SDK_UNDECLARED_ERROR__` → `_` wildcard.
- `isSdkResult()` uses the `Symbol.for` brand for cross-package-copy checks.
- `native` returns the active `ResultLike` wrapper, not necessarily a library-native object.

Do not restore the old constructor `(result, discriminatorKey, declaredCodes)`.

## Transport

`src/http/adapter.ts`:

- `HttpAdapter.request<T>()` returns `Promise<T>` and rejects with `HttpRequestError`.
- `FetchAdapter` shapes network failures as `{ status: 0, body: null, message }`.
- `isHttpRequestError()` is the runtime guard.
- The kernel result backend wraps the promise; adapters do not know about neverthrow.

## Exports

`src/index.ts` is the public surface: kernel contracts/defaults, `SdkKernel`, `defineSdkPlugin`, `SdkResultAsync`, `isSdkResult`, `HttpAdapter`/`FetchAdapter`, `STATUS_TO_CODE_MAP`, `__SDK_UNDECLARED_ERROR__`.

## Verification

```bash
pnpm exec tsc --noEmit
pnpm test
```

Tests in `test/`: result backend, kernel/decoder, SDK result matching/chaining, fetch adapter.
