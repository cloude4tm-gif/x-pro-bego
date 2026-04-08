import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;
const basePath = process.env.BASE_PATH || "/";

function marzbanMockPlugin(): Plugin {
  const mockUsers = [
    { username: "ali_vip", status: "active", used_traffic: 2147483648, data_limit: 10737418240, expire: Math.floor(Date.now()/1000) + 86400*30, proxies: { vless: {}, vmess: {} }, inbounds: { vless: ["VLESS TCP REALITY"], vmess: ["VMess WebSocket"] }, created_at: new Date().toISOString(), links: [], subscription_url: "https://marzban.example.com/sub/ali_vip", note: "" },
    { username: "mehmet_pro", status: "active", used_traffic: 5368709120, data_limit: 10737418240, expire: Math.floor(Date.now()/1000) + 86400*15, proxies: { trojan: {} }, inbounds: { trojan: ["Trojan gRPC"] }, created_at: new Date().toISOString(), links: [], subscription_url: "https://marzban.example.com/sub/mehmet_pro", note: "" },
    { username: "test_user", status: "limited", used_traffic: 10737418240, data_limit: 10737418240, expire: Math.floor(Date.now()/1000) + 86400*5, proxies: { shadowsocks: {} }, inbounds: { shadowsocks: ["Shadowsocks TCP"] }, created_at: new Date().toISOString(), links: [], subscription_url: "https://marzban.example.com/sub/test_user", note: "" },
    { username: "expired_demo", status: "expired", used_traffic: 1073741824, data_limit: 5368709120, expire: Math.floor(Date.now()/1000) - 86400*2, proxies: { vless: {} }, inbounds: { vless: ["VLESS TCP REALITY"] }, created_at: new Date().toISOString(), links: [], subscription_url: "https://marzban.example.com/sub/expired_demo", note: "" },
    { username: "ayse_basic", status: "active", used_traffic: 536870912, data_limit: 2147483648, expire: Math.floor(Date.now()/1000) + 86400*60, proxies: { vmess: {} }, inbounds: { vmess: ["VMess WebSocket"] }, created_at: new Date().toISOString(), links: [], subscription_url: "https://marzban.example.com/sub/ayse_basic", note: "" },
    { username: "on_hold_user", status: "on_hold", used_traffic: 0, data_limit: 5368709120, expire: null, proxies: { vless: {} }, inbounds: { vless: ["VLESS TCP REALITY"] }, created_at: new Date().toISOString(), links: [], subscription_url: "https://marzban.example.com/sub/on_hold_user", note: "" },
  ];

  return {
    name: "marzban-mock-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";
        const json = (data: object, status = 200) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(JSON.stringify(data));
        };

        const MOCK_PATHS = ["/admin/token", "/admin", "/admins", "/system", "/users", "/inbounds", "/nodes", "/hosts", "/node"];
        const isMockPath = MOCK_PATHS.some(p => url === p || url.startsWith(p + "?") || url.startsWith(p + "/"));

        if (!isMockPath) return next();

        if (req.method === "OPTIONS") {
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
          res.statusCode = 204;
          res.end();
          return;
        }

        if (url === "/admin/token") {
          return json({ access_token: "demo_token_xprobego", token_type: "bearer" });
        }
        if (url === "/admin") {
          return json({ username: "admin", is_sudo: true, telegram_id: null, discord_webhook: null });
        }
        if (url === "/admins") {
          return json([
            { username: "admin", is_sudo: true, telegram_id: "@xprobego_admin", discord_webhook: null },
            { username: "operator1", is_sudo: false, telegram_id: null, discord_webhook: null },
          ]);
        }
        if (url === "/system" || url.startsWith("/system?")) {
          return json({
            version: "0.5.2",
            mem_total: 8589934592,
            mem_used: 3221225472,
            cpu_cores: 4,
            cpu_usage: 18.5,
            total_user: mockUsers.length,
            users_active: 3,
            incoming_bandwidth: 15728640000,
            outgoing_bandwidth: 31457280000,
            incoming_bandwidth_speed: 1048576,
            outgoing_bandwidth_speed: 2097152,
          });
        }
        if (url === "/users" || url.startsWith("/users?")) {
          return json({ users: mockUsers, total: mockUsers.length });
        }
        if (url === "/inbounds" || url.startsWith("/inbounds?")) {
          return json({
            vless: [{ tag: "VLESS TCP REALITY", protocol: "vless", network: "tcp", tls: "reality", port: 443 }],
            vmess: [{ tag: "VMess WebSocket", protocol: "vmess", network: "ws", tls: "tls", port: 8443 }],
            trojan: [{ tag: "Trojan gRPC", protocol: "trojan", network: "grpc", tls: "tls", port: 443 }],
            shadowsocks: [{ tag: "Shadowsocks TCP", protocol: "shadowsocks", network: "tcp", tls: "none", port: 1080 }],
          });
        }
        if (url === "/nodes" || url.startsWith("/nodes?")) {
          return json([
            { id: 1, name: "Germany-01", address: "de1.example.com", port: 62050, api_port: 62051, status: "connected", xray_version: "1.8.3", usage_coefficient: 1.0 },
            { id: 2, name: "Netherlands-01", address: "nl1.example.com", port: 62050, api_port: 62051, status: "connected", xray_version: "1.8.3", usage_coefficient: 1.0 },
            { id: 3, name: "Finland-01", address: "fi1.example.com", port: 62050, api_port: 62051, status: "error", xray_version: "1.8.1", usage_coefficient: 1.0 },
          ]);
        }
        if (url === "/hosts" || url.startsWith("/hosts?")) {
          return json({
            "VLESS TCP REALITY": [{ remark: "DE-01", address: "de1.example.com", port: 443, sni: "google.com", host: "", path: "/", security: "reality", alpn: "", fingerprint: "chrome", allowinsecure: false, is_disabled: false, mux_enable: false }],
            "VMess WebSocket": [{ remark: "NL-01", address: "nl1.example.com", port: 8443, sni: "cdn.example.com", host: "cdn.example.com", path: "/ws", security: "tls", alpn: "", fingerprint: "", allowinsecure: false, is_disabled: false, mux_enable: false }],
          });
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    tsconfigPaths(),
    react({ include: "**/*.tsx" }),
    svgr({ include: "**/*.svg" }),
    marzbanMockPlugin(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({ root: path.resolve(import.meta.dirname, "..") })
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) => m.devBanner()),
          await import("@replit/vite-plugin-runtime-error-modal").then((m) => m.default()),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  define: {
    "import.meta.env.BASE_URL": JSON.stringify(basePath),
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: false },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
