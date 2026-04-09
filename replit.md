# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (`@workspace/db`)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Architecture — Marzban'dan BAĞIMSIZ

Panel artık tamamen bağımsız çalışır. Marzban gerektirmez.

**Akış (Üretimde):**
```
Browser → Nginx port 80 → Express port 8080 → PostgreSQL
                                            ↓
                                       Xray (pm2: xprobego-xray)
```

**Frontend → API:**
- Dev mod: `marzbanMockPlugin()` sahte veri sunar, `/api` Vite proxy → Express
- Üretim: Tüm çağrılar `/api/` üzerinden Express'e (IS_DEV=false → PROXY_BASE="/api")

## Artifacts

### X-Pro Bego Panel (`artifacts/marzban-analytics`)
- **Type**: react-vite, hosted at `/`
- **Purpose**: Bağımsız VPN yönetim paneli (Marzban frontend'ini kaynak aldı)
- **Features**:
  - Login, kullanıcı yönetimi (create/edit/delete), sistem istatistikleri
  - Core (Xray) ayarları, inbound yönetimi, subscription link üretimi
  - Multi-language (en/fa/ru/zh), dark mode, admin yönetimi
  - **Enterprise**: analytics, subscription-plans, resellers, api-keys, ip-manager, audit-log, webhooks, telegram-bot, automation
- **Key files**:
  - `src/service/http.ts` — Prod'da /api, dev'de mockPlugin veya serverUrl
  - `src/pages/Login.tsx` — Giriş sayfası (server URL alanı dev'de kullanılır)
  - `vite.config.ts` — marzbanMockPlugin + /api proxy

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API, port 8080
- **Marzban-uyumlu endpoint'ler** (frontend hiç değişmeden çalışır):
  - `POST /api/admin/token` — JWT ile giriş (ilk admin otomatik oluşur)
  - `GET/POST/PUT/DELETE /api/admin/:username` — Admin yönetimi
  - `GET /api/admins` — Admin listesi
  - `GET/POST/PUT/DELETE /api/user/:username` — VPN kullanıcı CRUD
  - `GET /api/users` — Kullanıcı listesi
  - `GET /api/user/:username/subscription` — Subscription link (base64)
  - `GET /api/sub/:token` — Subscription by token
  - `GET/PUT /api/core/config` — Xray config (DB'den)
  - `POST /api/core/restart` — Xray yeniden başlat
  - `GET /api/core` — Xray version/status
  - `GET /api/system` — CPU/RAM/kullanıcı istatistikleri
  - `GET /api/inbounds` — Xray inbound listesi
- **Enterprise endpoint'ler**: /api/plans, /api/resellers, /api/api-keys, /api/ip-rules, /api/audit-logs, /api/webhooks, /api/bot-settings, /api/automation
- **Key files**:
  - `src/routes/xpro/` — Tüm bağımsız VPN endpoint'leri
  - `src/lib/xray.ts` — Xray config yönetimi (DB + dosya), restart
  - `src/lib/subscription.ts` — VLESS/VMess/Trojan/Shadowsocks link üretimi
  - `src/lib/auth.ts` — JWT imzalama/doğrulama, bcrypt
  - `src/app.ts` — Startup'ta Xray config dosyasını DB'ye yükler

## Database (`lib/db`)
- **Tabloları oluştur**: `pnpm --filter @workspace/db push`
- **Schema**: `lib/db/src/schema/index.ts`
- **Tablolar**:
  - `vpn_users` — VPN kullanıcıları (UUID, trafik, expire, inbounds)
  - `xpro_admins` — Panel yöneticileri (bcrypt şifre, JWT)
  - `xray_config` — Xray JSON konfigürasyonu (DB'de saklı)
  - `subscription_plans`, `resellers`, `api_keys`, `ip_rules`, `audit_logs`, `webhooks`, `bot_settings`, `automation_settings`, `traffic_snapshots`

## Kurulum (VPS)

```bash
bash install.sh
```

Kurulum yapılanlar:
1. Standalone Xray kurulur (Marzban yok)
2. x25519 key pair üretilir (VLESS+Reality için)
3. PostgreSQL + tüm tablolar kurulur
4. API server + Xray → PM2 ile başlatılır
5. Nginx → Frontend static + /api/ proxy
6. İlk giriş: `admin` + kendi şifren (otomatik kaydedilir)

## Subscription Link Üretimi

- **VLESS+Reality**: `vless://UUID@IP:443?security=reality&sni=dl.google.com&pbk=PUBLIC_KEY&sid=...`
- **Shadowsocks**: `ss://base64url(method:UUID)@IP:1080#username`
- **VMess**: `vmess://base64(json)`
- **Trojan**: `trojan://UUID@IP:port?...`

`SERVER_IP` env var ile hangi IP kullanılacağı belirlenir.

## Key Commands

- `pnpm --filter @workspace/db push` — DB şemasını PostgreSQL'e uygula
- `pnpm --filter @workspace/api-server run build` — API server derle
- `pnpm --filter @workspace/marzban-analytics run build` — Frontend derle
