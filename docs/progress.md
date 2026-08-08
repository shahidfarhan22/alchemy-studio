# Progress Log

## Current state
- Phase: M1 — Auth (register / login / roles)
- Last completed milestone: M0 — Repo & tooling setup (merged via PR #1-#4)
- Next milestone: M1 — see `docs/product-plan.md`

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

## Session 2026-08-09 (continued) — M1 backend (auth) implemented

### What changed
- Added ASP.NET Core Identity: `ApplicationUser` (Guid keys, `DisplayName`, `MustChangePassword`), `Admin`/`Customer` roles, `RefreshToken` entity (hash-only storage).
- `AuthController`/`AuthService`/`TokenService`: register, login, refresh, logout, change-password, `/me`. JWT access tokens (15 min), refresh tokens rotated on every use with reuse-detection (a replayed old token revokes the user's entire active token chain). Refresh token delivered via `HttpOnly`/`SameSite=Lax` cookie scoped to `/api/v1/auth`.
- `ApiException`/`GlobalExceptionHandler` extended to map typed exceptions to specific error-envelope codes/status, not just a generic 500 — reusable by every future feature area, not auth-specific.
- Per-IP rate limiting (10 req/min) on all auth endpoints via `[EnableRateLimiting]`, scoped to `AuthController` only (an earlier version accidentally applied it globally to `MapControllers()`, which would have throttled every future endpoint — caught before committing).
- `AdminSeeder`: creates roles + first admin from `Admin:Email`/`Admin:Password` config on Development startup, `MustChangePassword = true`, never a hardcoded password.
- First EF Core migration (`InitialIdentity`), applied automatically on Development startup only (explicit step in staging/prod, per `docs/architecture.md`).
- Fixed an EF tool/runtime version mismatch (`dotnet-ef` 9.0.2 vs runtime 10.0.10) by updating the global tool.
- Reconciled three implementation details against the original hardening rules, logged as ADR-009: Identity's built-in PBKDF2 hasher instead of Argon2id/bcrypt; registration is not fully enumeration-safe (needs email confirmation, deferred to M7) while login/refresh are; per-IP + Identity lockout instead of true progressive-delay throttling.

### What was verified, and how (all via direct curl testing against the running API, VERIFIED)
- `dotnet build`: 0 warnings, 0 errors. `dotnet list package --vulnerable --include-transitive`: clean.
- Migration applied and admin seeded on startup — confirmed in app logs ("Seeded first admin account: ...").
- Register → 200 with access token + refresh cookie (`HttpOnly`, `Path=/api/v1/auth`, `SameSite=Lax`, no `Secure` in dev — inspected raw `Set-Cookie` header, not just assumed).
- Duplicate registration → 409 `EMAIL_ALREADY_REGISTERED`.
- Login with wrong password AND login with a nonexistent email → identical 401 `INVALID_CREDENTIALS` (enumeration-safety check).
- Refresh via cookie → 200, new token issued.
- **Refresh-token reuse detection**: replayed a rotated-away token → 401 `REFRESH_TOKEN_REUSE_DETECTED`, AND confirmed the legitimately-rotated new token was also revoked as a defensive measure (the actual security property this whole scheme exists for).
- Admin login with the temp seeded password → `mustChangePassword: true` in response. Called change-password → 204. Old password then rejected (401), new password works with `mustChangePassword: false`.
- Rate limiter: hammered login 15x rapidly → mix of 401/429 (limiter is live; couldn't get a clean "10-then-blocked" demo since prior testing in the same 1-minute window had already used most of the budget — noted as a real observation, not glossed over).
- Test server stopped after verification (`Stop-Process`).

### What is unverified
- No automated tests written yet for auth (AGENTS.md says tests for money/auth/permissions come first — this is a gap worth closing before M2, flagged as a follow-up, not silently skipped).
- Frontend auth UI (login/register pages, token handling) — not built yet, next up.
- Behavior under concurrent refresh requests (two tabs refreshing simultaneously) — not stress-tested.

## Session 2026-08-09 (continued) — M1 frontend auth; autonomous overnight session begins

**Context:** Zee went to sleep (~4 hours) and asked me to keep working autonomously on anything that doesn't need his judgment, log anything that does, and be extra careful/double-check everything since he isn't available to catch mistakes. This section covers that stretch.

### What changed (frontend auth)
- `frontend/src/lib/api-client.ts`: single typed fetch wrapper (per AGENTS.md — no scattered `fetch()` calls), parses the backend's error envelope into a typed `ApiError`, sends the access token as a bearer header and cookies via `credentials: "include"`.
- `frontend/src/lib/auth-api.ts`, `auth-schemas.ts` (zod, mirroring backend password rules), `auth-context.tsx` (React context holding the session **in memory only** — never `localStorage`, per our own security rule — and silently attempting a refresh on page load to restore the session from the httpOnly cookie).
- `/login`, `/register` pages; homepage now shows logged-in state or login/register links (placeholder content, not real storefront — that's M2).
- Added `zod` (one dependency, justified in the code).

### What was verified, and how (all VERIFIED directly, not assumed)
- `npm run build` and `npm run lint`: both clean.
- **Identified and directly tested the riskiest unverified assumption**: the frontend (`localhost:3000`) and backend (`localhost:5007`) are different origins (different ports). Reasoned through whether the httpOnly refresh cookie would actually survive that boundary (answer: yes, because browsers treat different ports as the same "site" for `SameSite` purposes, only origin/CORS differs) — then **proved it empirically** rather than trusting the reasoning alone, by replaying the exact CORS preflight + credentialed request + cookie-based refresh sequence a browser would make, using curl with an `Origin: http://localhost:3000` header. All three steps confirmed working with the correct headers.
- Confirmed both dev servers serve the new pages correctly (200 responses, expected content in the static HTML).
- Documented a real forward-looking risk in `docs/architecture.md`: this cookie scheme breaks if frontend/backend end up on **unrelated** domains in production (not an issue locally, or if we use subdomains of one domain at M9) — recorded now so it isn't rediscovered the hard way at deploy time.
- Stopped both test servers after verification.

### What is unverified
- Real interactive click-through in an actual browser — I don't have a browser automation tool, only curl (which can't execute JavaScript/React). The logic has been verified as thoroughly as possible without one (cross-origin cookie mechanics proven directly; page content verified; code carefully re-read for bugs). **Flagged for Zee**: please click through register → login → logout in an actual browser when you're back, as a final sanity check.

## Human actions still needed before M0 completes
See `docs/human-actions.md` for the full list and status.

## ⏸ ITEMS WAITING ON ZEE (running list — updated as they come up)

Nothing blocking yet as of this entry. Will be updated below if anything comes up that genuinely needs his input, rather than blocking silently.
