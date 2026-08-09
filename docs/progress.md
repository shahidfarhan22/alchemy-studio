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

### 1. Backend integration test database
Wrote 13 passing **unit tests** (`backend/tests/AlchemyStudio.Api.Tests`) for token generation/validation and the error envelope — no database needed, don't need you for these. But the higher-value **integration tests** (register/login/refresh-rotation/reuse-detection against a real Postgres, matching how I manually verified auth via curl) need a real database connection I don't currently have. I started wiring up Testcontainers (spins up a throwaway Postgres in Docker per test run — the "correct" approach per our own AGENTS.md rule against in-memory test substitutes), but you closed Docker Desktop mid-session. Two options when you're back — your call:
- **(a) Reopen Docker Desktop** and tell me — I'll finish the Testcontainers-based integration tests (no other action needed from you).
- **(b) Skip Docker entirely**: I create a dedicated `alchemy_studio_test` database + role on your native Postgres (same pattern as `alchemy_studio`/`alchemy_app` — I'll give you one SQL command to run in pgAdmin, you pick the password, I never see it).

I have a slight preference for (a) since ephemeral per-run databases are cleaner for tests (no leftover state between runs), but either is fine — not a big decision either way.

## Session 2026-08-09 (continued) — autonomous session, backend unit tests

### What changed
- `backend/tests/AlchemyStudio.Api.Tests`: new xUnit project, referenced from the solution. `TokenServiceTests` (9 tests: claim mapping, expiry, cross-key/cross-audience rejection, refresh-token hashing/uniqueness) and `GlobalExceptionHandlerTests` (4 tests: ApiException mapping, validation details, generic-500 doesn't leak exception internals, missing-correlation-id fallback).
- Removed the `Testcontainers.PostgreSql` package after Zee closed Docker Desktop mid-session — logged as item #1 above instead of blocking.

### What was verified, and how
- `dotnet test`: all 13 tests pass (VERIFIED) — and this wasn't a rubber-stamp: the first run genuinely caught a real bug in my own test code (asserted the wrong claim type name — `JwtSecurityTokenHandler` remaps `"sub"`/`"email"` to their long-form `ClaimTypes` equivalents by default). Fixed the test to match actual runtime behavior, re-ran, confirmed green. Worth noting because it's evidence these tests are actually exercising real behavior, not vacuously passing.
- `dotnet list package --vulnerable --include-transitive` on the test project: clean.

## Session 2026-08-09 (continued) — CI set up (.github/workflows/ci.yml)

- Backend job: restore, build (`TreatWarningsAsErrors`), vulnerable-dependency scan, test. Frontend job: install, lint, build (which includes a full TypeScript check), `npm audit`.
- **Verified every command locally first**, including deliberately simulating the no-`.env.local` CI environment for the frontend build (moved the file aside, ran the build with only an env var, confirmed it still worked, restored the file). Also verified `-p:TreatWarningsAsErrors=true` over `/p:...` after the latter got mangled by Git Bash's Windows path conversion locally (a local-shell-only quirk, not a real platform issue, but `-p:` is the safer portable form regardless).
- **Deliberately did not self-merge the CI PR before seeing it run for real on GitHub's own runners** — local simulation, however careful, isn't the actual target environment. Good thing: **the real run caught something local testing missed.** `npx tsc --noEmit` as a standalone step failed in CI with `Cannot find name 'LayoutProps'` — Next.js generates that ambient type into `.next/types/` during a build, and a fresh CI checkout has no `.next/` yet. Locally this was invisible because builds had already run many times, leaving `.next/types/` populated. Fixed by removing the redundant standalone typecheck step entirely — `next build` already runs a full TypeScript check as part of itself (visible in its own output: "Running TypeScript... Finished TypeScript"), so the separate step wasn't just broken, it was also duplicate work. Corrected the same false assumption in `AGENTS.md`'s command table.
- This is a good example of why "verified locally" and "verified in the actual target environment" aren't the same claim — logging it plainly rather than glossing over the fact that the first attempt was wrong.

## Session 2026-08-09 (continued) — M2 backend (product catalog)

### What changed
- `Category`/`Product` entities, `AppDbContext` updated (soft-delete global query filter, `xmin`-based optimistic concurrency, unique slug indexes).
- `CatalogService` + `ProductsController`/`CategoriesController` (public, unauthenticated) + `AdminCatalogController` (`[Authorize(Roles = Roles.Admin)]`): list/create/update/soft-delete products, create categories, server-side validation.
- `SlugGenerator` + 7 unit tests (pure logic, no DB).
- Migration `AddCatalog` — **required a manual fix**: EF Core's migration generator doesn't know `xmin` is a reserved Postgres system column and generated a `CREATE TABLE` that explicitly declares one; Postgres rejects that outright. Removed the erroneous column definition by hand (system column already exists implicitly; the EF Core mapping just reads/checks it, never needed to create it). Documented in ADR-010 and in a comment in the migration file itself, since this will recur if `Products` is ever recreated in a future migration.
- Deliberate MVP simplification: product images are a plain `ImageUrl` string (admin pastes a URL) rather than a real upload pipeline — real object storage needs an account Zee has to create (`docs/human-actions.md` #16, not blocking).
- Known limitation, not a bug: soft-deleted products are invisible everywhere (including to admin) — no restore capability yet. Fine for now, revisit at M6 (admin panel) if needed.

### What was verified, and how (all against the real database, VERIFIED)
- `dotnet build`: 0 warnings/errors. `dotnet test`: 21/21 passing. `dotnet list package --vulnerable`: clean.
- Applied the (hand-fixed) migration against the real dev database and confirmed it actually succeeds — this is what caught the `xmin` issue in the first place; didn't just trust that a clean `dotnet ef migrations add` was correct.
- Full curl walkthrough against the running API: category creation → product creation (unpublished, correctly absent from public browse) → publish via update → now visible in public list + detail-by-slug → **stale-`rowVersion` update correctly rejected with `409 CONCURRENCY_CONFLICT`** (real concurrency check, not just a schema decoration) → validation errors return correct field-level details (negative price/stock) → non-admin (authenticated customer) correctly gets `403` on admin endpoints, not `401` → unauthenticated gets `401` → soft-delete → confirmed invisible from public list, public detail (`404`), and admin list alike.
- Left one test category ("Test Category (Fantasy Miniatures)") in the dev database from this verification — harmless local test data, same pattern as the M1 test accounts, but flagging it so it's not mistaken for something real when Zee looks at the admin panel later.
- Stopped the test server after verification.

### What is unverified
- Frontend catalog browsing/admin UI — not built yet, in progress next.
- Product image handling is untested with a real image (only tested with `imageUrl: null` and omitted) — low risk, it's just a string field, but noting the gap.

## Session 2026-08-09 (continued) — M2 frontend (catalog browsing + admin UI); Zee back mid-session

- `/products` (list) and `/products/[slug]` (detail): Server Components, real HTML for SEO. `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`, `/admin/categories`: Client Components behind an `AdminLayout` guard (client-side redirect only — the real enforcement is the backend's `[Authorize(Roles=Admin)]`, per MASTER-PROMPT.md's "never rely on hiding a button" rule).
- `catalog-api.ts` split public (server-safe, no auth) from admin (browser-only, needs the in-memory token) — reused the existing `api-client.ts`/`public-api.ts` separation from M1.
- **Three real issues found and fixed before committing, not after:**
  1. `next/image` requires allow-listing external image hostnames; since admin can paste a URL to *any* domain (ADR-010), that would need a wildcard remote pattern — which turns Next's image optimizer into an open proxy for arbitrary URLs. Used a plain `<img>` tag instead.
  2. `ProductForm`'s submit handler never actually set `isSubmitting` to `true` (only reset it to `false` in `finally`) — the loading state / disabled-button-during-submit would never have shown. Caught by rereading the code, not by a test.
  3. `next build` tried to statically pre-render `/products` at build time, which requires the backend reachable *during the build* — failed outright with the backend down. Root cause: frontend and backend are separate deployables (ADR-003) that don't build together, so build-time data fetching (which static generation/ISR requires) is the wrong model here. Fixed by marking both catalog pages `export const dynamic = "force-dynamic"` (fetch per-request instead) — verified by rerunning the build with the backend deliberately still stopped, confirming it now succeeds independent of backend availability.
- No single-admin-product-by-id backend endpoint exists yet, so the edit page fetches the full admin list and finds the product client-side. Fine at this catalog's expected size; noted as a thing to revisit if the catalog grows large.

### What was verified, and how
- `npm run lint`: clean (after fixing a `react-hooks/set-state-in-effect` violation in the admin products page — restructured to avoid a synchronous `setState` call inside an effect body).
- `npm run build`: succeeds, **with the backend deliberately not running** — confirms the dynamic-rendering fix actually solved the build-time coupling problem, not just papered over the symptom.
- Full curl walkthrough with both servers running: created a category (leftover from earlier) + a fresh test product via the admin API, confirmed it renders correctly on `/products` (name, formatted price) and `/products/[slug]` (name, description, in-stock status), confirmed a nonexistent slug 404s. Confirmed all three admin pages return 200 and show the expected pre-hydration "Loading..." state. Deleted the test product afterward (via the DELETE endpoint — incidentally exercised it again) and stopped both servers.

### What is unverified
- Real interactive click-through of the admin create/edit/delete forms in an actual browser — same limitation as M1 (no browser automation tool available). **Flagged for Zee**, alongside the M1 browser check.

**Zee returned partway through this session** — from here on, PRs are left open for his review/merge rather than self-merged, same as before he went to sleep.
