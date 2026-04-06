export interface MarzbanConfig {
  baseUrl: string;
  token: string;
}

export interface SystemStats {
  version: string;
  mem_total: number;
  mem_used: number;
  cpu_cores: number;
  cpu_usage: number;
  total_user: number;
  users_active: number;
  users_disabled: number;
  users_expired: number;
  users_limited: number;
  users_on_hold: number;
  online_users: number;
  incoming_bandwidth: number;
  outgoing_bandwidth: number;
  incoming_bandwidth_speed: number;
  outgoing_bandwidth_speed: number;
}

export interface User {
  username: string;
  status: "active" | "disabled" | "limited" | "expired" | "on_hold";
  expire: number | null;
  data_limit: number | null;
  used_traffic: number;
  data_limit_reset_strategy: string;
  proxies: Record<string, unknown>;
  inbounds: Record<string, string[]>;
  note: string | null;
  sub_updated_at: string | null;
  sub_last_user_agent: string | null;
  online_at: string | null;
  created_at: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

export interface Node {
  id: number;
  name: string;
  address: string;
  port: number;
  api_port: number;
  status: "connected" | "connecting" | "error" | "disabled";
  xray_version: string | null;
  message: string | null;
  add_as_new_host: boolean;
}

export interface NodeUsage {
  node_id: number | null;
  node_name: string;
  uplink: number;
  downlink: number;
}

export interface NodesUsageResponse {
  usages: NodeUsage[];
}

export interface UserUsage {
  node_id: number | null;
  node_name: string;
  used_traffic: number;
}

export interface Admin {
  username: string;
  is_sudo: boolean;
  telegram_id?: number | null;
  discord_webhook?: string | null;
  password?: string;
}

export interface CreateAdminPayload {
  username: string;
  password: string;
  is_sudo: boolean;
  telegram_id?: number | null;
  discord_webhook?: string | null;
}

export class MarzbanClient {
  private baseUrl: string;
  private token: string;

  constructor(config: MarzbanConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.token = config.token;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${res.status}: ${err}`);
    }

    if (res.status === 204) return undefined as unknown as T;
    return res.json() as Promise<T>;
  }

  async getSystemStats(): Promise<SystemStats> {
    return this.request<SystemStats>("/system");
  }

  async getUsers(params?: {
    offset?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<UsersResponse> {
    const q = new URLSearchParams();
    if (params?.offset !== undefined) q.set("offset", String(params.offset));
    if (params?.limit !== undefined) q.set("limit", String(params.limit));
    if (params?.status) q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return this.request<UsersResponse>(`/users${qs ? "?" + qs : ""}`);
  }

  async getNodes(): Promise<Node[]> {
    return this.request<Node[]>("/nodes");
  }

  async getNodesUsage(start?: string, end?: string): Promise<NodesUsageResponse> {
    const q = new URLSearchParams();
    if (start) q.set("start", start);
    if (end) q.set("end", end);
    const qs = q.toString();
    return this.request<NodesUsageResponse>(`/nodes/usage${qs ? "?" + qs : ""}`);
  }

  async getUserUsage(username: string, start?: string, end?: string): Promise<{ usages: UserUsage[] }> {
    const q = new URLSearchParams();
    if (start) q.set("start", start);
    if (end) q.set("end", end);
    const qs = q.toString();
    return this.request<{ usages: UserUsage[] }>(`/user/${username}/usage${qs ? "?" + qs : ""}`);
  }

  async getUsersUsage(start?: string, end?: string): Promise<{ usages: Array<{ username: string; used_traffic: number; node_id: number | null; node_name: string }> }> {
    const q = new URLSearchParams();
    if (start) q.set("start", start);
    if (end) q.set("end", end);
    const qs = q.toString();
    return this.request<{ usages: Array<{ username: string; used_traffic: number; node_id: number | null; node_name: string }> }>(`/users/usage${qs ? "?" + qs : ""}`);
  }

  // Admin Management
  async getAdmins(): Promise<Admin[]> {
    return this.request<Admin[]>("/admins");
  }

  async createAdmin(payload: CreateAdminPayload): Promise<Admin> {
    return this.request<Admin>("/admin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateAdmin(username: string, payload: Partial<Admin & { password?: string }>): Promise<Admin> {
    return this.request<Admin>(`/admin/${username}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteAdmin(username: string): Promise<void> {
    return this.request<void>(`/admin/${username}`, { method: "DELETE" });
  }

  // User IP Limit (via note field workaround – Marzban doesn't have native IP limit API)
  async setUserNote(username: string, note: string): Promise<User> {
    return this.request<User>(`/user/${username}`, {
      method: "PUT",
      body: JSON.stringify({ note }),
    });
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
  return formatBytes(bytesPerSec) + "/s";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "#22c55e",
    disabled: "#94a3b8",
    expired: "#ef4444",
    limited: "#f59e0b",
    on_hold: "#a855f7",
    connected: "#22c55e",
    connecting: "#f59e0b",
    error: "#ef4444",
  };
  return colors[status] ?? "#94a3b8";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Aktif",
    disabled: "Devre Disi",
    expired: "Suresi Dolmus",
    limited: "Limitli",
    on_hold: "Beklemede",
    connected: "Bagli",
    connecting: "Baglanıyor",
    error: "Hata",
  };
  return labels[status] ?? status;
}

export function formatExpiry(timestamp: number | null): string {
  if (!timestamp) return "Sinirsiz";
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff < 0) return "Suresi doldu";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Bugun bitiyor";
  if (days === 1) return "Yarin bitiyor";
  return `${days} gun kaldi`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
