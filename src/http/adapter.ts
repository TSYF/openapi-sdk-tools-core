// ─── Request / Error shapes ───────────────────────────────────────────────────

export interface RequestOptions {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export interface HttpRequestError {
  status: number;
  body: unknown;
  message: string;
}

export function isHttpRequestError(error: unknown): error is HttpRequestError {
  return (
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    "body" in error &&
    "message" in error
  );
}

// ─── HttpAdapter interface ────────────────────────────────────────────────────

/**
 * Result-library-agnostic HTTP transport.
 *
 * Implementations resolve with the parsed response body or reject with
 * HttpRequestError. The kernel wraps the promise in whatever result backend
 * the client has configured.
 */
export interface HttpAdapter {
  request<T>(options: RequestOptions): Promise<T>;
}

// ─── FetchAdapter — default implementation using native fetch ─────────────────

export class FetchAdapter implements HttpAdapter {
  async request<T>(options: RequestOptions): Promise<T> {
    try {
      return await this._doRequest<T>(options);
    } catch (error) {
      if (isHttpRequestError(error)) throw error;
      throw {
        status: 0,
        body: null,
        message: String(error),
      } satisfies HttpRequestError;
    }
  }

  private async _doRequest<T>(options: RequestOptions): Promise<T> {
    let url = options.url;

    if (options.query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined && v !== null) params.append(k, String(v));
      }
      const qs = params.toString();
      if (qs) url += "?" + qs;
    }

    const response = await fetch(url, {
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body != null ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => null);
      }
      const error: HttpRequestError = {
        status: response.status,
        body,
        message: response.statusText,
      };
      throw error;
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
  }
}
