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

### Marzban Analytics Dashboard (`artifacts/marzban-analytics`)
- **Type**: react-vite, hosted at `/`
- **Purpose**: Advanced analytics dashboard for Marzban VPN panel
- **Features**:
  - Login page (Marzban URL + admin token)
  - Real-time system stats (CPU, RAM, bandwidth)
  - User status breakdown (pie chart)
  - Live bandwidth monitoring (area chart)
  - Top users by usage
  - Node statistics and usage comparison
  - Full user list with pagination, search, and status filtering
  - Node details page
- **Tech**: React, Recharts, Framer Motion, Tailwind CSS (dark theme)
- **Data**: Connects directly to any Marzban instance via its REST API

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/marzban-analytics run dev` — run Marzban analytics dashboard

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
