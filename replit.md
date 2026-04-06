# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### X-Pro Bego — Marzban Panel (`artifacts/marzban-analytics`)
- **Type**: react-vite, hosted at `/`
- **Purpose**: Full Marzban VPN management panel rebranded as "X-Pro Bego"
- **Features** (all original Marzban features preserved):
  - Login page with configurable Server URL field (stores in localStorage via `xprobego_server_url` key)
  - Full user management (create/edit/delete/search/paginate)
  - Node settings and usage
  - Host settings
  - Core (Xray) settings with live log streaming (WebSocket)
  - System stats (CPU, RAM, bandwidth)
  - Multi-language support (en/fa/ru/zh)
  - Dark/light theme toggle
  - **NEW**: Settings page (`/settings`) with Admin Manager (create/edit/delete admins, set sudo/no-sudo)
- **Branding changes from Marzban**:
  - Title: "X-Pro Bego" (page title, header, login screen)
  - Logo: Custom 3D animated cube SVG with "X" letter (`XProLogo.tsx`)
  - Footer: "X-Pro Bego — Powered by Marzban"
  - Removed: GitHub star button, Donation menu item
- **Tech**: React 18, Chakra UI v2, React Router v6, React Query v3, zustand, ofetch, i18next, vite-plugin-svgr
- **API**: Connects dynamically to any Marzban instance (server URL set at login)
- **Key files**:
  - `src/pages/Login.tsx` — branded login with server URL field
  - `src/pages/Settings.tsx` — Admin Manager (NEW)
  - `src/pages/Router.tsx` — routing with auth guard
  - `src/service/http.ts` — runtime-configurable API base URL
  - `src/constants/Project.ts` — APP_NAME, SERVER_URL_KEY
  - `src/assets/XProLogo.tsx` — inline 3D cube SVG component
  - `public/statics/locales/` — i18n translation files (en/fa/ru/zh)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/marzban-analytics run dev` — run X-Pro Bego panel

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
