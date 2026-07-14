import { type ErrorCode, ERROR_CODE_STATUS_MAP } from "./types";

// ─── Status → Code reverse map ──────────────────────────────────────────────

export const STATUS_TO_CODE_MAP: Record<number, ErrorCode> = Object.fromEntries(
  Object.entries(ERROR_CODE_STATUS_MAP).map(([code, status]) => [
    status,
    code as ErrorCode,
  ]),
) as Record<number, ErrorCode>;

export function codeToStatus(code: string): number | undefined {
  return (ERROR_CODE_STATUS_MAP as Record<string, number>)[code];
}
