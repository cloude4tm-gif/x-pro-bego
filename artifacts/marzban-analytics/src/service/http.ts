import { FetchOptions, $fetch as ohMyFetch } from "ofetch";
import { getAuthToken } from "utils/authStorage";
import { SERVER_URL_KEY } from "constants/Project";

export function getServerUrl(): string {
  return localStorage.getItem(SERVER_URL_KEY) || import.meta.env.VITE_BASE_API || "";
}

export function setServerUrl(url: string): void {
  const trimmed = url.replace(/\/+$/, "");
  localStorage.setItem(SERVER_URL_KEY, trimmed);
}

export const $fetch = ohMyFetch.create({
  baseURL: import.meta.env.VITE_BASE_API,
});

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
  return $fetch<T>(url, { ...ops, baseURL: serverUrl });
};

export const fetch = fetcher;
