import { afterEach, describe, expect, it, vi } from "vitest";
import { FetchAdapter, isHttpRequestError } from "../src/http/adapter";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FetchAdapter", () => {
  it("parses successful JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => '{"id":1,"name":"Ada"}',
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new FetchAdapter();
    const value = await adapter.request<{ id: number; name: string }>({
      method: "GET",
      url: "https://api.example.com/users/1",
    });

    expect(value).toEqual({ id: 1, name: "Ada" });
  });

  it("serializes query parameters and skips empty values", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    await new FetchAdapter().request({
      method: "GET",
      url: "https://api.example.com/users",
      query: { page: 2, active: true, empty: undefined, nil: null },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/users?page=2&active=true",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("throws an HttpRequestError for non-2xx responses", async () => {
    const body = { code: "NOT_FOUND", message: "missing" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => body,
      }),
    );

    const error = await new FetchAdapter()
      .request({ method: "GET", url: "https://api.example.com/users/1" })
      .catch((e) => e);

    expect(isHttpRequestError(error)).toBe(true);
    expect(error).toEqual({
      status: 404,
      body,
      message: "Not Found",
    });
  });

  it("normalizes network failures into HttpRequestError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connection refused")),
    );

    const error = await new FetchAdapter()
      .request({ method: "GET", url: "https://api.example.com" })
      .catch((e) => e);

    expect(isHttpRequestError(error)).toBe(true);
    expect(error).toEqual({
      status: 0,
      body: null,
      message: "Error: connection refused",
    });
  });
});
