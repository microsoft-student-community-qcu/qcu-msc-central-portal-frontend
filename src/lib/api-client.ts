import { getApiEndpoint } from "./api-config";

/** Default budget for JSON requests. */
export const DEFAULT_TIMEOUT_MS = 25_000;
/** Longer budget for multipart uploads (COR/CV/ID images on mobile data). */
export const UPLOAD_TIMEOUT_MS = 60_000;

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors | null;
  readonly isTimeout: boolean;
  readonly isNetwork: boolean;

  constructor(
    message: string,
    opts: {
      status?: number;
      fieldErrors?: FieldErrors | null;
      isTimeout?: boolean;
      isNetwork?: boolean;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status ?? 0;
    this.fieldErrors = opts.fieldErrors ?? null;
    this.isTimeout = opts.isTimeout ?? false;
    this.isNetwork = opts.isNetwork ?? false;
  }
}

export const TIMEOUT_MESSAGE =
  "The server took too long to respond. Please check your connection and try again.";
export const NETWORK_MESSAGE =
  "We couldn't reach the server. Please check your connection and try again.";

/**
 * Normalizes the two error shapes the backend documents:
 *   { message, errors: { field: [msg, ...] } }   (validation)
 *   { message, errors: [msg, ...] }              (setup-token style)
 */
export function extractErrorMessage(json: unknown, fallback: string): string {
  const body = (json ?? {}) as { message?: unknown; errors?: unknown };
  const base = typeof body.message === "string" && body.message.trim() ? body.message : fallback;
  const details = extractFieldErrorText(body.errors);
  return details ? `${base}: ${details}` : base;
}

export function extractFieldErrors(json: unknown): FieldErrors | null {
  const errors = (json as { errors?: unknown } | null | undefined)?.errors;
  if (!errors || Array.isArray(errors) || typeof errors !== "object") return null;
  const out: FieldErrors = {};
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    out[key] = Array.isArray(value) ? value.map(String) : [String(value)];
  }
  return Object.keys(out).length ? out : null;
}

function extractFieldErrorText(errors: unknown): string | null {
  if (!errors) return null;
  if (Array.isArray(errors)) {
    const list = errors.map((e) => (typeof e === "string" ? e : String(e))).filter(Boolean);
    return list.length ? list.join(" | ") : null;
  }
  if (typeof errors === "object") {
    const list = Object.values(errors as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map((v) => (typeof v === "string" ? v : String(v)))
      .filter(Boolean);
    return list.length ? list.join(" | ") : null;
  }
  if (typeof errors === "string") return errors;
  return null;
}

export interface ApiFetchOptions {
  /** Abort budget in ms. Defaults to DEFAULT_TIMEOUT_MS. */
  timeoutMs?: number;
  /** Caller-owned signal; aborting it also aborts the request. */
  signal?: AbortSignal;
}

/**
 * fetch() against the API base URL, always bounded by a timeout.
 * Throws ApiError on timeout or transport failure; HTTP errors still resolve
 * so callers can read the body, exactly like plain fetch.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal }: ApiFetchOptions = {},
): Promise<Response> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(getApiEndpoint(path), { ...init, signal: controller.signal });
  } catch (err) {
    if (timedOut) throw new ApiError(TIMEOUT_MESSAGE, { isTimeout: true });
    if ((err as { name?: string })?.name === "AbortError") throw err;
    throw new ApiError(NETWORK_MESSAGE, { isNetwork: true });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

/**
 * apiFetch + JSON parse + unified error handling.
 * Resolves with the parsed body on success, throws ApiError otherwise.
 */
export async function apiJson<T = unknown>(
  path: string,
  init: RequestInit = {},
  opts: ApiFetchOptions & { fallbackMessage?: string } = {},
): Promise<T> {
  const { fallbackMessage = "Something went wrong. Please try again.", ...fetchOpts } = opts;
  const res = await apiFetch(path, init, fetchOpts);

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  const ok = res.ok && (json as { success?: boolean } | null)?.success !== false;
  if (!ok) {
    throw new ApiError(extractErrorMessage(json, fallbackMessage), {
      status: res.status,
      fieldErrors: extractFieldErrors(json),
    });
  }
  return json as T;
}

/** Message for a thrown value, preferring ApiError copy. */
export function messageFrom(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if ((err as { name?: string })?.name === "AbortError") return TIMEOUT_MESSAGE;
  const m = (err as { message?: unknown })?.message;
  return typeof m === "string" && m.trim() ? m : fallback;
}
