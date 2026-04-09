import { getAuthToken } from "utils/authStorage";

const BASE = "/xpbapi";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const xpbApi = {
  // Plans
  getPlans: () => request<any[]>("GET", "/plans"),
  createPlan: (data: any) => request<any>("POST", "/plans", data),
  updatePlan: (id: number, data: any) => request<any>("PUT", `/plans/${id}`, data),
  deletePlan: (id: number) => request<any>("DELETE", `/plans/${id}`),

  // Resellers
  getResellers: () => request<any[]>("GET", "/resellers"),
  createReseller: (data: any) => request<any>("POST", "/resellers", data),
  updateReseller: (id: number, data: any) => request<any>("PUT", `/resellers/${id}`, data),
  addBalance: (id: number, amount: number) => request<any>("POST", `/resellers/${id}/balance`, { amount }),
  deleteReseller: (id: number) => request<any>("DELETE", `/resellers/${id}`),

  // API Keys
  getApiKeys: () => request<any[]>("GET", "/api-keys"),
  createApiKey: (data: any) => request<any>("POST", "/api-keys", data),
  revokeApiKey: (id: number) => request<any>("PATCH", `/api-keys/${id}/revoke`),
  deleteApiKey: (id: number) => request<any>("DELETE", `/api-keys/${id}`),

  // IP Rules
  getIpRules: (type?: string) => request<any[]>("GET", `/ip-rules${type ? `?type=${type}` : ""}`),
  createIpRule: (data: any) => request<any>("POST", "/ip-rules", data),
  deleteIpRule: (id: number) => request<any>("DELETE", `/ip-rules/${id}`),

  // Audit Logs
  getAuditLogs: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{ logs: any[]; admins: string[] }>("GET", `/audit-logs${qs}`);
  },
  createAuditLog: (data: any) => request<any>("POST", "/audit-logs", data),

  // Webhooks
  getWebhooks: () => request<any[]>("GET", "/webhooks"),
  createWebhook: (data: any) => request<any>("POST", "/webhooks", data),
  updateWebhook: (id: number, data: any) => request<any>("PUT", `/webhooks/${id}`, data),
  deleteWebhook: (id: number) => request<any>("DELETE", `/webhooks/${id}`),
  testWebhook: (id: number) => request<any>("POST", `/webhooks/${id}/test`),

  // Bot Settings
  getBotSettings: () => request<any>("GET", "/bot-settings"),
  saveBotSettings: (data: any) => request<any>("PUT", "/bot-settings", data),
  testBot: () => request<any>("POST", "/bot-settings/test"),

  // Automation
  getAutomation: () => request<any>("GET", "/automation"),
  saveAutomation: (data: any) => request<any>("PUT", "/automation", data),

  // Analytics
  getSnapshots: (days?: number) => request<any[]>("GET", `/analytics/snapshots${days ? `?days=${days}` : ""}`),
  saveSnapshot: (data: any) => request<any>("POST", "/analytics/snapshot", data),
};
