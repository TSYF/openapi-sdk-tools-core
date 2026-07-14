# CLAUDE.md - core package

Framework-agnostic SDK core. Defines `SdkResultAsync` with exhaustive error matching.

## Key Types

- `SdkResultAsync<T, TCode extends string, TError = unknown>` — Result wrapper with typed matching
- `SdkErrorMapper<TError>` — `(error: unknown) => TError`
- `ErrorMatchContext<TError>` — `{ error, metadata }` wrapper for handlers
- `ErrorCode` — String literal union of known error codes
- `STATUS_TO_CODE_MAP` — HTTP status → error code mapping

## Error Matching

`.match(ok, err)` requires:
- Handler for every `TCode` value
- Mandatory `_` wildcard handler
- Optional `__SDK_UNDECLARED_ERROR__` handler

Resolution: discriminator path → status → undeclared → wildcard.