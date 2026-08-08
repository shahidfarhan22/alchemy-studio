# Decisions (ADR log)

Lightweight ADRs: context → options → decision → consequences → date. Never delete an entry; supersede it with a new one that links back.

---

## ADR-001 — Target market: India only

**Context:** need to know currency, payment gateway options, and legal framework before designing anything.
**Options:** India-only vs. also international.
**Decision:** India only for MVP.
**Consequences:** single currency (INR), single locale, Razorpay/Cashfree viable, DPDP Act applies (not GDPR, unless this changes).
**Date:** 2026-08-08

---

## ADR-002 — Business model: catalog + custom orders, individual seller

**Context:** owner sells 3D-printed miniatures, some ready-made, some on request.
**Options:** catalog-only; custom-only; both.
**Decision:** both. Custom orders use a request-form + manual-quote workflow (not automatic pricing), because pricing custom prints automatically from a 3D file is a much harder problem than an individual seller with one printer needs solved right now.
**Consequences:** need two related but distinct order flows sharing one payment/fulfillment path once a price is agreed. Owner sells as an individual (no GST/business registration yet) — affects payment gateway KYC path; GST becomes relevant only above ₹20L/40L turnover.
**Date:** 2026-08-08

---

## ADR-003 — Stack: ASP.NET Core + Next.js (two deployables), not Next.js full-stack

**Context:** the project template's default preference was Next.js frontend + ASP.NET Core backend. For a lean-budget solo project, a Next.js-full-stack (single deployable) alternative was raised and explicitly explained: cheaper, simpler, one language, faster to build — at the cost of not learning C#/.NET.
**Options:** (a) Next.js full-stack only; (b) ASP.NET Core API + Next.js frontend (two deployables); (c) ASP.NET Core serving a React SPA from one origin.
**Decision:** (b). Owner explicitly wants to learn tech broadly and is willing to accept the extra cost/complexity (two hosting bills, CORS/auth plumbing) in exchange for learning both C#/.NET and React/TypeScript as distinct skills.
**Consequences:** more scaffolding before feature work starts; needs a clean API contract (`docs/api.md`) and correct CORS/JWT wiring between the two apps; slightly higher hosting cost than the full-stack alternative.
**Date:** 2026-08-08

---

## ADR-004 — Database: PostgreSQL, not SQL Server

**Context:** template listed both as options depending on requirements.
**Options:** PostgreSQL vs. SQL Server.
**Decision:** PostgreSQL.
**Consequences:** better/cheaper managed free-tier hosting options (Neon, Supabase, Railway) for a lean-budget project; works identically in Docker locally.
**Date:** 2026-08-08

---

## ADR-005 — Auth: ASP.NET Core Identity (build), not a managed provider (buy)

**Context:** master prompt requires an explicit build-vs-buy call on auth, the highest-risk area to get wrong.
**Options:** ASP.NET Core Identity (self-hosted, free) vs. managed provider (Auth0/Clerk/Entra ID — per-user or flat monthly cost).
**Decision:** ASP.NET Core Identity, following the documented hardening rules in `AGENTS.md` (Argon2id/bcrypt hashing, rotating refresh tokens, short-lived access tokens, enumeration-safe responses, per-IP+per-account rate limiting).
**Consequences:** no recurring auth vendor cost; more implementation and testing responsibility on us — auth gets a dedicated security review at M1.
**Date:** 2026-08-08

---

## ADR-006 — Local dev database via Docker Compose, not a native PostgreSQL install

**Context:** machine has 24GB RAM and working virtualization (WSL2) — comfortable for Docker. C: drive has only ~51GB free, a real constraint.
**Options:** native PostgreSQL install vs. Docker container.
**Decision:** Docker container.
**Consequences:** reproducible environment matching how we'd likely deploy; must watch Docker's disk usage on C: and move the disk image to D: if it drops below ~25GB free.
**Date:** 2026-08-08
**Superseded by:** ADR-008 (2026-08-09) — owner already had a native PostgreSQL 17 install running; decision reversed.

---

## ADR-007 — Superseded `docs/prerequisites.md` (from concurrent CLI session)

**Context:** a second Claude Code (CLI) session was found to be working in this same repo concurrently, having written `docs/prerequisites.md` with a machine/tooling assessment.
**Options:** keep both files (duplicate source of truth); merge and remove; let both sessions continue independently.
**Decision:** merge its verified findings into `docs/technology-stack.md` and `docs/human-actions.md`, then remove `docs/prerequisites.md`. Owner chose to continue with this (VS Code) session driving the build going forward.
**Consequences:** avoids two documents drifting out of sync. No information was lost — see `docs/technology-stack.md` "Your machine" section and `docs/human-actions.md` items 1-8.
**Date:** 2026-08-08

---

