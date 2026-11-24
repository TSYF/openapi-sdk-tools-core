import { describe, expect, it } from "vitest";
import {
  defaultMatchStrategy,
  defaultResultBackend,
  defineSdkPlugin,
  identityErrorDecoder,
  mapError,
  SdkKernel,
  type SdkPlugin,
} from "../src";

function resultPlugin(name: string): SdkPlugin {
  return {
    name,
    result: { ...defaultResultBackend, name },
  };
}

describe("SdkKernel", () => {
  it("supplies core defaults when no plugins are registered", () => {
    const kernel = new SdkKernel();

    expect(kernel.result).toBe(defaultResultBackend);
    expect(kernel.match).toBe(defaultMatchStrategy);
    expect(kernel.errorDecoder).toBeUndefined();
  });

  it("uses plugin-provided capabilities", () => {
    const plugin = defineSdkPlugin({
      name: "custom",
      result: resultPlugin("custom-result").result,
      errorDecoder: identityErrorDecoder,
    });

    const kernel = new SdkKernel([plugin]);

    expect(kernel.result.name).toBe("custom-result");
    expect(kernel.errorDecoder).toBe(identityErrorDecoder);
    expect(kernel.match).toBe(defaultMatchStrategy);
  });

  it("rejects two plugins that provide the same capability", () => {
    expect(
      () => new SdkKernel([resultPlugin("first"), resultPlugin("second")]),
    ).toThrowError(
      'SdkKernel: multiple plugins provide the "result" capability: first, second',
    );
  });

  it("rejects duplicate match strategies", () => {
    expect(
      () =>
        new SdkKernel([
          { name: "match-a", match: defaultMatchStrategy },
          { name: "match-b", match: defaultMatchStrategy },
        ]),
    ).toThrowError(
      'SdkKernel: multiple plugins provide the "match" capability: match-a, match-b',
    );
  });

  it("allows plugins with disjoint capabilities", () => {
    const kernel = new SdkKernel([
      resultPlugin("result"),
      defineSdkPlugin({ name: "decoder", errorDecoder: identityErrorDecoder }),
    ]);

    expect(kernel.result.name).toBe("result");
    expect(kernel.errorDecoder?.name).toBe("identity");
  });
});

describe("mapError", () => {
  it("runs the decoder before the client mapper", () => {
    const decoder = {
      name: "upper",
      decode: (raw: unknown) => String(raw).toUpperCase(),
    };

    expect(mapError(decoder, (value) => `mapped:${value}`, "boom")).toBe(
      "mapped:BOOM",
    );
  });

  it("uses the raw error when no decoder is registered", () => {
    expect(mapError(undefined, (value) => value, "boom")).toBe("boom");
  });
});
