import { ResultAsync } from "neverthrow";

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

// ─── HttpAdapter interface ────────────────────────────────────────────────────

export interface HttpAdapter {
  request<T>(options: RequestOptions): ResultAsync<T, HttpRequestError>;
}

// ─── FetchAdapter — default implementation using native fetch ─────────────────

export class FetchAdapter implements HttpAdapter {
  request<T>(options: RequestOptions): ResultAsync<T, HttpRequestError> {
    return ResultAsync.fromPromise(
      this._doRequest<T>(options),
      (e: unknown): HttpRequestError => {
        // Already shaped by _doRequest
        if (
          e &&
          typeof e === "object" &&
          "status" in e &&
          "body" in e &&
          "message" in e
        ) {
          return e as HttpRequestError;
        }
        return { status: 0, body: null, message: String(e) };
      },
    );
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
