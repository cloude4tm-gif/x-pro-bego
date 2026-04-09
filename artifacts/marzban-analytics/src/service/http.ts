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

const IS_DEV = import.meta.env.DEV;

export const fetcher = <T = any>(
  url: string,
  ops: FetchOptions<"json"> = {}
) => {
  const token = getAuthToken();
  if (token) {
    ops["headers"] = {
      ...(ops?.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  if (!IS_DEV) {
    // Production: call our own API at /api directly (no Marzban proxy needed)
    const cleanPath = url.startsWith("/") ? url.slice(1) : url;
    return $fetch<T>(cleanPath, { ...ops, baseURL: "/api" });
  }

  // Dev: call API server directly using stored serverUrl
  const serverUrl = getServerUrl();
  if (!serverUrl) {
    return Promise.reject(new Error("No server URL configured"));
  }
  const apiUrl = url.startsWith("/api/") ? url : `/api${url.startsWith("/") ? url : `/${url}`}`;
  return $fetch<T>(apiUrl, { ...ops, baseURL: serverUrl });
};

export const fetch = fetcher;
