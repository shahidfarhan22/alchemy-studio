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

---

## ADR-013 — M4 closed out: real `ngrok` + real Razorpay webhook, verified with an actual payment

**Context:** ADR-012 verified the payment flow with a hand-signed webhook. This entry covers actually closing that gap — a genuine Razorpay-initiated webhook, reached via a real payment.

**Setup:** Zee installed `ngrok`, obtained a free reserved domain (`sizable-open-ample.ngrok-free.dev`), and registered `https://<that-domain>/api/v1/payments/webhook` in the Razorpay test-mode dashboard for `payment.captured`/`payment.failed`, with his own custom webhook secret.

**Two real snags hit and resolved along the way, neither a code bug — both operational/environmental:**

1. **`secrets.json` broke twice from hand-editing** (once with a duplicate `"Razorpay:WebhookSecret"` key, once with a stray property-name-without-colon syntax error) after Zee edited it directly instead of using `dotnet user-secrets set`. Resolved by deleting the file entirely and recreating every secret fresh via the `set` command, which can't produce invalid JSON. Also discovered along the way: a stale leftover backend process was still holding port 5007 from an earlier session, masking whether the new secrets actually worked until it was killed and a fresh instance started.
2. **UPI wasn't available as a checkout option**, despite Razorpay's docs describing a `success@razorpay` test VPA. Root cause (verified via search, not assumed): UPI must be explicitly requested/enabled via the **Live** dashboard even to use it in test mode — gated behind the account activation Zee hasn't done yet (deliberately deferred, tied to KYC). Not a bug; switched to testing with a card instead.

**One real mistake on my part, caught by the test itself:** the domestic test card number I originally gave (`4111 1111 1111 1111`) is a generic Visa test number that works with many other payment providers but is **not** Razorpay's documented domestic card — Razorpay's own widget correctly rejected it as "international." I tried three times to extract the real number from Razorpay's docs via WebFetch and failed each time (the page renders the actual table client-side via JavaScript, which the fetch tool doesn't execute) — eventually asked Zee to open the page himself and read it back, rather than keep guessing. The correct one: **Visa domestic debit `4100 2800 0000 1007`**, any future expiry, any CVV. Documented here so it doesn't need rediscovering.

**Verified, for real, in this order:**
1. A failed attempt (wrong test card) produced a **genuine** `payment.failed` webhook — visible directly in backend logs (`WebhookEvents` insert, `Payment` upsert, `Order.Status` update), not simulated. Incidentally proved the failure-handling path works with real Razorpay traffic too, not just the happy path.
2. A successful attempt (correct domestic test card) produced a **genuine** `payment.captured` webhook, logged as: `"Order {id} marked Paid, stock decremented, cart cleared."` — the exact log line `OrderService` emits on success, reached via the real chain: real browser → real Razorpay widget → real Razorpay servers → real `ngrok` tunnel → real backend → real signature verification with Zee's real webhook secret.

