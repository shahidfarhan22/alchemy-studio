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

---

## ADR-010 — M2 catalog: image handling, concurrency mechanism, soft-delete scope

**Context:** implementing M2 (product catalog) required three implementation calls not previously settled.

1. **Product images are a plain `ImageUrl` string field, not a real upload/object-storage pipeline.**
   **Context:** `docs/technology-stack.md` already flagged object storage as "TBD at M2, leaning Cloudflare R2" — but choosing and setting up R2 means creating an external account, which is a human action I can't do (`docs/human-actions.md`).
   **Decision:** MVP ships with `Product.ImageUrl` as a plain string — admin pastes a URL (e.g. hosted anywhere) rather than uploading a file through the app. No fake upload UI was built pretending to be complete.
   **Consequences:** real upload (presigned direct-to-storage per MASTER-PROMPT.md §16) is a follow-up once an object storage account exists. Logged in `docs/human-actions.md`.

2. **Optimistic concurrency uses Postgres's built-in `xmin` system column, not a hand-maintained version column.**
   **Decision:** `Product.RowVersion` (`uint`) is mapped via EF Core's `.IsRowVersion().HasColumnName("xmin")` — standard, well-documented Npgsql/EF Core pattern, avoids maintaining an extra column/increment logic by hand.
   **Real bug hit and fixed while implementing this:** `dotnet ef migrations add` doesn't know `xmin` is a Postgres system column and generated a migration that tried to `CREATE TABLE` with an explicit `xmin` column — Postgres rejects this outright ("column name conflicts with a system column name"), which would have failed at apply-time. Fixed by hand-editing the generated migration to remove that column definition (the system column already exists on every table; EF Core just reads/checks it via the mapping, it never needed creating). **Verified by actually applying the migration and exercising a real concurrency conflict** (stale `rowVersion` on update → `409 CONCURRENCY_CONFLICT`), not just by the migration succeeding.
   **Consequences:** this hand-edit is required every time a future migration touches the `Products` table's initial creation; if `Product` is ever dropped and recreated in a new migration, re-apply this same fix. Noted here and in a comment in the migration file itself.

3. **Soft-deleted products are invisible everywhere, including to admin — no "view/restore deleted" capability yet.**
   **Context:** MASTER-PROMPT.md's admin-panel rules require destructive admin actions to be soft-delete where possible — implemented via an `IsDeleted` flag + EF Core global query filter (`HasQueryFilter`), which applies to *every* query against `Products`, admin included.
   **Decision:** acceptable for MVP — data isn't actually gone (satisfies the core "soft delete" requirement, e.g. for audit/recovery-by-a-developer-with-DB-access), but there's no admin-facing way to see or restore a deleted product yet.
   **Consequences:** revisit if/when the admin panel (M6) needs a "trash" view — would mean an admin-only endpoint using `.IgnoreQueryFilters()` plus a restore action.
**Date:** 2026-08-09

---

## ADR-011 — M3 cart: guest carts, server-side persistence, no silent item removal

**Context:** Zee's requirements for M3: cart must persist across reload, and guests can add to cart freely but must log in before checkout.

1. **Cart storage: always server-side (Postgres), for both guests and logged-in users — not browser localStorage.**
   **Decision:** a `Cart` row always exists, identified either by `UserId` (logged in) or a random `AnonymousToken` (guest, delivered via a `cartToken` cookie — `HttpOnly`, `SameSite=Lax`, `Path=/` so it also reaches `/api/v1/auth` for the merge step below, not `Secure` in dev). On login/register, `AuthController` checks for this cookie and calls `CartService.MergeAnonymousCartIntoUserAsync`, folding guest items into the account's cart, then clears the cookie.
   **Why not localStorage for the guest cart:** satisfies "persists across reload" for guests too (a cookie survives reloads same as localStorage would), while keeping *one* cart implementation instead of two (guest-side JS logic vs. server-side for accounts) — the frontend always just calls the same `/api/v1/cart` endpoints regardless of login state.

2. **Cart items reflect live product price/stock, never a snapshot from when added.**
   **Decision:** `CartItemDto` is computed fresh from the current `Product` row every time the cart is fetched — no price stored on `CartItem` itself.
   **Consequences:** simpler, avoids stale-price bugs, but means a price change is reflected in an existing cart immediately (acceptable for MVP; revisit only if this becomes a real complaint).

3. **Unavailable cart items (product soft-deleted or unpublished after being added) are shown, not silently dropped.**
   **Context:** raised by Zee directly after noticing the original implementation would make an item vanish from the cart with no explanation if its product was removed from the catalog.
   **Decision:** `CartItemDto` carries an `IsAvailable` flag; `ToDto()` queries products with `.IgnoreQueryFilters()` so a soft-deleted product's last-known name/image/price can still be shown, marked unavailable, rather than the cart entry disappearing.
   **Real bug found and fixed while implementing this**: the cart-merge method (`MergeAnonymousCartIntoUserAsync`) had the *same* silent-drop problem via a separate, un-fixed query — it looked up stock without `IgnoreQueryFilters()`, so a soft-deleted product's stock resolved to 0, capping its merged quantity to 0 and dropping it. Caught by deliberately re-testing the exact "add to cart, then admin deletes it, then log in" sequence after fixing `ToDto()`, not assumed fixed just because `ToDto()` was. Fixed by removing quantity-capping from merge entirely — capping belongs at the point of directly adding/updating a quantity (`AddItemAsync`/`UpdateItemQuantityAsync`, which already enforce it), not at merge, which should just honestly combine what existed in both carts and let the existing availability flags reflect reality.

