# Tute Subastado

Monorepo for building a multiplayer **Tute Subastado** application where a user can play against bots or other players online.

Current state: the project includes a functional local web vertical slice (1 human + 3 bots) plus a realtime server scaffold for multiplayer.

## Table of Contents

1. Project Goals
2. Monorepo Structure
3. Tech Stack
4. Current Features
5. Gameplay Rules Implemented (Current)
6. Local Setup
7. Development Commands
8. Architecture Notes
9. Realtime Layer (Current API)
10. Roadmap
11. Known Gaps
12. Contribution Notes

## 1. Project Goals

- Build a playable, maintainable implementation of Tute Subastado.
- Support two game modes:
  - Local mode (human vs bots).
  - Online multiplayer (rooms/tables via realtime server).
- Keep game rules in reusable modules so web UI and realtime backend share consistent logic.

## 2. Monorepo Structure

- `apps/web`: Next.js frontend.
- `apps/realtime`: Express + Socket.IO realtime service (table/lobby scaffold).
- `packages/game-engine`: shared game engine package (currently minimal in package workspace).
- `packages/shared`: shared types/contracts package (currently minimal in package workspace).

### Key Files

- `apps/web/src/app/page.tsx`: main playable screen (local vertical slice).
- `apps/web/src/lib/tute.ts`: core local game logic (deck, bidding, turns, trick resolution, scoring, bot actions).
- `apps/realtime/src/index.ts`: Socket.IO server with initial table create/join flow.

## 3. Tech Stack

- Node.js + npm workspaces
- TypeScript
- Next.js (App Router) + React
- Tailwind CSS v4
- Express + Socket.IO
- Zod (shared event validation groundwork)

## 4. Current Features

### Web app (`apps/web`)

- Complete local hand loop:
  - Deal cards
  - Bidding phase
  - Trump selection
  - Trick play
  - Contract result
- Human controls for bidding, trump choice, and card play.
- 3 bots with simple heuristics for bidding, trump choice, and card play.
- Trick/legal-play validation aligned with core Tute Subastado obligations:
  - Asistir (follow suit)
  - Montar (raise if possible)
  - Fallar (trump if void)
  - Pisar (overtrump when possible)
  - Contrafallar (if no overtrump available, free play)
- Automatic canto detection/scoring (20 normal suit, 40 trump) with in-game celebratory notification.
- Post-trick result notification that keeps table cards visible briefly before next action.
- Event log + phase/state panels for visibility and debugging.
- Dedicated rules page at `apps/web/src/app/reglas/page.tsx` (`/reglas` in the app).

### Realtime app (`apps/realtime`)

- Socket connection setup with CORS for local frontend.
- Table lifecycle basics:
  - `table:create`
  - `table:join`
  - `table:state` broadcast
- In-memory table storage.

## 5. Gameplay Rules Implemented (Current)

The local vertical slice currently applies:

- Spanish deck (40 cards).
- Rank point values:
  - As = 11
  - Tres = 10
  - Rey = 4
  - Caballo = 3
  - Sota = 2
  - Others = 0
- Last trick bonus: +10 points.
- Bidding from 60 upward in increments of 5 (up to 130).
- Highest bidder chooses trump.
- Trick winner computed by lead suit/trump and rank strength.
- Card-play obligations: asistir, montar, fallar, pisar, contrafallar.
- Canto:
  - Rey + Caballo of the same suit.
  - 20 points in non-trump suit.
  - 40 points in trump suit.
  - In this implementation canto is detected automatically when one of the pair is played while the other remains in hand.
- Contract success/failure checked for highest bidder at hand end.

Important: this is still a pragmatic implementation; regional variants and some advanced table conventions may differ.

## 6. Local Setup

## Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended

## Install dependencies

```bash
npm install
```

## Run full dev environment (web + realtime)

```bash
npm run dev
```

- Web: `http://localhost:3000`
- Realtime: `http://localhost:4000`

## 7. Development Commands

From repository root:

- `npm run dev`: run web + realtime in parallel
- `npm run dev:web`: run only frontend
- `npm run dev:realtime`: run only realtime backend
- `npm run build`: build web and realtime
- `npm run lint`: run web linting

Direct workspace commands:

- `npm run lint -w apps/web`
- `npm run build -w apps/web`
- `npm run build -w apps/realtime`

## 8. Architecture Notes

### Current split

- **UI + local game logic** currently lives under `apps/web`.
- **Realtime room orchestration** currently lives under `apps/realtime`.
- **Shared packages** exist and are intended to become the source of truth for:
  - game engine rules
  - socket event contracts
  - shared domain types

### Recommended next refactor

- Move `apps/web/src/lib/tute.ts` logic into `packages/game-engine`.
- Make both web and realtime consume the same engine package.
- Move event/type contracts into `packages/shared` and enforce them in both directions.

## 9. Realtime Layer (Current API)

Current socket events in `apps/realtime/src/index.ts`:

### Client -> Server

- `table:create` (no payload)
- `table:join` with:
  - `tableId: string`
  - `name: string`
  - `playerId: string`

### Server -> Client

- `table:state` with table summary:
  - `id`
  - `phase`
  - `players[]`

This layer is scaffold-level and does not yet run full gameplay synchronization.

## 10. Roadmap

1. Engine extraction and hardening
- Move full rules into `packages/game-engine`.
- Add deterministic tests for bidding/tricks/scoring.

2. Realtime game orchestration
- Add server-side authoritative game state.
- Implement full turn validation over sockets.
- Add reconnect/session recovery.

3. Multiplayer UI
- Room creation/join flow in web.
- Live table view with synchronized actions.

4. Product baseline
- Match history and stats.
- Basic authentication.
- Deployment-ready config and observability.

## 11. Known Gaps

- No persistence (in-memory state only).
- No authentication.
- No E2E or unit test suite yet.
- Ruleset is a practical baseline, not exhaustive tournament-level coverage.
- Realtime server does not yet execute full game engine flow.

## 12. Contribution Notes

- Keep rules logic deterministic and side-effect free.
- Prefer adding tests for rule changes before UI/realtime wiring.
- Avoid duplicating rule definitions across apps.
- Keep socket payloads typed and validated.

---

If you want, the next step can be to migrate the current engine file into `packages/game-engine` and wire both apps to it in one pass.
