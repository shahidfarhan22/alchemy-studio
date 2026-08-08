# Progress Log

## Current state
- Phase: M0 — Repo & tooling setup
- Last completed milestone: none yet (repo/docs/GitHub/DB setup done; app skeletons not yet scaffolded)
- Next milestone: M0 — scaffold Next.js frontend + ASP.NET Core backend, wire backend to the local Postgres DB

## Environment
- Repo path: `D:\New Project`, branch `main`. GitHub: [shahidfarhan22/alchemy-studio](https://github.com/shahidfarhan22/alchemy-studio) (public)
- How to run locally: not yet scaffolded (M0 in progress)
- Services running / credentials location: **local PostgreSQL 17** (native, `D:\postgres`, Windows service `postgresql-x64-17`) — dedicated role `alchemy_app` + database `alchemy_studio` created for this project. Credential (password) lives only in the owner's local `.env` (gitignored) and password manager — never shared in chat. See ADR-008 in `docs/decisions.md`.

## Open items
- [ ] Blocked on: nothing currently — proceeding with M0 scaffolding
- [ ] Deferred decision: store/brand name → GitHub repo is named `alchemy-studio` as a working name; affects domain, branding — see `docs/requirements.md` open items
- [ ] Deferred decision: file storage provider, email provider → decided at M2/M7 respectively (`docs/technology-stack.md`)
- [ ] Human action pending: install .NET 10 SDK — see `docs/human-actions.md`

## Session 2026-08-08

### What changed
- Gathered full requirements via Q&A (see `docs/requirements.md`): India-only e-commerce store for 3D-printed miniatures, catalog + custom orders (manual quoting), individual seller (no GST yet), lean budget, no fixed deadline, owner wants to learn tech and be closely involved.
- Stack decided: Next.js + TypeScript frontend, ASP.NET Core 8 (targeting .NET 10) backend, PostgreSQL, ASP.NET Core Identity for auth, Razorpay for payments (see `docs/technology-stack.md` and `docs/decisions.md`).
- Discovered a second Claude Code (CLI) session had been working in the same folder concurrently and had written `docs/prerequisites.md`. Reconciled: its useful findings (machine spec, .NET 10 recommendation, Docker/disk-space notes) were folded into `docs/technology-stack.md` and `docs/human-actions.md`; the original file removed to avoid duplicate sources of truth. User chose to continue with this (VS Code) session going forward.
- Initialized git repo (`main` branch), `.gitignore`, `frontend/`, `backend/`, `docs/` skeleton.
- Wrote initial planning docs: `requirements.md`, `product-plan.md`, `architecture.md`, `technology-stack.md`, `AGENTS.md`, `progress.md` (this file), `human-actions.md`, `costs.md`, `decisions.md`.

### What was verified, and how
- Environment probe run directly (VERIFIED): git 2.48.1, node 22.13.0, npm 10.9.2, dotnet SDKs 8.0.204 + 8.0.406 both present, Docker CLI 27.5.1 (daemon was not running at probe time), no psql/gh installed, network reachable to github.com / registry.npmjs.org / api.nuget.org.
- `git init` + branch rename to `main` run and confirmed via `git status` (VERIFIED).

### What is unverified
- Whether Docker Desktop's daemon is currently running (was down at last check — needs to be started before M0 can actually run `docker compose up`).
- Actual frontend/backend scaffolding — not yet created, planning docs only so far.

## Session 2026-08-09

### What changed
- Installed and authenticated GitHub CLI (`gh`) as `shahidfarhan22`.
- Created public GitHub repo `alchemy-studio`, pushed initial commit via `chore/m0-initial-setup` branch + PR #1, merged by owner. Established branch/PR habit going forward per `AGENTS.md`.
- Reversed the Docker-for-local-DB decision (ADR-006) after discovering the owner already had PostgreSQL 17 installed natively and running — see ADR-008 in `docs/decisions.md`. Created dedicated `alchemy_app` role and `alchemy_studio` database via pgAdmin's Query Tool.
- Incident along the way: re-running the Postgres installer (owner meant to look for pgAdmin, launched the DB installer instead) was cancelled mid-way and temporarily broke the service/binaries; re-run to completion fixed it. Forgotten postgres superuser password was reset via a temporary `trust`-auth edit to `pg_hba.conf`, reverted and verified back to `scram-sha-256` immediately after.
- Added `.env.example` with DB connection variable names (no real values).
- Updated `docs/technology-stack.md`, `docs/human-actions.md`, `docs/decisions.md` to reflect the native-DB decision.

### What was verified, and how
- `gh auth status` (VERIFIED): logged in as `shahidfarhan22`.
- PR #1 merge (VERIFIED): `gh pr view 1` shows `MERGED`; local `main` fast-forwarded and feature branch deleted both locally and on GitHub.
- Postgres service health (VERIFIED): `Get-Service postgresql-x64-17` → Running; `psql --version` → 17.5; after the install incident, re-checked and confirmed restored.
- `pg_hba.conf` correctly reverted to `scram-sha-256` (VERIFIED) after the password reset — checked file contents directly, not just assumed.
- Database/role creation (VERIFIED by owner running the SQL in pgAdmin and confirming success): `CREATE ROLE alchemy_app ...` and `CREATE DATABASE alchemy_studio OWNER alchemy_app` both ran successfully (had to be run as two separate executions — `CREATE DATABASE` can't run combined with another statement in one batch).

### What is unverified
- Whether the backend can actually connect to `alchemy_studio` using `alchemy_app` — not yet tested, since the backend doesn't exist yet.
- Whether .NET 10 has been installed (still shows 8.0.204 + 8.0.406 as of last check).

### Later same session — .NET 10 installed, backend scaffolded

- Owner installed .NET 10 SDK (`10.0.302`), confirmed via `dotnet --list-sdks`.
- Scaffolded the ASP.NET Core backend: `backend/AlchemyStudio.slnx` → `backend/src/AlchemyStudio.Api` (controller-based Web API, targeting net10.0). Removed the template's sample `WeatherForecast` files (no placeholder code in committed work, per `AGENTS.md`).
- Fixed a known high-severity vulnerability in the template's default `Microsoft.OpenApi` transitive dependency (2.0.0 → 2.11.0) before it ever got committed.
- Added `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.EntityFrameworkCore.Design`, `Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore`.
- Implemented the cross-cutting contracts documented in `AGENTS.md`/`docs/architecture.md` from the start rather than retrofitting later: `ErrorEnvelope`/`GlobalExceptionHandler` (standard error shape, no leaked stack traces), `CorrelationIdMiddleware` (every request gets one, flows into logs + error responses), CORS locked to the configured frontend origin (not `*`), `/health/live` and `/health/ready` (the latter actually checks DB connectivity via `AddDbContextCheck`).
- DB connection string set up via `dotnet user-secrets` (owner ran the `set` command themselves with the real password — never shared in chat), not `.env` or any gitignored file, to keep it fully outside the repo.

### What was verified, and how
- `dotnet build` (VERIFIED): 0 warnings, 0 errors.
- `dotnet list package --vulnerable --include-transitive` (VERIFIED): clean after the `Microsoft.OpenApi` bump.
- Ran the API (`dotnet run --launch-profile http`) and hit both endpoints directly (VERIFIED): `GET /health/live` → 200 Healthy; `GET /health/ready` → 200 Healthy — this specifically confirms the backend successfully connected to `alchemy_studio` using the `alchemy_app` credentials, not just that the process started. Test server stopped afterward.
- `git status` after `git add backend/` (VERIFIED): confirmed `bin/`, `obj/`, and `appsettings.Development.json` correctly excluded by `.gitignore`; no secrets staged.

### What is unverified
- Frontend — not yet scaffolded.
- No automated tests exist yet for the backend (expected — added starting M1, per `docs/product-plan.md`).

### Later same session — frontend scaffolded, M0 essentially complete

- Scaffolded `frontend/` via `create-next-app`: TypeScript, Tailwind, App Router, ESLint, `src/` layout, Turbopack.
- Kept Next.js's own auto-generated `frontend/AGENTS.md`/`frontend/CLAUDE.md` (a real Next.js 16 feature that documents version-specific API quirks and regenerates itself via `next dev`) — doesn't conflict with the root `AGENTS.md` contract, which stays the project-wide source of truth.
- Corrected `.env.example`: it previously implied the backend reads `DB_HOST`/`DB_PORT`/etc. from a literal `.env` file, which isn't true — the backend actually gets its connection string from `dotnet user-secrets` locally (see AGENTS.md). Rewrote it to document reality accurately instead of drifting from the actual setup.
- Filled in the remaining real commands in `AGENTS.md` (frontend dev/lint/typecheck/build).

### What was verified, and how
- `npm run build` (VERIFIED): compiled successfully, 0 errors.
- Ran `npm run dev` and hit `http://localhost:3000` directly (VERIFIED): 200 response. Test server stopped afterward.
- `git status` after `git add frontend/` (VERIFIED): confirmed `node_modules/` and `.next/` correctly excluded; 19 real source/config files staged.

### What is unverified
- Frontend and backend haven't yet been run *together* (i.e., a page on the frontend actually calling the API) — there's no API-calling code yet, that starts at M1.

## Human actions still needed before M0 completes
See `docs/human-actions.md` for the full list and status.
