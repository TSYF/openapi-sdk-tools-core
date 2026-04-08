import { type ServiceError } from "../types";

export function matchError<E extends ServiceError, R>(
  error: E,
  handlers: { [K in E["code"]]: (e: Extract<E, { code: K }>) => R },
): R {
  const handler = (handlers as Record<string, (e: any) => R>)[error.code];
  if (!handler) {
    throw new Error(`Unhandled error code: ${error.code}`);
  }
  return handler(error);
}

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}
