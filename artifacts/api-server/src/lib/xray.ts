import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { db, xrayConfigTable, vpnUsersTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const execAsync = promisify(exec);

export const XRAY_CONFIG_PATH = process.env.XRAY_CONFIG_PATH || "/etc/x-pro-bego/xray.json";
export const XRAY_BINARY = process.env.XRAY_BINARY || "/usr/local/bin/xray";

export interface XrayInbound {
  tag: string;
  port: number;
  protocol: string;
  settings?: any;
  streamSettings?: any;
  sniffing?: any;
}

export interface XrayConfig {
  log?: any;
  api?: any;
  dns?: any;
  routing?: any;
  policy?: any;
  inbounds?: XrayInbound[];
  outbounds?: any[];
  transport?: any;
  stats?: any;
  reverse?: any;
}

export function defaultXrayConfig(): XrayConfig {
  return {
    log: { loglevel: "warning" },
    inbounds: [
      {
        tag: "Shadowsocks TCP",
        port: 1080,
        protocol: "shadowsocks",
        settings: {
          clients: [],
          method: "chacha20-ietf-poly1305",
          network: "tcp,udp",
        },
      },
    ],
    outbounds: [
      { tag: "direct", protocol: "freedom" },
      { tag: "block", protocol: "blackhole" },
    ],
    routing: {
      rules: [
        { type: "field", ip: ["geoip:private"], outboundTag: "block" },
        { type: "field", domain: ["geosite:category-ads"], outboundTag: "block" },
      ],
    },
  };
}

export async function readConfig(): Promise<XrayConfig> {
  const rows = await db.select().from(xrayConfigTable).orderBy(desc(xrayConfigTable.updatedAt)).limit(1);
  if (rows.length > 0) {
    return rows[0].configJson as XrayConfig;
  }
  return defaultXrayConfig();
}

export async function saveConfig(config: XrayConfig): Promise<void> {
  const rows = await db.select().from(xrayConfigTable).limit(1);
  if (rows.length > 0) {
    await db.update(xrayConfigTable).set({ configJson: config as any, updatedAt: new Date() }).where(eq(xrayConfigTable.id, rows[0].id));
  } else {
    await db.insert(xrayConfigTable).values({ configJson: config as any });
  }
}

export async function buildFullConfig(): Promise<XrayConfig> {
  const baseConfig = await readConfig();
  const users = await db.select().from(vpnUsersTable).where(eq(vpnUsersTable.status, "active"));

  const config: XrayConfig = JSON.parse(JSON.stringify(baseConfig));

  if (!config.inbounds) return config;

  for (const inbound of config.inbounds) {
    if (!inbound.settings) inbound.settings = {};

    if (inbound.protocol === "shadowsocks") {
      inbound.settings.clients = [];
      for (const user of users) {
        const userInbounds = (user.inbounds as Record<string, string[]>) || {};
        const ssInbounds = userInbounds["shadowsocks"] || [];
        if (ssInbounds.includes(inbound.tag)) {
          inbound.settings.clients.push({
            password: user.uuid,
            email: user.username,
          });
        }
      }
    } else if (inbound.protocol === "vless") {
      if (!inbound.settings.clients) inbound.settings.clients = [];
      inbound.settings.clients = [];
      for (const user of users) {
        const userInbounds = (user.inbounds as Record<string, string[]>) || {};
        const vlessInbounds = userInbounds["vless"] || [];
        if (vlessInbounds.includes(inbound.tag)) {
          inbound.settings.clients.push({
            id: user.uuid,
            email: user.username,
            flow: "",
          });
        }
      }
    } else if (inbound.protocol === "vmess") {
      if (!inbound.settings.clients) inbound.settings.clients = [];
      inbound.settings.clients = [];
      for (const user of users) {
        const userInbounds = (user.inbounds as Record<string, string[]>) || {};
        const vmessInbounds = userInbounds["vmess"] || [];
        if (vmessInbounds.includes(inbound.tag)) {
          inbound.settings.clients.push({
            id: user.uuid,
            email: user.username,
            alterId: 0,
          });
        }
      }
    } else if (inbound.protocol === "trojan") {
      if (!inbound.settings.clients) inbound.settings.clients = [];
      inbound.settings.clients = [];
      for (const user of users) {
        const userInbounds = (user.inbounds as Record<string, string[]>) || {};
        const trojanInbounds = userInbounds["trojan"] || [];
        if (trojanInbounds.includes(inbound.tag)) {
          inbound.settings.clients.push({
            password: user.uuid,
            email: user.username,
          });
        }
      }
    }
  }

  return config;
}

export async function writeConfigToFile(): Promise<void> {
  const config = await buildFullConfig();
  const dir = path.dirname(XRAY_CONFIG_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(XRAY_CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export async function restartCore(): Promise<void> {
  await writeConfigToFile();
  try {
    await execAsync(`pm2 restart xprobego-xray --update-env`);
  } catch {
    try {
      await execAsync(`systemctl restart xray`);
    } catch {
      await execAsync(`${XRAY_BINARY} run -c ${XRAY_CONFIG_PATH} &`);
    }
  }
}

export async function getCoreVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync(`${XRAY_BINARY} version`);
    const match = stdout.match(/Xray\s+([\d.]+)/i);
    return match ? match[1] : stdout.split("\n")[0].trim();
  } catch {
    return "unknown";
  }
}

export async function getCoreRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`pgrep -x xray || pm2 list | grep xprobego-xray | grep online`);
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

export function getInboundTags(config: XrayConfig): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const inbound of config.inbounds || []) {
    const proto = inbound.protocol;
    if (!result[proto]) result[proto] = [];
    result[proto].push(inbound.tag);
  }
  return result;
}
