import { SystemStats, User, Node, NodesUsageResponse } from "@/lib/marzban";

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const DEMO_USERS: User[] = [
  { username: "ahmet_kaya", status: "active", expire: Math.floor(Date.now() / 1000) + 86400 * 12, data_limit: 10737418240, used_traffic: 8053063680, data_limit_reset_strategy: "no_reset", proxies: { vless: {} }, inbounds: { vless: ["VLESS_TCP"] }, note: "Kurumsal musteri", sub_updated_at: new Date().toISOString(), sub_last_user_agent: "v2rayNG/1.8.7", online_at: new Date(Date.now() - 3600000).toISOString(), created_at: "2024-08-15T10:22:00Z" },
  { username: "mehmet_demir", status: "active", expire: Math.floor(Date.now() / 1000) + 86400 * 25, data_limit: 21474836480, used_traffic: 6442450944, data_limit_reset_strategy: "monthly", proxies: { vmess: {} }, inbounds: { vmess: ["VMESS_WS"] }, note: null, sub_updated_at: new Date().toISOString(), sub_last_user_agent: "Clash/1.18.0", online_at: new Date(Date.now() - 900000).toISOString(), created_at: "2024-09-03T14:11:00Z" },
  { username: "fatma_yilmaz", status: "active", expire: Math.floor(Date.now() / 1000) + 86400 * 5, data_limit: 5368709120, used_traffic: 4026531840, data_limit_reset_strategy: "no_reset", proxies: { trojan: {} }, inbounds: { trojan: ["Trojan_TCP"] }, note: "Bitis yaklasiyor", sub_updated_at: new Date().toISOString(), sub_last_user_agent: "Shadowrocket/2100", online_at: new Date(Date.now() - 1800000).toISOString(), created_at: "2024-10-20T09:00:00Z" },
  { username: "ali_celik", status: "active", expire: null, data_limit: 0, used_traffic: 107374182400, data_limit_reset_strategy: "no_reset", proxies: { vless: {} }, inbounds: { vless: ["VLESS_TCP"] }, note: "VIP kullanici - sinirsiz", sub_updated_at: new Date().toISOString(), sub_last_user_agent: "NekoBox/1.2.5", online_at: new Date(Date.now() - 120000).toISOString(), created_at: "2024-01-10T08:00:00Z" },
  { username: "zeynep_arslan", status: "active", expire: Math.floor(Date.now() / 1000) + 86400 * 30, data_limit: 53687091200, used_traffic: 32212254720, data_limit_reset_strategy: "monthly", proxies: { vmess: {} }, inbounds: { vmess: ["VMESS_WS"] }, note: null, sub_updated_at: new Date().toISOString(), sub_last_user_agent: "v2rayNG/1.8.7", online_at: new Date(Date.now() - 7200000).toISOString(), created_at: "2024-11-01T12:00:00Z" },
  { username: "emre_sahin", status: "expired", expire: Math.floor(Date.now() / 1000) - 86400 * 3, data_limit: 10737418240, used_traffic: 10737418240, data_limit_reset_strategy: "no_reset", proxies: { vless: {} }, inbounds: { vless: ["VLESS_TCP"] }, note: null, sub_updated_at: null, sub_last_user_agent: null, online_at: new Date(Date.now() - 86400000 * 3).toISOString(), created_at: "2024-07-22T10:00:00Z" },
  { username: "ayse_koc", status: "limited", expire: Math.floor(Date.now() / 1000) + 86400 * 18, data_limit: 10737418240, used_traffic: 10737418240, data_limit_reset_strategy: "no_reset", proxies: { trojan: {} }, inbounds: { trojan: ["Trojan_TCP"] }, note: "Limit doldu", sub_updated_at: null, sub_last_user_agent: null, online_at: new Date(Date.now() - 172800000).toISOString(), created_at: "2024-09-15T16:30:00Z" },
  { username: "burak_ozturk", status: "disabled", expire: Math.floor(Date.now() / 1000) + 86400 * 20, data_limit: 21474836480, used_traffic: 1073741824, data_limit_reset_strategy: "no_reset", proxies: { vmess: {} }, inbounds: { vmess: ["VMESS_WS"] }, note: "Odeme bekleniyor", sub_updated_at: null, sub_last_user_agent: null, online_at: null, created_at: "2024-10-05T08:45:00Z" },
  { username: "selin_yildiz", status: "on_hold", expire: null, data_limit: 10737418240, used_traffic: 0, data_limit_reset_strategy: "no_reset", proxies: { vless: {} }, inbounds: { vless: ["VLESS_TCP"] }, note: "Aktivasyon bekleniyor", sub_updated_at: null, sub_last_user_agent: null, online_at: null, created_at: "2025-01-20T11:00:00Z" },
  { username: "murat_bas", status: "active", expire: Math.floor(Date.now() / 1000) + 86400 * 45, data_limit: 107374182400, used_traffic: 21474836480, data_limit_reset_strategy: "monthly", proxies: { vless: {}, vmess: {} }, inbounds: { vless: ["VLESS_TCP"], vmess: ["VMESS_WS"] }, note: null, sub_updated_at: new Date().toISOString(), sub_last_user_agent: "Hiddify/2.0.0", online_at: new Date(Date.now() - 600000).toISOString(), created_at: "2024-06-01T09:00:00Z" },
  { username: "nisa_polat", status: "active", expire: Math.floor(Date.now() / 1000) + 86400 * 8, data_limit: 5368709120, used_traffic: 2147483648, data_limit_reset_strategy: "no_reset", proxies: { trojan: {} }, inbounds: { trojan: ["Trojan_TCP"] }, note: null, sub_updated_at: new Date().toISOString(), sub_last_user_agent: "Shadowrocket/2100", online_at: new Date(Date.now() - 14400000).toISOString(), created_at: "2024-12-10T15:00:00Z" },
  { username: "can_erdogan", status: "expired", expire: Math.floor(Date.now() / 1000) - 86400 * 7, data_limit: 21474836480, used_traffic: 15032385536, data_limit_reset_strategy: "no_reset", proxies: { vmess: {} }, inbounds: { vmess: ["VMESS_WS"] }, note: null, sub_updated_at: null, sub_last_user_agent: null, online_at: new Date(Date.now() - 86400000 * 7).toISOString(), created_at: "2024-08-30T12:00:00Z" },
  { username: "duygu_akin", status: "active", expire: Math.floor(Date.now() / 1000) + 86400 * 60, data_limit: 0, used_traffic: 53687091200, data_limit_reset_strategy: "no_reset", proxies: { vless: {} }, inbounds: { vless: ["VLESS_TCP"] }, note: "Kurumsal - sinirsiz plan", sub_updated_at: new Date().toISOString(), sub_last_user_agent: "NekoBox/1.2.5", online_at: new Date(Date.now() - 1200000).toISOString(), created_at: "2024-03-15T10:00:00Z" },
  { username: "hasan_yurt", status: "disabled", expire: Math.floor(Date.now() / 1000) + 86400 * 15, data_limit: 10737418240, used_traffic: 3221225472, data_limit_reset_strategy: "no_reset", proxies: { trojan: {} }, inbounds: { trojan: ["Trojan_TCP"] }, note: null, sub_updated_at: null, sub_last_user_agent: null, online_at: null, created_at: "2024-11-20T14:00:00Z" },
  { username: "ece_kara", status: "limited", expire: Math.floor(Date.now() / 1000) + 86400 * 22, data_limit: 5368709120, used_traffic: 5368709120, data_limit_reset_strategy: "no_reset", proxies: { vmess: {} }, inbounds: { vmess: ["VMESS_WS"] }, note: "Yenileme bekleniyor", sub_updated_at: null, sub_last_user_agent: null, online_at: null, created_at: "2024-10-28T09:30:00Z" },
];

