import type { SdkErrorMapper } from "../types";

/**
 * Optional plugin capability for validating/decoding raw errors before they
 * are passed to the client's explicit errorMapper and before matching.
 *
 * Zod/Joi plugins implement this. Custom plugins can too.
 */
export interface ErrorDecoder<TError = unknown> {
  readonly name: string;
  decode(raw: unknown): TError;
}

export const identityErrorDecoder: ErrorDecoder = {
  name: "identity",
  decode: (raw) => raw,
};

/**
 * Applies the plugin decoder first, then the client-level error mapper.
 * Generated SdkBase uses this in typedRequest.
 */
export function mapError<TError>(
  decoder: ErrorDecoder | undefined,
  mapper: SdkErrorMapper<TError>,
  raw: unknown,
): TError {
  return mapper(decoder ? decoder.decode(raw) : raw);
}
