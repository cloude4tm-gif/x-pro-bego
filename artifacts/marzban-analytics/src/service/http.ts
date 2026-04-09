import { FetchOptions, $fetch as ohMyFetch } from "ofetch";
import { getAuthToken } from "utils/authStorage";
import { SERVER_URL_KEY } from "constants/Project";

export function getServerUrl(): string {
  return localStorage.getItem(SERVER_URL_KEY) || import.meta.env.VITE_BASE_API || (typeof window !== "undefined" ? window.location.origin : "");
}

export function setServerUrl(url: string): void {
  const trimmed = url.replace(/\/+$/, "");
  localStorage.setItem(SERVER_URL_KEY, trimmed);
}

export const $fetch = ohMyFetch.create({
  baseURL: import.meta.env.VITE_BASE_API,
});

// In production, Marzban API calls are proxied through our API server
// to avoid CORS issues. In dev, mock middleware intercepts them anyway.
const IS_DEV = import.meta.env.DEV;
const PROXY_BASE = IS_DEV ? null : "/api/marzban-proxy";

export const fetcher = <T = any>(
  url: string,
  ops: FetchOptions<"json"> = {}
) => {
  const serverUrl = getServerUrl();
  if (!serverUrl) {
    return Promise.reject(new Error("No server URL configured"));
  }
  const token = getAuthToken();
  if (token) {
    ops["headers"] = {
      ...(ops?.headers || {}),
      Authorization: `Bearer ${getAuthToken()}`,
    };
  }

  if (PROXY_BASE) {
    // Production: proxy through API server, pass Marzban URL as header
    const cleanPath = url.startsWith("/") ? url.slice(1) : url;
    ops["headers"] = {
      ...(ops?.headers || {}),
      "X-Marzban-Server": serverUrl,
    };
    return $fetch<T>(cleanPath, { ...ops, baseURL: PROXY_BASE });
  }

  // Dev: call Marzban server directly (intercepted by vite mock middleware)
  return $fetch<T>(url, { ...ops, baseURL: serverUrl });
};

export const fetch = fetcher;
