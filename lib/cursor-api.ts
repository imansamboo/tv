const CURSOR_API_BASE = "https://api.cursor.com";
const REQUEST_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export type CursorAgentResponse = {
  agent: { id: string; name?: string; status?: string };
  run: { id: string; status: string };
};

export type CursorRunResponse = {
  id: string;
  status: string;
  result?: string | null;
  error?: string | null;
};

export class CursorApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CursorApiError";
  }
}

function apiKey() {
  const key = process.env.CURSOR_API_KEY?.trim();
  if (!key) {
    throw new CursorApiError("کلید Cursor API تنظیم نشده است (CURSOR_API_KEY).", 503);
  }
  return key;
}

function authHeader(key: string) {
  return `Bearer ${key}`;
}

async function cursorFetch(path: string, init: RequestInit = {}, retries = 3): Promise<Response> {
  const key = apiKey();
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${CURSOR_API_BASE}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Authorization: authHeader(key),
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      });
      if (response.ok || !RETRYABLE_STATUSES.has(response.status) || attempt === retries) {
        return response;
      }
      await sleep(4_000 * 2 ** attempt);
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
      await sleep(4_000 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Cursor API request failed.");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseError(response: Response) {
  const payload = await response.json().catch(() => null);
  const detail =
    payload && typeof payload === "object" && "message" in payload
      ? String((payload as { message?: unknown }).message ?? "")
      : "";
  if (response.status === 401) {
    return "کلید Cursor API نامعتبر است.";
  }
  if (response.status === 429) {
    return "محدودیت درخواست Cursor API. چند لحظه بعد دوباره تلاش کنید.";
  }
  if (response.status >= 500) {
    return "سرویس Cursor API موقتاً در دسترس نیست.";
  }
  return detail || "خطا در ارتباط با Cursor API.";
}

async function expectJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new CursorApiError(await parseError(response), response.status);
  }
  return response.json() as Promise<T>;
}

/** Starts a no-repo cloud agent and returns agent + initial run ids. */
export async function createAgent(promptText: string, name: string) {
  const response = await cursorFetch("/v1/agents", {
    method: "POST",
    body: JSON.stringify({
      prompt: { text: promptText },
      name: name.slice(0, 100),
    }),
  });
  return expectJson<CursorAgentResponse>(response);
}

export async function getRun(agentId: string, runId: string) {
  const response = await cursorFetch(`/v1/agents/${agentId}/runs/${runId}`);
  return expectJson<CursorRunResponse>(response);
}

export async function createFollowupRun(agentId: string, promptText: string) {
  const response = await cursorFetch(`/v1/agents/${agentId}/runs`, {
    method: "POST",
    body: JSON.stringify({ prompt: { text: promptText } }),
  });
  return expectJson<{ run: CursorRunResponse }>(response);
}

export const TERMINAL_RUN_STATUSES = new Set(["FINISHED", "ERROR", "CANCELLED", "EXPIRED"]);
