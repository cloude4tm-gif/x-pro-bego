import type { VpnUser } from "@workspace/db";
import type { XrayConfig, XrayInbound } from "./xray.js";

function getServerIp(): string {
  return process.env.SERVER_IP || process.env.SERVER_HOST || "127.0.0.1";
}

function generateVlessLink(user: VpnUser, inbound: XrayInbound, serverIp: string): string {
  const ss = inbound.streamSettings || {};
  const security = ss.security || "none";
  const network = ss.network || "tcp";

  const params: Record<string, string> = {
    encryption: "none",
    type: network,
    security,
  };

  if (security === "reality" && ss.realitySettings) {
    const rs = ss.realitySettings;
    if (rs.serverNames?.length) params.sni = rs.serverNames[0];
    if (rs.publicKey) params.pbk = rs.publicKey;
    if (rs.shortIds?.length) params.sid = rs.shortIds[0];
    params.fp = rs.fingerprint || "chrome";
  } else if (security === "tls" && ss.tlsSettings) {
    const tls = ss.tlsSettings;
    if (tls.serverName) params.sni = tls.serverName;
  }

  if (network === "ws" && ss.wsSettings) {
    if (ss.wsSettings.path) params.path = ss.wsSettings.path;
    if (ss.wsSettings.headers?.Host) params.host = ss.wsSettings.headers.Host;
  } else if (network === "grpc" && ss.grpcSettings) {
    if (ss.grpcSettings.serviceName) params.serviceName = ss.grpcSettings.serviceName;
  } else if (network === "h2" && ss.httpSettings) {
    if (ss.httpSettings.path) params.path = ss.httpSettings.path;
    if (ss.httpSettings.host?.length) params.host = ss.httpSettings.host[0];
  }

  const query = new URLSearchParams(params).toString();
  const tag = encodeURIComponent(`${user.username} (${inbound.tag})`);
  return `vless://${user.uuid}@${serverIp}:${inbound.port}?${query}#${tag}`;
}

function generateVmessLink(user: VpnUser, inbound: XrayInbound, serverIp: string): string {
  const ss = inbound.streamSettings || {};
  const security = ss.security || "none";
  const network = ss.network || "tcp";

  const obj: Record<string, any> = {
    v: "2",
    ps: `${user.username} (${inbound.tag})`,
    add: serverIp,
    port: inbound.port,
    id: user.uuid,
    aid: 0,
    net: network,
    type: "none",
    tls: security === "tls" ? "tls" : "",
  };

  if (network === "ws" && ss.wsSettings) {
    obj.path = ss.wsSettings.path || "/";
    obj.host = ss.wsSettings.headers?.Host || "";
  } else if (network === "grpc" && ss.grpcSettings) {
    obj.path = ss.grpcSettings.serviceName || "";
  }

  if (security === "tls" && ss.tlsSettings) {
    obj.sni = ss.tlsSettings.serverName || "";
  }

  return `vmess://${Buffer.from(JSON.stringify(obj)).toString("base64")}`;
}

function generateTrojanLink(user: VpnUser, inbound: XrayInbound, serverIp: string): string {
  const ss = inbound.streamSettings || {};
  const security = ss.security || "tls";
  const network = ss.network || "tcp";

  const params: Record<string, string> = { security, type: network };

  if (security === "tls" && ss.tlsSettings?.serverName) {
    params.sni = ss.tlsSettings.serverName;
  } else if (security === "reality" && ss.realitySettings) {
    const rs = ss.realitySettings;
    if (rs.serverNames?.length) params.sni = rs.serverNames[0];
    if (rs.publicKey) params.pbk = rs.publicKey;
    if (rs.shortIds?.length) params.sid = rs.shortIds[0];
    params.fp = rs.fingerprint || "chrome";
  }

  if (network === "ws" && ss.wsSettings?.path) {
    params.path = ss.wsSettings.path;
  }

  const query = new URLSearchParams(params).toString();
  const tag = encodeURIComponent(`${user.username} (${inbound.tag})`);
  return `trojan://${user.uuid}@${serverIp}:${inbound.port}?${query}#${tag}`;
}

function generateShadowsocksLink(user: VpnUser, inbound: XrayInbound, serverIp: string): string {
  const method = inbound.settings?.method || "chacha20-ietf-poly1305";
  const credentials = Buffer.from(`${method}:${user.uuid}`).toString("base64url");
  const tag = encodeURIComponent(`${user.username} (${inbound.tag})`);
  return `ss://${credentials}@${serverIp}:${inbound.port}#${tag}`;
}

export function generateLinksForUser(user: VpnUser, config: XrayConfig): string[] {
  const serverIp = getServerIp();
  const links: string[] = [];
  const userInbounds = (user.inbounds as Record<string, string[]>) || {};

  for (const inbound of config.inbounds || []) {
    const proto = inbound.protocol;
    const selectedTags = userInbounds[proto] || [];
    if (!selectedTags.includes(inbound.tag)) continue;

    if (proto === "vless") {
      links.push(generateVlessLink(user, inbound, serverIp));
    } else if (proto === "vmess") {
      links.push(generateVmessLink(user, inbound, serverIp));
    } else if (proto === "trojan") {
      links.push(generateTrojanLink(user, inbound, serverIp));
    } else if (proto === "shadowsocks") {
      links.push(generateShadowsocksLink(user, inbound, serverIp));
    }
  }

  return links;
}

export function encodeSubscription(links: string[]): string {
  return Buffer.from(links.join("\n")).toString("base64");
}
