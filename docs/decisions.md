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

---

## ADR-007 — Superseded `docs/prerequisites.md` (from concurrent CLI session)

**Context:** a second Claude Code (CLI) session was found to be working in this same repo concurrently, having written `docs/prerequisites.md` with a machine/tooling assessment.
**Options:** keep both files (duplicate source of truth); merge and remove; let both sessions continue independently.
**Decision:** merge its verified findings into `docs/technology-stack.md` and `docs/human-actions.md`, then remove `docs/prerequisites.md`. Owner chose to continue with this (VS Code) session driving the build going forward.
**Consequences:** avoids two documents drifting out of sync. No information was lost — see `docs/technology-stack.md` "Your machine" section and `docs/human-actions.md` items 1-8.
**Date:** 2026-08-08