**Also:** `Address` entities require login (no anonymous addresses, consistent with "login required at checkout"); one default address per user, enforced by clearing any existing default on create/update of a new one.

**Verified:** full manual walkthrough — anonymous cart creation, stock-limit enforcement (409 on exceeding stock), the unavailable-item display fix, the merge-on-login fix (both the buggy case with a deleted product and a normal case with an available one, to confirm no regression), address CRUD + validation + auth requirement. All against the real database, via curl.
**Date:** 2026-08-09

---

## ADR-012 — M4 payments: Razorpay integration, order/payment model, two real bugs caught before shipping

**Context:** M4 needed a payment provider integration. Chose Razorpay per the original requirements (India-focused, individual-seller KYC path — see `docs/requirements.md`).

1. **Official Razorpay .NET SDK (`Razorpay` NuGet package), not a hand-rolled HTTP client.**
   **Decision:** the SDK is first-party (owned by `razorpay` on NuGet/GitHub), actively maintained (pushed within weeks of this decision, 537K+ downloads), and handles the fiddly parts (HMAC signature verification for both checkout callbacks and webhooks) in a way that's easy to get subtly wrong by hand. Matches the dependency policy's "prefer one well-maintained package" over reimplementing crypto ourselves.
   **Note:** the SDK's `Order` type collides with our own `Orders.Order` entity — aliased on import (`RazorpaySdkOrder`), not renamed our own domain entity to work around a third-party name.

2. **Money/state model**: `Order`/`OrderItem` snapshot price and product name *at order time* — unlike `Cart`, which always shows live prices (ADR-011). An order must never silently reflect a later price change. `Payment.Status` follows the state machine already documented in `docs/architecture.md` (`Created → Authorized → Captured → Failed/Refunded`); `WebhookEvent` is an append-only log keyed uniquely on Razorpay's event ID, existing purely for idempotency + audit trail.

3. **Stock is decremented at payment-capture time (via webhook), not at order-creation time.**
   **Context:** `docs/architecture.md`'s concurrency guidance calls for a conditional update (`WHERE stock >= quantity`), not read-then-write — implemented via EF Core's `ExecuteUpdateAsync` with that exact condition.
   **Decision:** deliberately *not* reserving/holding stock the moment an order is created (while payment is still pending) — an abandoned or failed checkout would otherwise lock up stock for no reason. Accepted tradeoff: a narrow race window where two customers could both have a payment captured for the last unit; if the conditional update affects 0 rows, it's logged as needing manual reconciliation rather than silently going negative or failing the already-captured payment. Acceptable for a low-volume solo store; revisit with real stock reservations only if overselling actually happens.

4. **The frontend's "payment successful" moment is only ever a poll of `GET /api/v1/orders/{id}`, never a client-asserted state.**
   **Decision:** no "verify checkout callback" endpoint. The Razorpay widget's client-side success callback is UX-only (used to start polling); the order's `Status` only ever changes inside `OrderService`, driven by the verified webhook. Matches `docs/architecture.md`: "webhooks are the source of truth, not the redirect callback" — taken literally, not just as a signature-verification exercise.

**Two real bugs found and fixed before this ever reached a real Razorpay account, both caught by verifying against reality instead of trusting assumptions:**

- **`RazorpayService`'s constructor required all three secrets (Key ID, Key Secret, Webhook Secret) eagerly**, even though the webhook secret doesn't exist until a webhook is configured in the Razorpay dashboard (a later step, needs `ngrok`). This broke order creation entirely with a config error, for a feature that doesn't need that secret at all. Fixed by making the webhook secret optional at construction, required only inside `VerifyWebhookSignature`.
- **The webhook event-ID handling was wrong** — the code assumed Razorpay's webhook JSON body has a top-level `"id"` field for the event, modeled without checking. **Verified directly against Razorpay's own documentation** (fetched via WebFetch, not recalled from memory) before writing the test payload that would have exposed this: their payload has **no such field at all**; the real event identifier is the `X-Razorpay-Event-Id` **HTTP header**. As originally written, this would have made `INVALID_WEBHOOK_PAYLOAD` fire on **every single real webhook delivery**, silently breaking all payment confirmation in production. Fixed by reading the header in `PaymentsController` and threading it through as an explicit parameter instead of parsing it from the body.

**Verified:** full order lifecycle against the real database and the real Razorpay test API (not a mock) — order creation (real `razorpay_order_id` returned), a hand-signed webhook payload (HMAC-SHA256 computed the same way Razorpay signs real deliveries) correctly transitioning the order to `Paid`, decrementing stock, and clearing the cart; a replayed duplicate event confirmed idempotent (no double-decrement); a tampered signature confirmed rejected. A temporary local webhook secret was set for this test — **must be replaced with the real one once the webhook is configured in the Razorpay dashboard** (needs `ngrok`, tracked as a next step).
**Date:** 2026-08-09
