# EcoDrishti AI

Nepal's First School Climate Intelligence Platform — a full-stack web app helping schools measure carbon footprints, track sustainability progress, and engage students in data-driven climate action.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from $PORT env, routed at /api)
- `pnpm --filter @workspace/ecodrishti run dev` — run the Vite frontend (port from $PORT env, routed at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifact: `artifacts/api-server`)
- Frontend: React 18 + Vite + Tailwind CSS + shadcn/ui (artifact: `artifacts/ecodrishti`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec`)
- Generated hooks: `lib/api-client-react/src/generated/api.ts`
- Generated Zod schemas: `lib/api-zod/src/generated/api.ts`
- Charts: Recharts
- Routing: Wouter
- i18n: Custom LanguageContext (EN/NP)

## Where things live

- `lib/db/src/schema/` — DB schema (source of truth for all tables)
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `artifacts/api-server/src/routes/` — All Express route handlers
- `artifacts/ecodrishti/src/pages/` — All React page components
- `artifacts/ecodrishti/src/contexts/` — AuthContext, LanguageContext, ThemeContext
- `artifacts/ecodrishti/src/components/` — Shared components (AppLayout, UI)

## Architecture decisions

- **Token auth via Bearer header**: Token is `base64(userId:email:timestamp)`, stored in localStorage. `setAuthTokenGetter` from `@workspace/api-client-react` must be called in AuthContext to attach tokens to all API requests.
- **Nepal emission factors**: Electricity 0.04 kg/kWh (hydro grid), water 0.0003 kg/L, waste 0.5 kg/kg, bus 0.05 kg/student/day, car 0.12 kg/student/day, diesel 2.31 kg/L.
- **Sustainability score formula**: `max(0, min(100, 100 - (totalKg / personCount) * 5))`
- **League tiers**: Champion ≥85, Leader ≥70, Achiever ≥50, Starter <50
- **Password hashing**: SHA-256 of `password + "eco_salt_2025"`
- **Generated code**: Do NOT re-run codegen (`pnpm --filter @workspace/api-spec run codegen`) unless the OpenAPI spec changes — it overwrites `lib/api-client-react/src/generated/` and `lib/api-zod/src/generated/`.

## Product

- **Landing Page**: Bilingual EN/NP hero with stats, features, and CTAs
- **Dashboard**: Animated KPI cards (sustainability score, CO₂, eco points), emissions trend chart (Recharts AreaChart), category breakdown (RadarChart), league rank widget
- **Carbon Calculator**: Multi-step form (energy → water → waste → transport), real-time emissions preview, AI recommendations
- **Monthly Reports**: Auto-generated reports with Inter-School Eco League rankings
- **Community Hub**: Posts (achievement/tip/awareness/question/celebration), shared resources (books, lab equipment)
- **Eco Challenges**: Active/upcoming/completed challenges with join/complete flow
- **League**: National ranking table with tier badges, school comparison charts

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **Always call `setAuthTokenGetter`** in AuthContext when the token changes — without it the Bearer header is never sent and all authenticated API requests return 401.
- **DB column names** differ from the OpenAPI field names (camelCase). Key differences: `student_count`/`staff_count` (not `students`/`staff`), `donor_name` (not `school_name` in shared_resources), no `generated_at` on reports (use `created_at`).
- **Select `onValueChange` returns `string`** — cast to the specific enum type when updating typed state: `v as CommunityPostInputCategory`.
- **`useLogout` mutate takes no args** — call `logoutMutation.mutate()` not `mutate({})`.
- Demo credentials: `admin@ecodrishti.edu` / `password123`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
