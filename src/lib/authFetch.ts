import axios from "axios";

/**
 * Attaches the signed-in user's token to same-origin `/api/` requests that
 * don't already carry an Authorization header — for both `fetch` and axios.
 *
 * Most dashboard pages call the API without adding the token themselves, so
 * this lets the server check who is making the request without changing
 * every call site. Requests to other origins, Next.js internals and calls
 * that set their own Authorization header are left untouched.
 */

let installed = false;

const readToken = (): string | null => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

const isSameOriginApi = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith("/api/");
  } catch {
    return false;
  }
};

export function installAuthFetch(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const token = readToken();
    if (!token || !isSameOriginApi(url)) return originalFetch(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (headers.has("Authorization")) return originalFetch(input, init);
    headers.set("Authorization", `Bearer ${token}`);
    return originalFetch(input, { ...init, headers });
  };

  axios.interceptors.request.use((config) => {
    const token = readToken();
    const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
    if (token && isSameOriginApi(url) && !config.headers?.Authorization) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  });
}
