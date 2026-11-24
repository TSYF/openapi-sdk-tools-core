# CLAUDE.md - core package

Framework-agnostic SDK microkernel. Zero runtime dependencies.

## Key Types

- `SdkResultAsync<T, TCode extends string, TError = unknown>` — public facade with typed matching and chaining
- `SdkPlugin` — `{ name, result?, match?, errorDecoder? }`
- `SdkKernel` — resolves plugin capabilities once per client and supplies defaults
- `ResultBackend` / `ResultLike<T, E>` — result creation and chaining contract
- `MatchStrategy` — error-to-handler resolution contract
- `ErrorDecoder` — optional raw-error validation hook
- `SdkErrorMapper<TError>` — `(error: unknown) => TError`
- `ErrorMatchContext<TError>` — `{ error, metadata }` wrapper for handlers
- `STATUS_TO_CODE_MAP` — HTTP status → error code mapping

## Kernel Defaults

- `defaultResultBackend` — plain-promise `ResultLike`
- `defaultMatchStrategy` — exhaustive object-handler matcher
- no error decoder

At most one plugin may provide each capability. Duplicate capabilities throw
at client construction with both plugin names.

## Error Matching

Object `.match(ok, handlers)` requires:
- Handler for every `TCode` value
- Mandatory `_` wildcard handler
- Optional `__SDK_UNDECLARED_ERROR__` handler

Resolution: discriminator path → status → undeclared → wildcard.

A function handler bypasses `MatchStrategy` and receives the raw error:

```ts
result.match(ok, (error) => match(error).with(...).otherwise(...));
```

## Transport

`HttpAdapter.request<T>()` returns `Promise<T>` and rejects with
`HttpRequestError` (`{ status, body, message }`). `FetchAdapter` is the
default. The kernel result backend wraps the promise.

## Tests

```bash
pnpm test   # vitest
```
