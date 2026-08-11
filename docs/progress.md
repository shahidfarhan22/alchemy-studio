# Progress Log

## Current state
- Phase: M4 — Payments — ✅ DONE. Fully verified with a real browser payment and a genuine Razorpay-initiated webhook through a real `ngrok` tunnel (see ADR-013, `docs/product-plan.md`).
- Visual identity: "The Vault" (ADR-015) — both PRs merged, whole app restyled.
- M5 (custom orders + quoting) — both backend and frontend merged (ADR-016). Awaiting Zee's browser sign-off.
- M6 (admin order management, fulfillment, refunds, dashboard) — backend and frontend both code-complete (ADR-017), backend verified against the real Razorpay test API. Awaiting Zee's browser sign-off.

## Environment
- Repo path: `D:\New Project`, branch `main`. GitHub: [shahidfarhan22/alchemy-studio](https://github.com/shahidfarhan22/alchemy-studio) (public)
- How to run locally: not yet scaffolded (M0 in progress)
- Services running / credentials location: **local PostgreSQL 17** (native, `D:\postgres`, Windows service `postgresql-x64-17`) — dedicated role `alchemy_app` + database `alchemy_studio` created for this project. Credential (password) lives only in the owner's local `.env` (gitignored) and password manager — never shared in chat. See ADR-008 in `docs/decisions.md`.

## Open items
- [ ] Blocked on: nothing currently
- [ ] Deferred decision: store/brand name → GitHub repo is named `alchemy-studio` as a working name; affects domain, branding — see `docs/requirements.md` open items
- [ ] Deferred decision: file storage provider, email provider → decided at M2/M7 respectively (`docs/technology-stack.md`)
- [ ] Deferred feature: no order-history ("my orders") or profile *page* exists in the frontend yet — **correction**: the backend endpoint (`GET /api/v1/orders`, `OrderService.GetOrdersForUserAsync`) already exists and works (confirmed directly while investigating M5's Order/Payment code, ADR-016) — this was previously logged here as a backend gap too, which was inaccurate. Only the frontend page is actually missing. Still tracked as a real feature to build alongside M5/M6 rather than bolt on piecemeal.

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

## Session 2026-08-09 (continued) — error boundaries added, real bug found via Zee's live testing

- Added `frontend/src/app/products/error.tsx` and `frontend/src/app/error.tsx` (app-wide fallback) per `docs/architecture.md`'s "Failure modes" and AGENTS.md's "global error boundary, wired once" — the `/products` crash Zee hit (backend down → raw `TypeError: fetch failed` stack trace shown to the user) is exactly the case these exist for.
- **Real bug found through Zee's own browser testing, not something I could catch with curl**: the "Try again" button visually did nothing when clicked, even with the backend confirmed back up — a manual page reload worked, but the button didn't. Root cause: `reset()` alone re-renders the error boundary but doesn't guarantee Next.js actually re-fetches the Server Component's data; `router.refresh()` is needed alongside it to force a real re-fetch (this is a documented Next.js gotcha, not obvious from the API). Fixed in both error boundaries.
- This is a good example of why the "needs a real browser" gap I kept flagging matters — curl could confirm the error boundary *rendered*, but not that its retry mechanism actually worked. Zee's testing caught a real, user-facing bug that automated/curl verification structurally could not have found.
- These files are being added to the still-open PR #10 (M2 frontend) rather than a new PR, since they're directly part of that same catalog UI work.
- **Correction:** PR #10 was actually merged by Zee *before* that commit was pushed, so it landed on an already-merged (orphaned) branch and never reached `main`. Caught by checking `git log origin/main` and confirming `error.tsx` was missing from it, not just assumed fixed. Recovered by cherry-picking the one commit onto a fresh branch from current `main` and opening **PR #11**, which Zee reviewed and merged separately, along with confirming the "Try again" button now works correctly (real browser verification, not curl).

## Session 2026-08-09 (continued) — concurrent CLI session touched `docs/human-actions.md` again

- Found uncommitted local changes to `docs/human-actions.md` that neither of us made — content was generic and badly stale (asking "what's the application idea?" as if M0 hadn't happened yet). Almost certainly the other Claude Code CLI session (first seen at the very start of this project, see ADR-007) writing to the same folder again without coordination.
- Per `AGENTS.md`'s multi-session rule, flagged it to Zee rather than silently discarding or keeping it. He confirmed: discard. Reverted via `git checkout -- docs/human-actions.md`; nothing was lost since it was never committed.
- **Ongoing risk, not fully solved**: this is the second time the other session has overwritten a file without warning. Worth Zee deciding, when convenient, whether to keep running both sessions against this repo or standardize on one — see `AGENTS.md`'s existing guidance ("check `git status`/`git log` for unfamiliar changes before writing files") as the current mitigation.

## Session 2026-08-09 (continued) — M3 backend (cart & addresses); Zee hands-on for the migration

### What changed
- `Cart`/`CartItem` (guest carts via a cookie-tracked `AnonymousToken`, merged into the account cart on login/register) and `Address` entities, `CartService`, `AddressService`, `CartController` (not `[Authorize]` — guests need access), `AddressController` (`[Authorize]` — addresses require login). See ADR-011 for the full reasoning.
- **Zee generated and applied the migration himself** (`dotnet ef migrations add/remove`, `dotnet ef database update`) — walked through what a migration actually is and why the EF Core warning it initially produced mattered, rather than just handing him commands to paste blindly.
- Fixed a real EF Core warning before it became a real bug: `CartItem → Product` was configured as a "required" relationship, which conflicts with `Product`'s soft-delete query filter. Fixed with `.IsRequired(false)` on the relationship (metadata-only, doesn't change the `ProductId` column's actual nullability).
- **Zee caught a real UX gap by asking a clarifying question**, not by testing: "what change did you make to stop a product being soft-deleted while it's in someone's cart?" — the honest answer was "none, and actually nothing currently prevents that; here's what silently happens instead" (item just vanishes from the cart). He asked for it to behave like "out of stock" instead — visible, marked unavailable, not hidden. Implemented via a new `IsAvailable` flag + querying `Products` with `.IgnoreQueryFilters()` in `CartService.ToDto()`.
- **Found and fixed a second instance of the exact same bug while verifying the first fix**: `MergeAnonymousCartIntoUserAsync` had its own unfiltered product query (for stock-capping), which silently dropped merged items the same way. Fixed by removing quantity-capping from merge entirely — that enforcement belongs in `AddItemAsync`/`UpdateItemQuantityAsync` (which already do it), not merge, which should just honestly combine both carts.

### What was verified, and how (all against the real database, VERIFIED)
- `dotnet build`: 0 warnings/errors (including the EF Core relationship warning, confirmed gone after the fix — Zee re-ran `migrations add` himself and confirmed no warning in the output). `dotnet test`: 21/21 passing. `dotnet list package --vulnerable`: clean.
- Migration content reviewed before Zee applied it: three clean new tables (`Addresses`, `Carts`, `CartItems`), correct FKs and unique indexes, no `xmin`-style gotchas this time (no concurrency tokens on these entities).
- Full curl walkthrough: anonymous cart creation + cookie, add-to-cart, stock-limit enforcement (409 on exceeding stock), **the unavailable-item fix** (soft-deleted a product mid-cart, confirmed it stays visible with `isAvailable: false` instead of disappearing), **the merge-on-login fix** — tested twice: once reproducing the exact bug scenario (product deleted before login, confirmed item now survives the merge) and once with a normal available product (confirmed no regression — quantities still combine correctly). Address CRUD, validation errors, and the login requirement (401 unauthenticated) all confirmed. Test data cleaned up (soft-deleted) afterward.

### What is unverified
- Frontend cart/checkout UI — not built yet, next up. This will need the login-gate-at-checkout behavior Zee specified.
- No automated tests for Cart/Address yet — same integration-test-database gap tracked since M1 (Docker vs. dedicated test DB decision still pending).

## Session 2026-08-09 (continued) — M3 frontend (cart page, checkout, login gate)

### What changed
- `/cart`: shows items, quantity controls, unavailable/out-of-stock items shown distinctly (not hidden, per ADR-011) with a "remove" action, subtotal, "Proceed to checkout" disabled unless every item is available and in stock.
- `AddToCartButton` (client-component island embedded in the server-rendered `/products/[slug]` page) — inline "Added to cart" confirmation + link to cart, not a redirect.
- `/checkout`: the login gate — redirects to `/login?redirect=/checkout` if not authenticated, lands back on checkout after logging in. Shows order summary + address selection/creation. "Continue to payment" is present but disabled with an explanatory tooltip — payment itself is M4, not built yet; not presented as functional.
- `/login` and `/register` now support a `?redirect=` param so checkout (or anything else, later) can send users to auth and back to where they were.
- **Fixed a bug in my own draft before it was ever run**: `cart-api.ts` initially had every call passing `skipAuth: true` — which would have meant the access token never got attached even for logged-in users, breaking account-based cart identification entirely (every request would've looked anonymous). Caught by rereading the code against what `skipAuth` actually does in `api-client.ts`, not by testing.
- **Real Next.js requirement, not just a lint preference**: reading the `redirect` query param needs `useSearchParams()`, which requires a `<Suspense>` boundary around it in the App Router — omitting this fails `next build` outright. Restructured both login and register pages into a thin wrapper + inner form component to satisfy it.

### What was verified, and how
- `npm run lint`: clean. `npm run build`: succeeds (confirmed with the backend genuinely running this time, not stopped — was checking for new build-time issues, not the already-solved backend-down case; `/cart` and `/checkout` render as static since all their data fetching is client-side, no new build-time backend coupling introduced).
- Both new pages confirmed serving 200 with the correct pre-hydration loading state via curl.

### What is unverified
- Full interactive walkthrough in a real browser (add to cart, get redirected to login, log back in, land on checkout, add an address) — same structural gap as every previous frontend milestone (no browser automation tool). **Flagged for Zee**, same as M1/M2.

## Session 2026-08-09 (continued) — M4 backend (Razorpay payments), fully verified against the real test API

### What changed
- `Order`/`OrderItem` (price/name snapshotted at order time, unlike `Cart`), `Payment` (state machine per `docs/architecture.md`), `WebhookEvent` (append-only idempotency log). `OrderService`, `RazorpayService` (wraps the official `Razorpay` NuGet SDK), `OrdersController`, `PaymentsController`. Full reasoning in ADR-012.
- Zee set up a Razorpay account and generated test-mode API keys himself (no KYC needed for test mode — clarified this distinction with him before he started, since KYC was originally assumed to be a hard M4 blocker and isn't).
- **Ran into and fixed a corrupted `secrets.json`** (malformed JSON, likely a missing comma from an earlier interrupted `user-secrets set`) — walked Zee through fixing it by hand rather than me reading the file (it holds his real DB password, JWT key, etc., which I don't look at).
- **Separately discovered the seeded admin account had somehow become a different, Customer-only account** (different user ID than the original seed, same email) — not fully root-caused (plausible: something from Zee's own independent testing), but pragmatically fixed by adding the `Admin` role to the existing account via one SQL command in pgAdmin, rather than digging further or creating a duplicate account.
- Zee shared the current admin password directly when I asked "what is it" — **my mistake**, I should have asked him to verify it works rather than state the value, same rule as the DB password. Noted for next time.
- Zee generated and applied this migration himself again.

### Two real bugs found and fixed before ever touching a real Razorpay account (full detail in ADR-012)
1. `RazorpayService`'s constructor required the webhook secret eagerly, even though order creation doesn't need it and the webhook secret doesn't exist yet (needs a dashboard step not done until `ngrok` is set up). Broke order creation entirely with a config error. Fixed: webhook secret now optional at construction, required only when actually verifying a webhook.
2. The webhook event-ID handling assumed Razorpay's JSON body has a top-level `"id"` field for the event — **verified against Razorpay's actual documentation via WebFetch before trusting this**, and found it was wrong: there is no such field; the real identifier is the `X-Razorpay-Event-Id` HTTP header. As originally written, this would have made idempotency detection — and therefore all webhook processing — fail on every single real delivery. Fixed by reading the header in the controller and threading it through explicitly.

### What was verified, and how (all against the real database AND the real Razorpay test API, VERIFIED)
- `dotnet build`: 0 warnings/errors. `dotnet test`: 21/21 passing. `dotnet list package --vulnerable`: clean (including the new `Razorpay` SDK dependency).
- Migration reviewed before applying: clean, no `xmin`-style issues (none of these entities use optimistic concurrency).
- **Full real order-creation call**: hit Razorpay's actual test API and got back a real `razorpay_order_id` (`order_TNa1MTQtO9ttIt`) — not a mock.
- **Full webhook simulation, done properly, not hand-waved**: hand-constructed a `payment.captured` payload matching Razorpay's real documented structure, computed its HMAC-SHA256 signature the same way Razorpay signs real deliveries (using a temporary local webhook secret, since the real one needs the `ngrok` step, not done yet), and POSTed it with the correct headers. Confirmed: order transitioned to `Paid`, stock correctly decremented (5→3 for a quantity-2 order), cart correctly cleared. **Replayed the identical event** and confirmed idempotency (stock stayed at 3, not double-decremented). **Sent a tampered signature** and confirmed it's rejected (400).
- Also fixed and verified along the way: enum values (`OrderStatus`) were serializing as raw numbers (`0`) instead of readable strings — added a global `JsonStringEnumConverter`, confirmed responses now show `"PendingPayment"`/`"Paid"` etc. Cross-user order access confirmed correctly 404s (doesn't leak that another user's order exists). Empty-cart order attempt confirmed 400.
- Test data cleaned up (soft-deleted) afterward, server stopped.

### What is unverified / explicitly deferred
- **Real webhook delivery from Razorpay itself** — only a hand-simulated one, since the real webhook needs `ngrok` + dashboard configuration (`docs/human-actions.md` #18), not done yet. The hand-simulation is a faithful reproduction (same signing algorithm, same payload shape verified against real docs), but it's still not the same as receiving Razorpay's actual delivery.
- Frontend: no checkout widget integration yet — customer currently has no way to actually pay through the UI.
- Reconciliation job (poll for stuck pending payments, per `docs/architecture.md`) — not built, flagged as a known gap, not silently dropped.
- No automated tests for the payment flow yet — same integration-test-database gap tracked since M1.

## Session 2026-08-09 (continued) — M4 frontend (Razorpay checkout widget)

### What changed
- `orders-api.ts` (typed client), `razorpay-checkout.ts` (loads Razorpay's hosted `checkout.js` from their CDN — the standard, documented integration pattern, not something to self-host), `/orders/[id]` (polls order status, never trusts the widget's client-side success callback for anything beyond "go start polling" — matches `docs/architecture.md`'s "webhooks are the source of truth" taken literally).
- `/checkout`'s "Continue to payment" button now actually creates the order and opens the real Razorpay widget.
- **Real lint errors from React's newer purity rules, not just style nitpicks**: the order-status page initially called `Date.now()` and read a ref's value directly during render to compute a "has this timed out" flag — both are flagged by `react-hooks/purity`/`react-hooks/refs` as unsafe (can produce inconsistent results across re-renders). Restructured to track `hasTimedOut` as proper React state, set via a `setTimeout` in the polling effect, rather than deriving it from a ref/wall-clock read at render time.

### What was verified, and how
- `npm run lint`, `npm run build`: both clean.
- Full round-trip with both servers running: created a real order via the API (real Razorpay test order ID returned), confirmed `/orders/[id]` serves correctly with the right pre-hydration state, fired a hand-signed webhook (same technique as the backend PR) to move the order to `Paid`, then re-fetched the order detail endpoint and confirmed it returns exactly the data the frontend's polling would consume to show "Payment successful."
- Test data cleaned up, both servers stopped.

### What is unverified
- The actual Razorpay widget opening and completing a payment in a real browser (test-mode card numbers) — needs Zee. Same for the polling transition actually being observed live rather than confirmed via two separate API snapshots.
- Real Razorpay-initiated webhook (still needs `ngrok`, per the backend PR's notes).

## Session 2026-08-09 (continued) — M4 closed out: real `ngrok` + real webhook, real payment; order-confirmation nav gap found and fixed

### What changed
- Zee set up `ngrok` (reserved static domain), registered a real webhook in the Razorpay test-mode dashboard, and generated his own webhook secret.
- **Real snags along the way, none of them code bugs**: `secrets.json` broke twice more from hand-editing (duplicate key, then a syntax error) — resolved by deleting it and recreating every secret via `dotnet user-secrets set`, which can't produce invalid JSON. A stale leftover backend process from an earlier session was still holding the port, masking whether new secrets had taken effect until it was killed.
- **My mistake, caught by the test itself**: gave Zee the wrong test card number (`4111 1111 1111 1111`, a generic cross-provider Visa test number) — Razorpay's widget correctly rejected it as international. Tried three times to pull the real number from Razorpay's docs via WebFetch (page renders the table client-side, couldn't extract it) before asking Zee to open the page and read it back directly. Correct domestic card: `4100 2800 0000 1007`.
- **UPI unavailable in test checkout** — researched, confirmed as an account-setup gate (needs enabling via the Live dashboard even for test mode), not a bug. Documented so it isn't rediscovered.
- Full detail in ADR-013.
- **Zee flagged a real UX dead-end after the payment succeeded**: the order-confirmation page (`frontend/src/app/orders/[id]/page.tsx`) had no way back anywhere — no link to products, home, cart, orders, or profile. Added "Home" and "Continue shopping" links. Checked for an order-history/profile page to also link to — **neither exists anywhere in the app**, frontend or backend. Rather than fake a link to a nonexistent page, flagged it to Zee directly; he chose to defer building it properly alongside M5/M6 instead of bolting it on now (see Open items above).

### What was verified, and how (all real, not simulated)
- A failed payment attempt (wrong test card) produced a **genuine** `payment.failed` webhook — visible in backend logs, not simulated, incidentally proving the failure path works against real Razorpay traffic too.
- A successful payment (correct domestic test card) produced a **genuine** `payment.captured` webhook via the real `ngrok` tunnel, confirmed directly in the backend log: `Order 2f3adbf8-d3e4-4a8f-aa42-822de422285e marked Paid, stock decremented, cart cleared.` This is the exact log line `OrderService` emits on success, reached through the full real chain end to end.
- `npm run lint` and `npm run build`: both clean after the order-confirmation page edit.

### What is unverified / explicitly deferred
- Order-history and profile pages — don't exist yet, deferred to M5/M6 per Zee's decision above.
- Automated tests for the payment flow — same integration-test-database gap tracked since M1.
- Reconciliation job for stuck pending payments — still not built, still a known gap.

## Session 2026-08-09 (continued) — real login 500, found via Zee's own browser, two bugs fixed

### What changed
- Zee hit a genuine `500` logging into his admin account through the actual UI — the first bug curl-based testing structurally couldn't have caught, since it only surfaces from the real browser's request timing/lifecycle.
- Diagnosed by reading the backend terminal's actual stack trace directly (not guessed): `AuthController.Login` → `MergeAnonymousCartAsync` → `DbUpdateConcurrencyException` inside `CartService.MergeAnonymousCartIntoUserAsync`.
- **Fix #1**: made the cart-merge-on-login best-effort — wrapped in try/catch, logged as a warning, login always succeeds now regardless of whether the guest-cart merge succeeds. A non-critical convenience feature was taking down the auth-critical path; that coupling was the real design flaw, independent of what triggered the merge failure itself.
- Tried to pin the merge failure's exact trigger via direct reproduction (fresh test accounts, curl) — both the "matching product in both carts" and "new product, empty account cart" branches merged cleanly. Could not reproduce Zee's specific account's failure directly; a live DB query (via pgAdmin, read-only, run by Zee) showed 7 leftover anonymous test carts accumulated from a day of manual browser testing, but nothing structurally corrupt in the current snapshot.
- While investigating, found **fix #2, the more important structural bug**: `AuthProvider`'s session-restore effect in `frontend/src/lib/auth-context.tsx` called `authApi.refresh()` directly inside `useEffect(..., [])` with no guard against React Strict Mode's dev-mode double-invocation. Since `/auth/refresh` rotates the token server-side, the second concurrent call reused a cookie the first call had already rotated away — the backend correctly treated this as reuse (indistinguishable from token theft) and revoked the user's entire active session as designed. Confirmed directly in the backend log: two `Refresh token reuse detected` warnings for the same user, back-to-back, from a single page load.
- Fixed with a `useRef` guard so the network call only fires once even when the effect runs twice — full reasoning and what's still genuinely unresolved (whether this was also the root cause of the cart-merge race) in ADR-014.

### What was verified, and how
- `dotnet build`: 0 warnings/errors. `npm run lint`, `npm run build`: both clean.
- Zee confirmed live in his own browser, twice: login initially still failed once after the backend-only fix (consistent with the refresh-race being a separate, still-live issue), then succeeded after the frontend fix was also applied and the dev server picked it up.

### What is unverified / explicitly deferred
- The exact original trigger for `DbUpdateConcurrencyException` in the cart merge was never conclusively reproduced, only contained (best-effort catch) — see ADR-014's "what's still open" section for the plausible connection to the Strict Mode race.
- The 7 leftover anonymous carts in the dev database are harmless clutter, not cleaned up.

## Session 2026-08-09 (continued) — "The Vault" visual identity, PR 1 (foundation + customer-facing)

### What changed
- Zee asked for the storefront UI to be a genuine "wow," not just functional (it was still literally unmodified `create-next-app` boilerplate through M4). Built six full homepage/catalog mockups as a side-by-side comparison artifact so Zee could pick a direction directly rather than from description alone — he chose **The Vault** (near-black, single gold accent, auction-house/limited-collectible framing). Full reasoning and the rejected alternatives in ADR-015.
- Confirmed scope with Zee before building: two PRs not five-plus, admin gets the full treatment (not a stripped-down version), a styled text wordmark stands in for a logo (none exists yet), homepage includes a live product-preview grid.
- Rewrote `globals.css` with a real design-token system (Tailwind v4 `@theme inline`) — along the way, fixed a real pre-existing bug: a `body { font-family: Arial, ... }` rule was silently overriding the Geist fonts that were being loaded but never actually applied. Also removed an OS-`prefers-color-scheme`-driven auto-dark-mode block, since Vault is one deliberate theme.
- Swapped fonts to **Bodoni Moda** (display serif) + **Public Sans** (body) via `next/font/google`, replacing the default Geist boilerplate. Fixed `metadata.title`/`description`, still literally "Create Next App" until now.
- Built the app's **first-ever shared component library** (`frontend/src/components/` didn't exist before): `ui/` primitives, `layout/` (SiteHeader + SiteFooter — the app had **zero persistent site chrome** before this; every page hand-rolled its own inline nav links), `catalog/` (ProductCard, LineItemRow).
- Re-skinned every customer-facing page onto the new primitives with **zero logic changes** — verified by re-reading each page's existing state machine (add-to-cart, cart quantity/availability, checkout's auth-gate + Razorpay integration, order-status polling) and confirming it's untouched, only JSX/styling changed.
- Folded in two accessibility fixes while every form/error state was already being touched: `aria-invalid` added to checkout's address form (previously the only form missing it), `aria-live="polite"` added around the order-status heading (changes async via polling, previously unannounced to screen readers).

### What was verified, and how
- `npm run lint`: clean. `npm run build`: clean, including confirming `next/font/google` resolved both new font names correctly and the `Suspense`-boundary requirement around `useSearchParams` (login/register) still holds.
- Started the real dev server against the real running backend and `curl`'d the homepage, `/products`, `/login`, `/cart` — all 200, and grepped the homepage/products HTML for real seeded product data ("Frontend Test Golem", "Lot 01", "Lot 02") to confirm server-rendered content is genuinely live, not a static placeholder, and checked for hydration-error markers (none found). This is a real step beyond "it compiles" but still short of an actual browser click-through.

### What is unverified / explicitly deferred
- **Real interactive browser verification** — same structural gap as every prior frontend milestone (no browser-automation tool in this environment). Zee needs to click through the full customer journey (browse → cart → checkout → real Razorpay test payment → order status → register/login/logout) to actually sign off — see `docs/product-plan.md`. This also finally closes the still-outstanding M1 browser-click-through gap if done as part of this pass.
- **PR 2 (admin panel restyle)** — not started. `/admin/*` currently still has the old unstyled UI.
- Mobile/narrow-viewport behavior of the new `SiteHeader` — no dedicated mobile nav pattern was designed; degrades via flex-wrap but not deliberately tested at phone width.

**PR 1 merged by Zee** — picked up immediately after.

## Session 2026-08-09 (continued) — "The Vault" visual identity, PR 2 (admin panel)

### What changed
- Restyled every admin page (`admin/layout.tsx`'s nav shell, `admin/products/page.tsx`'s table, `admin/products/ProductForm.tsx`, the `new`/`[id]/edit` wrapper pages, `admin/categories/page.tsx`) onto the same primitives built in PR 1 — full Vault treatment per Zee's earlier confirmation (tokens, fonts, hairlines, eyebrow labels), not a stripped-down tokens-only version. Zero logic changes, same pattern as PR 1.
- Retrofitted `aria-invalid` onto `ProductForm.tsx`'s fields — it was previously the only form in the app missing it. Came essentially free by routing the form through the shared `Input`/`Select` primitives, which wire `aria-invalid` from an `invalid` prop automatically.
- Left as-is per the plan's confirmed defaults: the admin products table stays a plain functional `<table>` (not restyled into cards or anything fancier — scanning/sorting by column is the actual need here), and the delete confirmation stays the native browser `confirm()` dialog (can't be restyled, out of scope for a visual pass).

### What was verified, and how
- `npm run lint`: clean. `npm run build`: clean.
- Full-repo grep for leftover raw Tailwind `gray-`/`red-`/`green-`/`amber-` utility classes across `app/` and `components/`: **zero matches** — confirms every page in the entire app (not just customer-facing) is now on the token system.
- Started the real dev server against the real backend and `curl`'d `/admin/products`, `/admin/categories`, `/admin/products/new` — all 200, no hydration-error markers. These pages redirect non-admins client-side, so `curl` only confirms the initial render is error-free, not the authenticated table/form content — that needs Zee's real login.

### What is unverified / explicitly deferred
- Real interactive verification as admin — log in, create a category, create/edit/delete a product, confirm the restyled table/forms are usable and the new `aria-invalid` states actually trigger on bad input. Same structural limitation as every prior frontend milestone (no browser automation available here).
- This closes out the visual-identity workstream from ADR-015 — both PRs code-complete. Next up (not started): M5, custom order requests + quoting.

## Session 2026-08-09 (continued) — M5 backend: custom order requests + quoting

### What changed
- Confirmed real product decisions with Zee before writing code (same rigor as every other milestone): every request field optional, single price + optional note for quoting, a fixed 14-day quote-expiry window, login required upfront (no guest custom requests).
- Investigated the exact current `Order`/`OrderItem`/`OrderService`/`RazorpayService` shapes directly (not from memory) before designing anything, since M5 needed to reuse the M4 payment flow without breaking it. Found `OrderItem.ProductId` was required/non-nullable and the webhook's stock-decrement loop unconditionally assumed every item maps to a real catalog `Product` — a custom item has neither. Made `ProductId` nullable and added an explicit skip in the decrement loop, rather than faking a product reference. Full reasoning in ADR-016.
- New `CustomOrders` module: `CustomOrderRequest` entity + status enum (`Requested/Quoted/Accepted/Declined/Cancelled` — "Expired" is deliberately computed, never stored, since this app has no background-job infrastructure), `CustomOrderService`, customer-facing `CustomOrdersController` (`/api/v1/custom-orders`), admin-facing `AdminCustomOrdersController` (`/api/v1/admin/custom-orders`).
- Refactored `OrderService`: extracted the address-lookup and Order+Razorpay-creation logic `CreateOrderAsync` already had into shared private helpers, then added `CreateOrderForCustomQuoteAsync` on top of the same helpers — a custom-quote acceptance goes through the **exact same** Order/Payment/webhook code as a catalog checkout, not a parallel path. `CustomOrderRequest` never tracks payment status itself; once accepted, `Order.Status` (via the existing, unmodified `/orders/{id}` page) is the single source of truth, same as a catalog order.
- Migration `AddCustomOrderRequests` — clean, no `xmin` gotcha this time (no concurrency token on this entity).

### What was verified, and how (all against the real database and real webhook-processing code, VERIFIED)
- Full customer lifecycle via curl: create with every field populated, create with zero fields (confirming true optionality), list, get, cancel-before-quote (succeeds), double-cancel (correctly rejected), accept/decline-before-quote (correctly rejected with `INVALID_STATE`).
- Admin quoting: asked Zee to run two copy-pasteable commands himself (his own admin login, a token he generated and pasted back — never his password) so the admin-only quote endpoint could be exercised without me ever touching his credentials. `QuoteExpiresAt` confirmed exactly `QuotedAt + 14 days` to the second; admin DTO correctly joined the requesting user's real email/display name.
- **The highest-risk path, end to end**: accepted the quote → real `Order` created with a real Razorpay order ID → hand-signed a `payment.captured` webhook (same HMAC technique as ADR-012) using a **temporary local webhook secret set via a process-scoped environment variable** (verified the override actually took effect before trusting the result; never touched Zee's real configured secret, restored his normal backend config immediately after) → order transitioned to `Paid`, and the stock-decrement loop **correctly skipped** the null-`ProductId` custom item with no misleading log line.
- **Regression check, same session**: probed real Dragon-miniature stock (4 left), ran a full normal catalog checkout + the same webhook mechanism, confirmed stock actually decremented to 3 — the `ProductId` nullability change didn't weaken the existing M4 catalog behavior.
- `dotnet test`: 21/21 passing (no new tests added — same integration-test-DB gap as every prior milestone). `dotnet list package --vulnerable --include-transitive`: clean.
- **Bonus correction, found along the way**: `docs/progress.md`'s "Open items" previously claimed no backend endpoint existed to list a customer's own orders — untrue, `GET /api/v1/orders` already exists and works. Only the frontend page is actually missing. Corrected in "Open items" above.

### What is unverified / explicitly deferred
- Decline's happy path wasn't separately curl-tested live (shares an already-proven guard function with accept and an already-proven mutation pattern with cancel — judged low-value to spend a third round-trip through Zee's admin credentials on).
- The actual-expiry branch of the quote-guard (14 days genuinely elapsed) is code-reviewed but not empirically time-tested — would need DB write access to backdate a timestamp, or a real 14-day wait.
- Frontend entirely not started: request form, "my requests" list, accept/decline UI, admin quoting UI.

## Session 2026-08-09 (continued) — M5 frontend: custom order requests + quoting

### What changed
- `lib/custom-orders-api.ts` — typed client mirroring the backend DTOs exactly (`CustomOrderStatus` includes the server-computed `"Expired"` value alongside the real persisted statuses).
- **Extracted `AddressPicker` (+ its `NewAddressForm`) out of `checkout/page.tsx` into `components/commerce/AddressPicker.tsx`** — the custom-order accept flow needed the exact same "pick a saved address or add a new one" UI, and this was the second real use, the same DRY threshold already applied on the backend (`OrderService`'s shared helpers). Refactored `checkout/page.tsx` to use it and **re-verified it still works** (lint/build clean, live-curl'd against the running backend) before treating the extraction as safe.
- New pages: `/custom-orders/new` (request form, every field optional per ADR-016), `/custom-orders` ("my requests" list with a status badge per row), `/custom-orders/[id]` (full detail — shows the quote and lets the customer accept-and-pay or decline when `Quoted`, cancel when `Requested`, links out to `/orders/[orderId]` once `Accepted`), `/admin/custom-orders` (admin queue with an inline quote form per request, appears only on requests still in `Requested` status).
- The accept-and-pay flow reuses `openRazorpayCheckout` from `lib/razorpay-checkout.ts` **completely unchanged** — same widget, same "webhook is the source of truth, the client handler just navigates to the polling order page" pattern as catalog checkout.
- Added a "Commission" link to `SiteHeader` and a spare commission CTA section to the homepage, so the feature is actually reachable (in the Vault voice, no visual identity work needed here — the existing tokens/primitives covered every UI need).

### What was verified, and how
- `npm run lint`: clean (after fixing a handful of `react/no-unescaped-entities` apostrophe issues). `npm run build`: clean, all new routes registered correctly.
- Full-repo grep for leftover raw Tailwind `gray-`/`red-`/`green-`/`amber-` classes: zero matches, including every new file.
- Started the real dev server against the real backend (still holding the exact test data created during the backend verification session) and `curl`'d every new route plus two real request IDs in different states (`Requested` and `Accepted`) — all 200, no hydration-error markers, homepage's commission CTA confirmed present in the rendered HTML.

### What is unverified / explicitly deferred
- Real interactive browser verification — same structural gap as every prior frontend milestone. Zee needs to click through: submit a request with some fields blank, get it quoted (needs his own admin login), accept it and complete a real test-mode payment, watch it land on the existing order-status page, and separately verify decline and cancel actually update the UI correctly.
- Admin quoting UI has no re-quote/edit-quote affordance (matches the backend, which only allows quoting from `Requested` — not a gap, a deliberate v1 scope limit already documented in ADR-016).
- This completes M5 build-wise (backend PR #20 + this frontend work) — both still need Zee's sign-off before the milestone is marked fully done in `docs/product-plan.md`.

## Session 2026-08-10 — M6 backend: fulfillment, real Razorpay refunds, admin dashboard

### What changed
- Confirmed real scope with Zee before writing code: fulfillment is a genuinely separate concern from payment status (own Processing/Shipped/Delivered enum + tracking number/carrier), the dashboard should be a real charted dashboard not just counts, refunds should call Razorpay's actual API not just flip a flag, and custom-order-derived orders stay in their own separate admin view.
- Researched Razorpay's refund API directly against their real docs before writing any code (same discipline as the original M4 integration) — endpoint, idempotency via `receipt`, `speed` defaulting to `normal`, and confirmed via the same PowerShell-reflection technique used before that the .NET SDK models a refund as `client.Payment.Fetch(id).Refund(options)`, not a standalone factory call.
- Found `Payment.Status` already had `Refunded`/`PartiallyRefunded` values sitting unused since M4, with a comment reading "no admin UI needs that distinction until M6" — so no new entity was needed, just a `RazorpayRefundId` field.
- New admin endpoints: `GET/PUT /api/v1/admin/orders` (list/detail/fulfillment), `POST .../refund`, `GET /api/v1/admin/dashboard`. Extended the webhook handler for `refund.processed`/`refund.failed`, same "webhooks are the source of truth" rule as payment capture — the synchronous refund API response never flips `Order.Status` by itself.
- Migration `AddOrderFulfillmentAndRefunds` — four new nullable columns, no `xmin` involvement.

### Two real bugs found and fixed via live data during verification, not by inspection alone
1. The fulfillment-update guard initially rejected any order with `FulfillmentStatus == null` as "never paid" — but every order paid *before* this migration has exactly that shape. Caught immediately: a genuinely paid real order got wrongly rejected on the first live test. Fixed by gating on `Order.Status == Paid` instead.
2. The dashboard's "awaiting fulfillment" count had the identical blind spot, silently excluding the same legacy orders. Fixed for consistency.

### What was verified, and how (all against the real database and the real Razorpay test API)
- Asked Zee for three separate fresh admin tokens over the course of verification (his own login each time, only the resulting short-lived token pasted back, never his password) as earlier tokens kept expiring mid-test — same pattern as M5.
- Fulfillment: marked a real historical paid order `Shipped` with tracking info; confirmed backward-transition and fulfillment-on-unpaid-order guards both reject correctly.
- **A genuine refund was created against Razorpay's real test API** (`rfnd_TNn3lz6VzckznG`) — confirmed `Order.Status` correctly stayed `Paid` until the webhook arrived (not flipped by the synchronous response), confirmed a repeat refund attempt is rejected, then hand-signed a `refund.processed` webhook (temporary local secret, never touching Zee's real one) and confirmed `Order.Status` correctly flipped to `Refunded`.
- **Incidental real-world proof, not staged**: while this was in progress, Zee completed two real payments in the background through the actual ngrok-tunneled webhook — both landed with `FulfillmentStatus: Processing` under the new code, live confirmation the payment-capture change didn't regress.
- `dotnet test`: 21/21 passing. `dotnet list package --vulnerable --include-transitive`: clean.

### What is unverified / explicitly deferred
- `refund.failed` handling (clearing `RazorpayRefundId` so a retry is possible) is code-reviewed but not live-tested — would need a payment method that genuinely fails refund on Razorpay's test servers, not straightforward to trigger on demand.

## Session 2026-08-10 (continued) — M6 frontend: admin orders, fulfillment, refund UI, charted dashboard

### What changed
- Added `recharts` (industry-standard React charting library, per Zee's explicit ask for a real charted dashboard) — 0 vulnerabilities on install, verified the build still succeeds before writing any chart code.
- New `lib/admin-orders-api.ts` mirroring the backend's admin DTOs exactly.
- `/admin/orders` — catalog-orders-only list (custom-order-derived orders deliberately excluded per the confirmed "separate views" decision), status + fulfillment columns.
- `/admin/orders/[id]` — full detail: items, shipping address, payment/refund IDs, a fulfillment control that only offers the *next* valid step (Processing→Shipped→Delivered, one at a time, matching how the backend guard works) with optional tracking number/carrier, and a real "Refund this order" button gated to exactly the states the backend allows (guards mirrored client-side for good UX, but the backend remains the real authority per MASTER-PROMPT.md).
- `/admin/dashboard` — four KPI cards (revenue, paid orders, average order value, awaiting fulfillment), a gold-gradient area chart of the 30-day revenue trend, and a donut chart of order-status breakdown — all colored via the existing Vault CSS tokens (`var(--color-gold)` etc.) passed straight into recharts' SVG props, not hardcoded hex, so the chart styling stays a single source of truth with the rest of the app.
- Extended `/admin/custom-orders`: an `Accepted` request with a linked order now shows a "Manage order →" link straight into `/admin/orders/[id]` — reuses the exact same fulfillment/refund UI rather than duplicating it, since the backend's order-detail endpoint was deliberately not filtered by custom-vs-catalog (only the *list* endpoint excludes custom orders).
- Admin nav: added Dashboard and Orders links.

### What was verified, and how
- `npm run lint`: clean. `npm run build`: clean (one real TypeScript fix along the way — recharts' `Tooltip` `formatter` prop's value type is `ValueType | undefined`, not a bare `number`; loosened the signature and converted internally).
- Full-repo grep for leftover raw Tailwind color classes: zero matches, including every new file.
- Started the real dev server against the real backend (still holding all the real orders/refund test data from the backend verification session) and curl'd every new admin route including a real order-detail page — all 200, no hydration-error markers.

### What is unverified / explicitly deferred
- Real interactive browser verification — same structural gap as every prior frontend milestone. Zee needs to click through: view the orders list, open a real order, advance its fulfillment status, and (carefully, since this is real money) trigger an actual test-mode refund on a real paid test order and watch it settle to Refunded once the webhook lands. Also worth eyeballing the dashboard charts render sensibly against his own real test data.
- This completes M6 build-wise (backend PR #22 + this frontend work) — both still need Zee's sign-off before the milestone is marked fully done in `docs/product-plan.md`.

## Session 2026-08-10/11 — M7: transactional emails via Resend, real domain + DNS

### What changed
- Confirmed Resend as provider and the real domain setup up front with Zee, including his explicit instruction not to defer SPF/DKIM/DMARC. Set up `send.alchemystudios.co.in` as a dedicated sending subdomain in Resend (MX/SPF/DKIM), plus a separate DMARC record — all added at the GoDaddy registrar and verified in Resend's dashboard, with Zee doing every DNS-panel click himself in real time while I explained each field.
- New `EmailService` (wraps Resend's REST API directly via `HttpClient`, no SDK) and `EmailTemplates` (bulletproof-HTML builders for all three email types, table-based layout with inline styles and `bgcolor` attributes for Outlook, safe font fallbacks, Vault colors as hex constants since CSS custom properties don't work in email).
- Caught and fixed a real bug before ever running the code: `EmailService`'s config was originally required at construction, which would have thrown and broken every order endpoint given the Resend secrets weren't configured yet. Made both `Resend:ApiKey`/`Resend:FromAddress` nullable, checked lazily in `SendAsync`, same fix as ADR-012's webhook-secret handling.
- Hooked email sends into three existing state transitions, all best-effort/non-blocking (fire after `SaveChangesAsync`, catch-and-log rather than throw): `OrderService.HandlePaymentCapturedAsync` (order confirmation), `CustomOrderService.QuoteAsync` (quote-ready), `OrderService.UpdateFulfillmentAsync` (shipping update, only on `Shipped`/`Delivered`, not the automatic `Processing` transition).
- Full detail in ADR-018.

### What was verified, and how
- Extensive real-time hand-holding through the actual Resend/GoDaddy DNS setup — screenshots back and forth confirming each field, region selection, and the "Checking DNS" → "Verified" transition.
- Once Zee confirmed the two `dotnet user-secrets set` commands were run and the backend restarted, verified all three email types with real sends, not simulated: marked a real paid order `Shipped` (admin action) → shipping-update email confirmed in Zee's real Gmail inbox (in Inbox, not Spam) via a screenshot. Created a real test custom order request under Zee's own account and quoted it (two normal API calls) → quote-ready email confirmed received. Hand-signed a real `payment.captured` webhook against a real pre-existing `PendingPayment` order under Zee's own account → order-confirmation email confirmed received.
- All three tests used Zee's own account as both the actor and the recipient specifically so he could confirm actual inbox delivery himself, not just a 200 response.
- `dotnet build`: clean.

### What is unverified / explicitly deferred
- No frontend work needed or planned for M7 — emails fire automatically from existing flows, no new UI.
- `refund.failed`-style negative-path email behavior isn't applicable here (fulfillment/quote/payment-capture don't have an equivalent "failure" email in scope).
- M7 backend PR not yet opened — in progress immediately after this entry.
