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

## Artifacts

### X-Pro Bego — Marzban Panel (`artifacts/marzban-analytics`)
- **Type**: react-vite, hosted at `/`
- **Purpose**: Full Marzban VPN management panel rebranded as "X-Pro Bego"
- **Features** (all original Marzban features preserved + enterprise suite):
  - Login page with configurable Server URL field (stores in localStorage via `xprobego_server_url` key)
  - Full user management (create/edit/delete/search/paginate)
  - Node settings and usage, Host settings, Core (Xray) settings, System stats
  - Multi-language support (en/fa/ru/zh)
  - Dark mode (default), light theme toggle
  - Admin Manager in Settings (`/settings`)
  - **Enterprise Pages** (all connected to real PostgreSQL via API server):
    - `/analytics` — Traffic analytics with ApexCharts (line/bar), traffic snapshots, CSV export
    - `/subscription-plans` — Full CRUD plan management (Bronze/Silver/Gold/Platinum)
    - `/resellers` — 4-tier hierarchy (master/distributor/reseller/sub_reseller), balance management
    - `/api-keys` — API key creation (one-time reveal), revoke, delete, permission scopes
    - `/ip-manager` — Whitelist/Blacklist tabs with IP/CIDR add/remove
    - `/audit-log` — Full audit log with search, filter by admin/action, CSV export, pagination
    - `/webhooks` — CRUD webhooks (11 event types), real HTTP test trigger
    - `/backups` — Manual + scheduled backup UI
    - `/telegram-bot` — Bot token config, per-event notification templates, real Telegram test send
    - `/automation` — Auto-renew, auto-deactivate, expiry reminders, suspicious traffic detection
- **Branding**: Title "X-Pro Bego", custom 3D cube SVG logo, Footer "X-Pro Bego — Powered by Marzban"
- **Mock middleware**: `vite.config.ts` → `marzbanMockPlugin()` intercepts Marzban API calls in dev
- **Proxy**: `/xpbapi` → `http://localhost:8080/api` (API server enterprise features)
- **Key files**:
  - `src/service/xpbApi.ts` — Enterprise API client (all 9 feature areas)
  - `src/pages/Router.tsx` — routing with `protectedRoute()` helper
  - `src/pages/Login.tsx` — branded login with server URL field
  - `src/service/http.ts` — runtime-configurable Marzban API base URL

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API, hosted at port 8080
- **Routes prefix**: `/api/`
- **Authentication**: `Authorization: Bearer <token>` required on all routes
- **Enterprise endpoints**:
  - `GET/POST/PUT/DELETE /api/plans` — Subscription plan CRUD
  - `GET/POST/PUT/DELETE /api/resellers` + `POST /api/resellers/:id/balance`
  - `GET/POST /api/api-keys` + `PATCH /api/api-keys/:id/revoke` + `DELETE /api/api-keys/:id`
  - `GET/POST/DELETE /api/ip-rules` (with `?type=whitelist|blacklist`)
  - `GET/POST /api/audit-logs` (with filter params: admin, action, search, limit, offset)
  - `GET/POST/PUT/DELETE /api/webhooks` + `POST /api/webhooks/:id/test` (real HTTP call)
  - `GET/PUT /api/bot-settings` + `POST /api/bot-settings/test` (real Telegram API call)
  - `GET/PUT /api/automation`
  - `GET /api/analytics/snapshots` + `POST /api/analytics/snapshot`
- **Key files**:
  - `src/routes/index.ts` — all route aggregation
  - `src/middlewares/auth.ts` — Bearer token auth check

## Database (`lib/db`)
- **Tables** (all created via `pnpm --filter @workspace/db push`):
  - `subscription_plans` — Plan tiers with pricing and limits
  - `resellers` — 4-tier reseller hierarchy with balance
  - `api_keys` — Hashed API keys with permission scopes
  - `ip_rules` — Whitelist/blacklist IP rules
  - `audit_logs` — Admin action audit trail
  - `webhooks` — Webhook endpoints with event subscriptions
  - `bot_settings` — Telegram bot configuration and templates
  - `automation_settings` — Auto-renew/deactivate/reminder rules
  - `traffic_snapshots` — Analytics time-series data
- **Push command**: `pnpm --filter @workspace/db push`
- **Schema**: `lib/db/src/schema/index.ts`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db push` — sync schema to PostgreSQL

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
