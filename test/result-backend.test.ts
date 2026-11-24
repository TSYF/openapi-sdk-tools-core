import { describe, expect, it } from "vitest";
import { defaultResultBackend } from "../src/kernel/result";

describe("defaultResultBackend", () => {
  it("resolves ok values", async () => {
    const result = defaultResultBackend.ok(42);

    await expect(
      result.match(
        (value) => value,
        () => -1,
      ),
    ).resolves.toBe(42);
  });

  it("resolves err values", async () => {
    const result = defaultResultBackend.err("boom");

    await expect(
      result.match(
        () => "ok",
        (error) => error,
      ),
    ).resolves.toBe("boom");
  });

  it("maps values", async () => {
    const result = defaultResultBackend.ok(2).map((value) => value * 3);

    await expect(
      result.match(
        (value) => value,
        () => -1,
      ),
    ).resolves.toBe(6);
  });

  it("maps errors without touching ok values", async () => {
    const error = defaultResultBackend
      .err<never, { message: string }>({ message: "boom" })
      .mapErr((e) => e.message);

    await expect(
      error.match(
        () => "ok",
        (message) => message,
      ),
    ).resolves.toBe("boom");
  });

  it("chains with andThen", async () => {
    const result = defaultResultBackend
      .ok(2)
      .andThen((value) => defaultResultBackend.ok(value + 1))
      .andThen((value) => defaultResultBackend.ok(value * 10));

    await expect(
      result.match(
        (value) => value,
        () => -1,
      ),
    ).resolves.toBe(30);
  });

  it("short-circuits andThen after an error", async () => {
    let called = false;
    const result = defaultResultBackend
      .err<number, string>("boom")
      .andThen((value) => {
        called = true;
        return defaultResultBackend.ok(value + 1);
      });

    await expect(
      result.match(
        (value) => value,
        (error) => error,
      ),
    ).resolves.toBe("boom");
    expect(called).toBe(false);
  });

  it("recovers with orElse", async () => {
    const result = defaultResultBackend
      .err<number, string>("boom")
      .orElse(() => defaultResultBackend.ok(99));

    await expect(
      result.match(
        (value) => value,
        () => -1,
      ),
    ).resolves.toBe(99);
  });

  it("wraps promises and maps rejections", async () => {
    const ok = defaultResultBackend.fromPromise(
      Promise.resolve("value"),
      () => "mapped",
    );
    const err = defaultResultBackend.fromPromise(
      Promise.reject(new Error("network")),
      (error) => (error as Error).message,
    );

    await expect(ok.match((value) => value, () => "error")).resolves.toBe(
      "value",
    );
    await expect(err.match(() => "ok", (error) => error)).resolves.toBe(
      "network",
    );
  });
});
