import { describe, expect, it, vi } from "vitest";
import {
  __SDK_UNDECLARED_ERROR__,
  defaultResultBackend,
  isSdkResult,
  SdkKernel,
  SdkResultAsync,
  type ExhaustiveErrorHandler,
  type MatchStrategy,
  type SdkPlugin,
} from "../src";

type Code = "NOT_FOUND" | "VALIDATION_ERROR";

function result<T>(
  outcome: { ok: true; value: T } | { ok: false; error: unknown },
  options: { discriminatorKey?: string[]; declaredCodes?: readonly Code[] } = {},
): SdkResultAsync<T, Code, unknown> {
  const kernel = new SdkKernel();
  const value = outcome.ok
    ? defaultResultBackend.ok<T, unknown>(outcome.value)
    : defaultResultBackend.err<T, unknown>(outcome.error);

  return new SdkResultAsync(value, kernel, {
    discriminatorKey: options.discriminatorKey ?? ["code"],
    declaredCodes: options.declaredCodes ?? ["NOT_FOUND", "VALIDATION_ERROR"],
  });
}

function handlers(
  overrides: Partial<ExhaustiveErrorHandler<Code, unknown, string>> = {},
): ExhaustiveErrorHandler<Code, unknown, string> {
  return {
    NOT_FOUND: () => "not-found",
    VALIDATION_ERROR: () => "validation",
    _: () => "wildcard",
    ...overrides,
  };
}

describe("SdkResultAsync", () => {
  it("returns the ok value", async () => {
    const value = result({ ok: true, value: 21 });

    await expect(value.match((v) => v * 2, handlers())).resolves.toBe(42);
  });

  it("matches on the discriminator path", async () => {
    const value = result(
      { ok: false, error: { code: "NOT_FOUND", message: "missing" } },
    );

    await expect(value.match(() => "ok", handlers())).resolves.toBe(
      "not-found",
    );
  });

  it("supports a nested discriminator path", async () => {
    const value = result(
      { ok: false, error: { body: { tag: "VALIDATION_ERROR" } } },
      { discriminatorKey: ["body", "tag"] },
    );

    await expect(value.match(() => "ok", handlers())).resolves.toBe(
      "validation",
    );
  });

  it("falls back to the HTTP status when the discriminator is absent", async () => {
    const value = result({ ok: false, error: { status: 404 } });

    await expect(value.match(() => "ok", handlers())).resolves.toBe(
      "not-found",
    );
  });

  it("ignores status codes that are not declared for the operation", async () => {
    const value = result(
      { ok: false, error: { status: 404 } },
      { declaredCodes: ["VALIDATION_ERROR"] },
    );

    await expect(value.match(() => "ok", handlers())).resolves.toBe(
      "wildcard",
    );
  });

  it("prefers the undeclared handler over the wildcard", async () => {
    const value = result({ ok: false, error: { status: 500 } });

    await expect(
      value.match(
        () => "ok",
        handlers({
          [__SDK_UNDECLARED_ERROR__]: () => "undeclared",
        }),
      ),
    ).resolves.toBe("undeclared");
  });

  it("passes match metadata to handlers", async () => {
    const handler = vi.fn(() => "matched");
    const value = result(
      { ok: false, error: { code: "NOT_FOUND", message: "missing" } },
    );

    await value.match(() => "ok", handlers({ NOT_FOUND: handler }));

    expect(handler).toHaveBeenCalledWith({
      error: { code: "NOT_FOUND", message: "missing" },
      metadata: {
        source: "discriminator",
        discriminatorKey: ["code"],
        discriminant: "NOT_FOUND",
      },
    });
  });

  it("accepts a function handler for ts-pattern-style matching", async () => {
    const strategy: MatchStrategy = {
      name: "unused",
      match: () => {
        throw new Error("match strategy should not be used");
      },
    };
    const kernel = new SdkKernel([
      { name: "custom-match", match: strategy } satisfies SdkPlugin,
    ]);
    const value = new SdkResultAsync(
      defaultResultBackend.err<never, unknown>({ code: "NOT_FOUND" }),
      kernel,
      { declaredCodes: ["NOT_FOUND"] },
    );

    await expect(
      value.match(
        () => "ok",
        (error) => (error as { code: string }).code,
      ),
    ).resolves.toBe("NOT_FOUND");
  });

  it("delegates object handlers to a plugin match strategy", async () => {
    const strategy: MatchStrategy = {
      name: "custom",
      match: async () => "custom-strategy",
    };
    const kernel = new SdkKernel([
      { name: "custom-match", match: strategy } satisfies SdkPlugin,
    ]);
    const value = new SdkResultAsync(
      defaultResultBackend.err<never, unknown>({ code: "NOT_FOUND" }),
      kernel,
      { declaredCodes: ["NOT_FOUND"] },
    );

    await expect(value.match(() => "ok", handlers())).resolves.toBe(
      "custom-strategy",
    );
  });

  it("chains map, mapErr, andThen, and orElse", async () => {
    const value = result({ ok: true, value: 2 })
      .map((v) => v * 5)
      .andThen((v) => result({ ok: true, value: v + 1 }))
      .mapErr((e) => String(e));

    await expect(value.match((v) => v, () => -1)).resolves.toBe(11);

    const recovered = result({ ok: false, error: "boom" }).orElse(() =>
      result({ ok: true, value: 7 }),
    );

    await expect(recovered.match((v) => v, () => -1)).resolves.toBe(7);
  });

  it("brands results for cross-package checks", () => {
    const value = result({ ok: true, value: 1 });

    expect(isSdkResult(value)).toBe(true);
    expect(isSdkResult({ match: () => undefined })).toBe(false);
    expect(isSdkResult(null)).toBe(false);
  });
});