const DEMO_NODES: Node[] = [
  { id: 1, name: "DE-Frankfurt-01", address: "de-01.vpnserver.net", port: 62050, api_port: 62051, status: "connected", xray_version: "1.8.11", message: null, add_as_new_host: true },
  { id: 2, name: "NL-Amsterdam-01", address: "nl-01.vpnserver.net", port: 62050, api_port: 62051, status: "connected", xray_version: "1.8.11", message: null, add_as_new_host: true },
  { id: 3, name: "FI-Helsinki-01", address: "fi-01.vpnserver.net", port: 62050, api_port: 62051, status: "error", xray_version: null, message: "Connection timeout after 30s", add_as_new_host: false },
  { id: 4, name: "US-NewYork-01", address: "us-ny.vpnserver.net", port: 62050, api_port: 62051, status: "connected", xray_version: "1.8.10", message: null, add_as_new_host: true },
];

export class DemoMarzbanClient {
  private _cpuBase = rand(15, 35);
  private _tick = 0;

  async getSystemStats(): Promise<SystemStats> {
    await sleep(400);
    this._tick++;
    const cpuNoise = Math.sin(this._tick * 0.3) * 12 + rand(-5, 5);
    const cpu = Math.max(5, Math.min(95, this._cpuBase + cpuNoise));
    return {
      version: "0.5.2",
      mem_total: 8589934592,
      mem_used: 3758096384 + rand(-200000000, 200000000),
      cpu_cores: 4,
      cpu_usage: parseFloat(cpu.toFixed(1)),
      total_user: DEMO_USERS.length,
      users_active: 8,
      users_disabled: 2,
      users_expired: 2,
      users_limited: 2,
      users_on_hold: 1,
      online_users: rand(3, 7),
      incoming_bandwidth: 1_285_000_000_000,
      outgoing_bandwidth: 3_840_000_000_000,
      incoming_bandwidth_speed: rand(1_500_000, 8_000_000),
      outgoing_bandwidth_speed: rand(2_000_000, 12_000_000),
    };
  }

  async getUsers(params?: { offset?: number; limit?: number; status?: string; search?: string }) {
    await sleep(300);
    let filtered = [...DEMO_USERS];
    if (params?.status) filtered = filtered.filter(u => u.status === params.status);
    if (params?.search) filtered = filtered.filter(u => u.username.includes(params.search!.toLowerCase()));
    const offset = params?.offset ?? 0;
    const limit = params?.limit ?? 15;
    return { users: filtered.slice(offset, offset + limit), total: filtered.length };
  }

  async getNodes(): Promise<Node[]> {
    await sleep(350);
    return DEMO_NODES;
  }

  async getNodesUsage(): Promise<NodesUsageResponse> {
    await sleep(300);
    return {
      usages: [
        { node_id: null, node_name: "Master", uplink: 312_000_000_000, downlink: 890_000_000_000 },
        { node_id: 1, node_name: "DE-Frankfurt-01", uplink: 428_000_000_000, downlink: 1_200_000_000_000 },
        { node_id: 2, node_name: "NL-Amsterdam-01", uplink: 355_000_000_000, downlink: 980_000_000_000 },
        { node_id: 4, node_name: "US-NewYork-01", uplink: 190_000_000_000, downlink: 770_000_000_000 },
      ],
    };
  }

  async getUserUsage() {
    await sleep(200);
    return { usages: [] };
  }

  async getUsersUsage() {
    await sleep(200);
    return { usages: [] };
  }
}