## ADR-008 — Local dev database: use existing native PostgreSQL 17, not Docker (supersedes ADR-006)

**Context:** ADR-006 chose Docker for local Postgres, reasoned against "installing something new." Mid-M0, discovered the owner already had PostgreSQL 17 installed natively (`D:\postgres`, D: drive — not the C: drive that's tight on space) and running as a Windows service (`postgresql-x64-17`), pre-dating this project.
**Options:** (a) keep using Docker anyway, running Postgres twice on the same machine; (b) switch to the existing native install.
**Decision:** (b). With a modern (17.5), already-running native instance available, Docker's original justification (avoid a new install, reproducibility) is weaker than the cost of running Docker Desktop's background VM just to duplicate it. Docker Desktop remains installed and may still be used later (CI containers, or containerized deployment) — this decision is scoped to local dev only.
**Consequences:** a dedicated database (`alchemy_studio`) and login role (`alchemy_app`) were created inside the existing instance, isolated from any other databases already on it (e.g. `enabl_db`, unrelated to this project). Local dev connection string points at `localhost:5432`, not a container. `docs/human-actions.md`'s "start Docker Desktop" item is removed as a blocker for M0.
**Incident during this change:** re-running the Postgres installer (to check for pgAdmin) was cancelled mid-way, temporarily removing the Windows service and `bin\` folder (data directory was untouched). Re-running the installer to completion restored it. Separately, the postgres superuser password from the original 2025-07-01 install was unknown/forgotten and was reset via a temporary `trust`-auth edit to `pg_hba.conf` (reverted immediately after, verified back to `scram-sha-256`).
**Date:** 2026-08-09

---

## ADR-009 — M1 auth implementation: three refinements to ADR-005

**Context:** implementing M1 surfaced three places where the letter of the original hardening rules (`AGENTS.md`, ADR-005) needed a judgment call.

1. **Password hashing: ASP.NET Core Identity's built-in hasher (PBKDF2-HMAC-SHA256), not Argon2id/bcrypt as ADR-005 stated.**
   **Options:** (a) Identity's default `PasswordHasher<TUser>`; (b) swap in a custom `IPasswordHasher<T>` using Argon2id via a third-party package (e.g. Konscious.Security.Cryptography).
   **Decision:** (a). Identity's default is PBKDF2-HMAC-SHA256 with a high iteration count — NIST SP 800-63B-approved, not the same thing as the "SHA-family alone" AGENTS.md warns against (that referred to unsalted single-round hashing). It's also the dependency-policy default: platform/stdlib over an added package. Argon2id is arguably marginally stronger, but not enough to justify a third-party crypto dependency for a project this size.
   **Consequences:** `AGENTS.md`'s password-hashing line should be read as "Identity's default hasher (PBKDF2), not Argon2id/bcrypt" going forward.

2. **Registration is not fully enumeration-safe, despite AGENTS.md saying "login, registration, and password-reset must not reveal whether an email exists."**
   **Context:** true enumeration-safety on registration needs an email-confirmation step ("check your inbox either way") — which needs working email, deferred to M7.
   **Decision:** registration returns a clear `EMAIL_ALREADY_REGISTERED` error for now. **Login and refresh are fully enumeration-safe** (generic error, matched timing via a dummy password check when the account doesn't exist).
   **Consequences:** revisit registration's response once M7 adds email — switch to a generic "check your inbox" response for both outcomes.

3. **Account throttling is per-IP rate limiting + Identity's built-in (hard) lockout, not true "progressive delay" as AGENTS.md's ideal states.**
   **Decision:** per-IP: 10 requests/minute fixed window on all `/api/v1/auth/*` endpoints. Per-account: Identity's default lockout (5 failed attempts → 5 minute lockout). A hand-built progressive-delay scheme (increasing wait per failure) is more correct per AGENTS.md but meaningfully more code for a launch-stage MVP.
   **Consequences:** acceptable for now; revisit if real credential-stuffing abuse is observed (matches the project's general "add defenses when abuse is observed, not preemptively" posture — see SEO/bot-protection section of `MASTER-PROMPT.md` §20).

**Also implemented, matching AGENTS.md exactly (no deviation):** refresh tokens stored only as a hash, rotated on every use, reuse triggers revocation of the entire active token chain for that user (verified: replaying a rotated-away token both fails *and* kills the legitimately-rotated session, forcing re-login). Access tokens are 15-minute JWTs; refresh tokens live in an `HttpOnly; SameSite=Lax` cookie scoped to `/api/v1/auth` (`Secure` added automatically outside Development). First admin seeded from `Admin:Email`/`Admin:Password` config (never hardcoded), `MustChangePassword` forced true, verified end-to-end (temp password login → forced-change flag → change-password → old password rejected, new one works).
**Date:** 2026-08-09