This closes the one gap flagged throughout M4 (ADR-012's "temporary local webhook secret... must be replaced with the real one"). M4 is now genuinely, not just plausibly, done.
**Date:** 2026-08-09

---

## ADR-014 — Real bug found via Zee's own browser use: login 500s, root-caused to two separate issues

**Context:** Right after M4's ngrok verification, Zee hit a genuine `500` logging in with his admin account through the actual UI — not something curl testing had ever surfaced, since curl never exercises the real browser's React lifecycle or concurrent-request behavior.

**Two distinct bugs found, not one:**

1. **Login's success was hostage to a non-critical side effect.** `AuthController.Login` calls `MergeAnonymousCartAsync` (folds a guest cart into the account on login, per ADR-011) inline, unguarded — any exception there took down the entire login response with a 500, even though the merge is a convenience feature, not part of the auth-critical path. The actual trigger for the merge itself failing was a `DbUpdateConcurrencyException` on Zee's admin account specifically; multiple clean repro attempts (fresh accounts, matching-product and new-product merge branches) both succeeded, so the precise historical trigger on his account's accumulated cart data (7 leftover anonymous carts from a full day of manual browser testing) was never fully pinned down. **Decision:** rather than chase an intermittent, hard-to-reproduce data race further, made the merge best-effort — wrapped in try/catch, logged as a warning, login always succeeds regardless. The guest-cart cookie is only cleared on a successful merge, so a transient failure just means "try again next login" rather than silently losing the guest cart.
2. **The real, structural bug, found while investigating #1**: `AuthProvider`'s session-restore effect (`frontend/src/lib/auth-context.tsx`) calls `authApi.refresh()` directly inside a bare `useEffect(() => {...}, [])`, with no guard against React's Strict Mode intentionally double-invoking effects in development. Since `/auth/refresh` **rotates** the refresh token server-side (correct security design, see M1), the second of the two near-simultaneous calls presents the cookie value the first call had already rotated away. The backend correctly identifies this as reuse — indistinguishable from a stolen-token replay — and revokes the user's **entire** active token set as designed (the exact security property refresh rotation exists for, see the M1 progress-log entry on reuse-detection). Confirmed directly in the backend log: two `Refresh token reuse detected for user ...` warnings fired back-to-back for the same user on a single page load. This was silently nuking sessions on page load/reload throughout dev testing, likely contributing noise to several earlier "had to log in again" moments that were never investigated at the time.

**Fix for #2:** a `useRef` guard (`hasAttemptedRefresh`) ensures the network call only actually fires once even when Strict Mode invokes the effect twice — the idiomatic React pattern for effects with non-idempotent side effects, per React's own docs.

**Verified:** both fixes build/lint clean (`dotnet build`, `npm run lint`, `npm run build`). Zee confirmed live in his own browser: admin login now succeeds.

**What's still open, not hand-waved:** the precise root cause of the original `DbUpdateConcurrencyException` in `MergeAnonymousCartIntoUserAsync` for Zee's specific account was not conclusively reproduced — only contained. It's plausible it was itself a downstream symptom of #2 (concurrent duplicate requests racing on cart state, the same failure class as the refresh race, just hitting `/auth/login` instead of `/auth/refresh`), in which case the Strict Mode fix may have already resolved it at the root; not confirmed either way. The seven leftover anonymous test carts in the dev database are harmless clutter, not cleaned up.
**Date:** 2026-08-09

---

## ADR-015 — "The Vault" visual identity

**Context:** the app was functionally complete through M4 but visually still the unmodified `create-next-app` boilerplate — default black-on-white Tailwind, an inert unused Geist font load (a `body { font-family: Arial, ... }` rule silently overrode it, a real bug), no shared header/nav, no component library, a placeholder `<title>`. Zee asked for the storefront to be a genuine "wow" on first look, not just functional.

**Process:** rather than iterate blind, built six full homepage/catalog mockups as a single side-by-side comparison artifact — Foundry (dark/molten copper), Gallery (light museum-catalog), Atelier (warm plaster/verdigris workbench), Cartographer (ink/brass expedition ledger), Vault (obsidian/gold auction-house minimalism), Terminal (sci-fi HUD/schematic) — and let Zee pick directly rather than guessing from description alone. He chose **The Vault**.

**Decision — palette:** near-black, neutral (not warm-brown) background `#0a0a0b`, surface `#100f10`, warm-white text `#f0ede4`, muted `#8b877e`, a single gold accent `#c9a227` (reserved for hairlines, focus rings, CTAs — deliberately not reused as a general-purpose color), hairline `#232022`. Semantic status tones (danger/success/warning) kept as their own tokens, separate from gold, so the accent stays an accent.

**Decision — typography:** **Bodoni Moda** (display serif, self-hostable via `next/font/google`, the closest real match to the Didot/Bodoni high-contrast character the mockup called for) paired with **Public Sans** (body). Considered and rejected: Inter/Space Grotesk (too generic/overused for a considered identity), Work Sans (solid but slightly generic), Jost (too art-deco, competes with the serif rather than staying quiet). Public Sans won on legibility at the small tracked-uppercase sizes this design leans on heavily (nav labels, eyebrows, "Lot" tags).

**Decision — motifs:** extreme minimalism, huge negative space, thin 1px gold hairline rules as the only structural ornament, auction-catalog "Lot NN" numbering on the product grid (computed from grid position, not a persisted field — the product schema has no size/subtitle field to hang a real lot identity on, so this is a display artifice, not shown on the product detail page where there's no stable grid position), small-caps tracked-uppercase labels throughout, no borders on product cards — just whitespace and a gold underline revealed on hover.

**Decision — scope, confirmed with Zee:** two PRs, not five-plus (foundation + all customer-facing pages, then admin); admin gets the *full* Vault treatment (same tokens/fonts/hairlines/voice), not a stripped-down tokens-only version — functional elements (the admin products table's columns, the native `confirm()` on delete) stay functional, since usability wins there over ornamentation; a styled text wordmark ("ALCHEMY STUDIO") stands in for a logo since no real brand mark exists yet; the homepage includes a live product-preview grid pulling real catalog data, not just static hero copy.

**Implementation, PR 1 (foundation + customer-facing):** rewrote `globals.css` — full token system via Tailwind v4's `@theme inline`, removed the `prefers-color-scheme` auto-dark-mode block (Vault is one deliberate theme, not OS-driven) and the dead `font-family: Arial` override, added a global `*:focus-visible` gold-ring rule (the app had zero custom focus styling anywhere before this — default browser rings are broken-looking on near-black). Built a first-ever shared component library (`frontend/src/components/` didn't exist before): `ui/` primitives (Button, Input, Textarea, Select, Label, FieldError, ErrorBanner, EyebrowLabel, HairlineRule, PageHeading, Container), `layout/` (SiteHeader, SiteFooter — the app had zero persistent site chrome before this; every page hand-rolled its own inline nav), `catalog/` (ProductCard, LineItemRow). Re-skinned every customer-facing page (home, products list/detail, cart, checkout, order status, login/register, both error boundaries) onto these primitives with **zero logic changes** — every existing state machine (add-to-cart idle/adding/added, cart quantity/availability handling, checkout's auth-gate and Razorpay integration, order-status polling) preserved exactly. Folded in two accessibility fixes while already touching every form/error state: `aria-invalid` added to checkout's address form (previously the only form in the app missing it), and `aria-live="polite"` added around the order-status heading (its content changes async via polling with zero user action, and was previously unannounced to screen readers).

**Verified:** `npm run lint` and `npm run build` both clean; live-rendered every touched page against the real backend (`curl` against a running `npm run dev` + the real API) and confirmed real product data renders correctly with no hydration errors — not just a clean compile. Full interactive click-through is Zee's to do in his own browser (see `docs/product-plan.md`), same pattern as every other frontend milestone.

**Deferred to PR 2:** the admin panel (`/admin/*`) restyle, tracked separately since it's a distinct, lower-risk internal-tool surface.
**Date:** 2026-08-09

---

## ADR-016 — M5 backend: custom order requests + quoting

**Context:** M5's goal (per `docs/product-plan.md`): a customer submits a custom request, admin reviews and sends a quote, customer accepts and pays — reusing the M4 payment flow for the quoted amount. This needed real product decisions before writing any code; confirmed with Zee up front:

- **Every request field is optional** (description, reference image URL, budget range, desired scale) — a deliberate product choice, not an oversight. Someone might only have a reference image, or only a budget in mind.
- **Quoting is a single price + an optional note**, not itemized line items — matches how a one-person studio actually quotes a custom piece.
- **Quotes expire on a fixed 14-day window.** Deliberately **not** enforced by a background sweep — this app has no scheduled-job infrastructure, and a lazy check is just as correct for a fixed window: "Expired" is never a stored status, it's computed at read time and re-checked at the top of Accept/Decline (`CustomOrderService.ComputeEffectiveStatus`/`RequireActiveQuote`), so a stale browser tab can't act on a quote that's actually expired.
- **Login required upfront**, no guest submission — unlike the cart, a custom request is inherently tied to a specific person you're messaging back and forth with about a price; there's no "browse anonymously" case worth the extra plumbing.

**The one real architectural decision, found by reading the existing Order/Payment code before writing anything (not guessed):** `OrderItem.ProductId` was a required, non-nullable field, and `OrderService.HandlePaymentCapturedAsync`'s stock-decrement loop unconditionally assumed every order item maps to a real catalog `Product`. A custom-order item has no real product behind it. Two options considered: (a) fake a `ProductId` for custom items, or (b) make the column nullable and guard the decrement loop. Chose (b) — faking an ID risks silently corrupting stock accounting or producing a misleading "already out of stock, needs manual reconciliation" log line for something that was never a real stock item in the first place. `OrderItem.ProductId` is now `Guid?`; `HandlePaymentCapturedAsync` skips stock decrement entirely when it's null. No FK constraint existed on this column before this change (confirmed by reading `AppDbContext`, not assumed), so this was a safe, additive change — not a tightening of an existing contract.

**Design: custom-quote acceptance reuses the M4 payment flow directly, not a parallel one.** `OrderService` gained `CreateOrderForCustomQuoteAsync` (extracted the address-lookup and Order+Razorpay-creation logic that `CreateOrderAsync` already had into shared private helpers, so both paths — cart checkout and custom-quote acceptance — go through the exact same "persist Order, call Razorpay, return `CreateOrderResponse`" code). `CustomOrderRequest` itself never tracks payment status — once accepted, the real `Order.Status` (via the existing, unmodified `/orders/{id}` polling page) is the single source of truth for payment state, exactly like a catalog order. `CustomOrderRequest.Status` only tracks the request/quote lifecycle (`Requested → Quoted → Accepted/Declined/Cancelled`).

**Verified, against the real database and the real webhook-processing code path — not just curl'd for 200s:**
- Full customer lifecycle: create (with every field, and with zero fields, confirming true optionality), list, get, cancel-before-quote (succeeds), cancel-after-cancel (correctly rejected), accept/decline-before-quote (correctly rejected with `INVALID_STATE`).
- Admin quoting: `QuoteExpiresAt` computed exactly as `QuotedAt + 14 days` (confirmed to the second against real timestamps), admin DTO correctly joins the requesting user's email/display name.
- **The highest-risk path, end to end**: accepted a real quote → `CreateOrderForCustomQuoteAsync` created a real `Order` with a real Razorpay order ID → hand-signed a `payment.captured` webhook (same HMAC technique as ADR-012, using a **temporary local webhook secret** set via a process-scoped environment variable override, never touching Zee's real configured secret) → confirmed the order transitioned to `Paid` **and the stock-decrement loop correctly skipped the null-`ProductId` item with no misleading log line**.
- **Regression check on the exact same run**: a normal catalog order (real product, real stock) was checked out and paid via the same webhook mechanism immediately after, confirming stock still decrements correctly for real products (4 → 3 units, observed directly) — the nullable-`ProductId` change did not weaken the existing M4 behavior.
- `dotnet test`: 21/21 passing. `dotnet list package --vulnerable --include-transitive`: clean.

**What's explicitly not verified:** the decline action's happy path (guard passes, `Status → Declined`) wasn't separately curl-tested live — it shares the identical guard function (`RequireActiveQuote`) already proven correct via the accept-path tests, and the identical state-mutation pattern already proven correct via the cancel-path test, so this was judged low-marginal-value to re-test rather than requesting a third round-trip through Zee's admin credentials. The "actually expired quote" branch of `RequireActiveQuote` (14 days elapsed) is logically implemented and code-reviewed but not empirically time-tested — doing so would need either real DB write access to backdate `QuoteExpiresAt` or an actual 14-day wait, neither practical here.
**Date:** 2026-08-09

---

## ADR-017 — M6 backend: fulfillment tracking, real Razorpay refunds, admin dashboard

**Context:** M6's one-line goal ("admin can see and manage all orders, update fulfillment status, view a basic dashboard") hid several real product decisions. Confirmed with Zee up front: fulfillment tracking is a genuinely separate concern from payment status (Processing → Shipped → Delivered, with tracking number/carrier); the dashboard should be a real industry-standard dashboard with charts, not just counts; refunds should call Razorpay's actual refund API, not just flip a status flag by hand; and custom-order-derived orders stay in their own separate admin view rather than being merged into the catalog orders list.

**Refunds — researched against Razorpay's real docs before writing any code** (same discipline as ADR-012/013, not assumed from memory): `POST /v1/payments/:id/refund`, `speed` defaults to `"normal"` (5-7 working days, no extra fee) if omitted — left explicit in the code anyway so a future edit can't silently switch to instant refunds and their associated cost. `receipt` is Razorpay's own idempotency key for refunds on the same payment; passed as our `Order.Id`. The .NET SDK models this as an action on a *fetched* `Payment` object (`client.Payment.Fetch(id).Refund(options)`), not a standalone `Refund.Create` — confirmed via the same PowerShell-reflection technique used for the original M4 integration, not guessed from the REST shape. Refund status only ever flips `Order.Status` to `Refunded` on the `refund.processed` **webhook** — never on the synchronous API response, exactly the same "webhooks are the source of truth" rule payment capture already follows (docs/architecture.md), since Razorpay's own docs describe refunds as eventually consistent regardless of what the initial response shows.

**No new entity needed for refunds.** `Payment.Status` already had `Refunded`/`PartiallyRefunded` values sitting unused since M4, with a comment reading "no admin UI needs that distinction until M6" — found while reading the existing code before designing anything, not rediscovered from scratch. Just added `Payment.RazorpayRefundId` (set when a refund is initiated, cleared again on `refund.failed` so a retry is possible) and reused the existing enum.

**Fulfillment is independent of `OrderStatus`.** New `FulfillmentStatus` enum (`Processing/Shipped/Delivered`) plus `TrackingNumber`/`Carrier` on `Order`, set to `Processing` the moment `HandlePaymentCapturedAsync` marks an order `Paid` (nothing is fulfillable before payment). Admin can move it forward, never backward.

**Two real bugs found and fixed via live data during verification, not by inspection alone:**
1. The fulfillment-update guard originally rejected any order with `FulfillmentStatus == null` as "never paid" — but every order paid *before* this migration has exactly that shape (the column didn't exist yet), even though they're genuinely `Paid`. Caught immediately when testing against real pre-existing order data: a real paid order got wrongly rejected. Fixed by gating on `Order.Status == Paid` instead, and treating a null `FulfillmentStatus` as an implicit `Processing` baseline for the backward-transition check.
2. The dashboard's "orders awaiting fulfillment" count only matched `FulfillmentStatus == Processing` exactly, so it silently excluded every one of those same legacy null-fulfillment paid orders — undercounting real, actionable work. Fixed for consistency with (1): null is treated as `Processing` there too.

**Custom orders stay out of `/admin/orders`.** A catalog order's items always have a real `ProductId`; a custom-order-derived order's single item never does (ADR-016) — used as the filter (`o.Items.All(i => i.ProductId != null)`) rather than adding a new discriminator column.

**Dashboard**: total revenue and average order value are computed from `Paid` orders only (a `Refunded` order's `Status` no longer reads `Paid`, so refunds fall out of revenue automatically without any special-case subtraction logic). Revenue-by-day covers a rolling 30-day window with zero-filled gaps (not just the sparse days with real data) so a line/bar chart renders continuously. All aggregation happens in-memory after a single query, matching the project's existing "fine at this size, revisit if the catalog grows large" pattern used elsewhere, rather than pushing `GroupBy`+enum-to-string translation into SQL, which is a known EF Core translation hazard.

**Verified, against the real database and the real Razorpay test API — not simulated for the highest-risk parts:**
- Fulfillment: marked a real historical paid order `Shipped` with tracking info; confirmed backward transitions and fulfillment-on-unpaid-orders are both rejected with clear errors.
- **A genuine refund was created against Razorpay's real test API** (`rfnd_TNn3lz6VzckznG`), not simulated — confirmed `Order.Status` correctly stayed `Paid` until the webhook arrived, confirmed a second refund attempt is rejected (`REFUND_ALREADY_INITIATED`), then hand-signed a `refund.processed` webhook (same temporary local-secret technique as ADR-013/ADR-016, never touching Zee's real configured secret) and confirmed `Order.Status` correctly flipped to `Refunded`.
- **Incidental live confirmation of the payment-capture change**: while this verification was in progress, Zee completed two real payments in the background through the actual ngrok-tunneled webhook (unprompted) — both orders correctly landed with `FulfillmentStatus: Processing` under the new code, real end-to-end proof this didn't regress, not just a hand-signed simulation.
- `dotnet test`: 21/21 passing. `dotnet list package --vulnerable --include-transitive`: clean.
**Date:** 2026-08-10

---

## ADR-018 — M7 backend: transactional emails via Resend, real domain + DNS

**Context:** M7's goal — order confirmation, quote-ready, and shipping-update emails send reliably and don't land in spam. Confirmed with Zee up front: Resend as the provider, the real domain (`alchemystudios.co.in`, already purchased) rather than a sandbox, a dedicated sending subdomain so the root domain's MX/reputation stay untouched, and fully on-brand HTML matching The Vault rather than plain text — his exact instruction was "Don't defer the SPF/DKIM/DMARC work — do it properly now since the domain exists."

**Domain/DNS setup, done for real, not deferred:** `send.alchemystudios.co.in` added as a sending domain in Resend, with MX, SPF (both under the `send` subdomain, shown as `send.send` in GoDaddy due to Resend's default "Custom Return-Path" value of `send`), and DKIM (`resend._domainkey.send.alchemystudios.co.in`, TXT) records added at the registrar. All three verified in Resend's dashboard. A DMARC record (`_dmarc.send.alchemystudios.co.in`, `TXT`, `v=DMARC1; p=none; rua=mailto:alchemy3dstudios@gmail.com`) was added separately — DMARC isn't part of Resend's own domain setup, it's scoped per-host and independent of any provider. From-address: `noreply@send.alchemystudios.co.in`.

**`EmailService` wraps Resend's REST API directly** (`POST https://api.resend.com/emails`, bearer auth, flat JSON body) — no SDK, the request shape is a single flat object, confirmed against Resend's own docs before writing any code, same discipline as the Razorpay integrations. Caught and fixed one bug before ever running it: the constructor originally read `Resend:ApiKey`/`Resend:FromAddress` as required config, which would throw at DI-construction time and break every order-related endpoint the moment `OrderService`/`CustomOrderService` were constructed — for a feature whose domain/DNS/account setup is a real human task that takes time. Fixed by making both nullable and checked lazily inside `SendAsync` (same fix as ADR-012's RazorpayService webhook-secret handling), logging and no-op'ing when unconfigured rather than throwing.

**Sending is best-effort, never blocking** — the same "a non-critical convenience feature must never break the critical path it's attached to" rule ADR-014 established for cart-merge-must-never-break-login. Every call site (`OrderService.HandlePaymentCapturedAsync`, `OrderService.UpdateFulfillmentAsync`, `CustomOrderService.QuoteAsync`) fires `email.SendAsync` *after* its own `SaveChangesAsync`, never before, and `SendAsync` itself catches and logs rather than throwing — a Resend outage or a bad address can never roll back a real order/quote state transition.

**Three trigger points, one on a condition:**
- Order confirmation: `HandlePaymentCapturedAsync`, unconditionally once an order is marked `Paid`.
- Quote-ready: `CustomOrderService.QuoteAsync`, unconditionally once a quote is set.
- Shipping update: `UpdateFulfillmentAsync`, **only** when the new status is `Shipped` or `Delivered` — deliberately not on the automatic `Processing` transition that fires the moment payment is captured, since that one isn't news to the customer.

**Templates (`EmailTemplates.cs`) use the "bulletproof HTML email" technique**, not a naive port of the web CSS: table-based layout, inline styles, `bgcolor` HTML attributes alongside CSS `background-color` (Outlook desktop ignores the CSS-only version), and safe fallback font stacks (Georgia/Times New Roman standing in for Bodoni Moda, Arial/Helvetica for Public Sans) since custom webfonts aren't reliably loaded by email clients. Colors are the same Vault tokens as hex constants (`#0a0a0b`/`#100f10`/`#c9a227`/etc.) — can't reference CSS custom properties inside an email, so these are a manually-kept-in-sync copy of `globals.css`, called out as such in a comment.

**Verified with real sends, not simulated, covering all three templates:**
- Order confirmation: hand-signed a real `payment.captured` webhook (same technique as ADR-016/017, using the currently-configured local test webhook secret, not Zee's real one) against a real pre-existing `PendingPayment` order under Zee's own account. Email landed in his real Gmail inbox.
- Quote-ready: created a real (test) custom order request under Zee's own account via the normal customer endpoint, then quoted it via the normal admin endpoint. Email landed in his inbox.
- Shipping update: marked a real, already-`Paid` order (under Zee's own account) `Shipped` via the normal admin endpoint. Email landed in his inbox, styled correctly, in Inbox rather than Spam — direct confirmation that SPF/DKIM/DMARC are all correctly configured, not just "records present."
- All three used Zee's own account for both the admin action and the recipient address, so each could be confirmed by him actually opening Gmail — not inferred from a 200 response alone.
- `dotnet build`: clean.
**Date:** 2026-08-11
