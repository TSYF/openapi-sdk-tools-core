import { ResultAsync } from "neverthrow";
import type { ServiceError } from "./types";
import type { ExhaustiveErrorHandler } from "./match-patch";

/**
 * Wraps neverthrow's ResultAsync to enforce exhaustive error handling.
 * `.match()` requires a handler object covering every error code in E,
 * rather than accepting a plain function that swallows type information.
 */
export class SdkResultAsync<T, E extends ServiceError = ServiceError> {
  constructor(
    readonly _result: ResultAsync<T, E>,
    private readonly _discriminatorKey: string = "code",
  ) {}

  match<A>(ok: (val: T) => A, err: ExhaustiveErrorHandler<E, NoInfer<A>>): Promise<A> {
    const key = this._discriminatorKey;
    return this._result.match(ok, (e) => {
      const discriminant = (e as Record<string, unknown>)[key] as string;
      const handler = (err as Record<string, (e: any) => A>)[discriminant];
      if (!handler) {
        throw new Error(
          `Unhandled error ${key}: "${discriminant}". Expected one of: ${Object.keys(err).join(", ")}`,
        );
      }
      return handler(e);
    });
  }

  map<U>(f: (val: T) => U): SdkResultAsync<U, E> {
    return new SdkResultAsync(this._result.map(f), this._discriminatorKey);
  }

  mapErr<F extends ServiceError>(f: (e: E) => F): SdkResultAsync<T, F> {
    return new SdkResultAsync(this._result.mapErr(f), this._discriminatorKey);
  }

  andThen<U, F extends ServiceError = never>(
    f: (val: T) => SdkResultAsync<U, F> | ResultAsync<U, F>,
  ): SdkResultAsync<U, E | F> {
    return new SdkResultAsync(
      this._result.andThen((v) => {
        const r = f(v);
        return (r instanceof SdkResultAsync ? r._result : r) as ResultAsync<U, F>;
      }) as unknown as ResultAsync<U, E | F>,
      this._discriminatorKey,
    );
  }

  orElse<F extends ServiceError = never>(
    f: (e: E) => SdkResultAsync<T, F> | ResultAsync<T, F>,
  ): SdkResultAsync<T, F> {
    return new SdkResultAsync(
      this._result.orElse((e) => {
        const r = f(e);
        return (r instanceof SdkResultAsync ? r._result : r) as ResultAsync<T, F>;
      }) as unknown as ResultAsync<T, F>,
      this._discriminatorKey,
    );
  }
}
