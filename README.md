# Wazobia

> A persistent online Lagos where players live, work, socialize, build businesses, own property, trade with each other, and collectively shape the city.

Monorepo: Next.js + React Three Fiber frontend, Go modular-monolith backend, PostgreSQL (truth) + Redis (presence/realtime).

See `docs/` for product vision (`intro.md`), engineering spec (`guide.md`), social systems (`social.md`).

## Stack

```text
Browser (Next.js + R3F) -- HTTPS/WS --> Go backend --> PostgreSQL + Redis
```

- Frontend: Next.js, TypeScript, React, Three.js / React Three Fiber, Tailwind
- Backend: Go, chi, pgx, go-redis, nhooyr/websocket
- Infra: Docker Compose, PostgreSQL 16, Redis 7
- Protocol: `packages/protocol` (single source of truth, TS-first)

## Quickstart

```bash
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up --build
# web: http://localhost:3001
# api: http://localhost:8081/healthz
```

Run natively:

```bash
# backend
cd apps/server && go run ./cmd/server

# frontend
cd apps/web && npm install && npm run dev
```

## Repo layout

```text
wazobia/
├── apps/
│   ├── web/            # Next.js + R3F (visual world, NOT authoritative)
│   │   ├── app/
│   │   ├── components/
│   │   ├── game/       # world/player/buildings/camera/networking
│   │   └── lib/
│   └── server/         # Go authoritative world
│       ├── cmd/server/
│       └── internal/   # auth/player/world/movement/presence/economy/...
├── packages/
│   ├── protocol/       # PlayerState, Position, MovementUpdate, ChatMessage...
│   ├── shared-types/
│   └── game-config/
├── infra/
│   ├── docker/
│   └── migrations/     # Postgres migrations, one per vertical slice
├── docs/
└── README.md
```

## Rules (from guide.md §58)

1. Do not rewrite architecture without approval.
2. No microservices prematurely — modular monolith.
3. No business logic in React components.
4. Never trust client with money/ownership.
5. No high-frequency movement writes to Postgres (Redis only).
6. No broadcast-everything; interest management by zone.
7. Redis is NOT financial source of truth.
8. All financial mutations transactional.
9. Financial commands idempotent.
10. Vertical slices only. Tests for economy logic.
