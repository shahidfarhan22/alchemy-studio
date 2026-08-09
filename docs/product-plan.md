# Product Plan

See `docs/requirements.md` for the underlying requirements this plan implements.

## Feature tiers

**MVP (this roadmap):** catalog browsing, cart, checkout + payment, custom order requests with manual quoting, customer accounts, admin panel, order fulfillment, transactional email, legal pages.

**Phase 2 (later, not scoped yet):** reviews/ratings, coupon codes, wishlist, in-browser 3D model preview, WhatsApp notifications, analytics dashboard beyond basics.

**Future (ideas, not committed):** multi-admin/staff roles, international customers, subscription/repeat-order flows.

## Milestone roadmap

Each milestone is independently implementable, testable, and committable. None is "done" until every Definition of Done box is checked (see `MASTER-PROMPT.md` §2).

### M0 — Repo & tooling setup — ✅ DONE (2026-08-09)
**Goal:** a working local dev environment both of us can run.
**Files touched:** `.gitignore`, `.env.example`, `frontend/`, `backend/`, `docs/`, `AGENTS.md`, `README.md`
**Depends on:** —
**Definition of Done:**
  - [x] Git repo initialized, `main` branch
  - [x] Frontend (Next.js) and backend (ASP.NET Core) skeletons run locally
  - [x] Postgres runs locally — via native install, not Docker Compose (see ADR-008; plan changed mid-milestone once an existing native Postgres 17 was found)
  - [x] `docs/*` planning docs in place
  - [x] Verified by Zee — how: ran `dotnet build`/`dotnet run` and `npm run build`/`npm run dev` himself, confirmed http://localhost:5007/health/ready and http://localhost:3000 both working in his own browser; also verified the DB health check by stopping/starting the Postgres service and watching it flip unhealthy/healthy
**Estimated effort:** S
**Risk:** local tooling gaps (SDK versions, Docker) — see `docs/human-actions.md`. Materialized as a Postgres install hiccup (see ADR-008), resolved.

### M1 — Auth (register / login / roles) — MOSTLY DONE, not fully closed out
**Goal:** customers and the admin can register, log in, and log out securely.
**Depends on:** M0
**Definition of Done:**
  - [x] Feature works end-to-end (verified via direct API testing + cross-origin cookie proof; not yet click-tested in a real browser — see below)
  - [~] Automated tests: unit tests written and passing (TokenService, error envelope — 13 tests). **Full integration tests (real Postgres, register/login/refresh/reuse-detection) still pending** — needs Docker or a dedicated test DB, see docs/progress.md.
  - [x] Error + loading + empty states handled
  - [x] No new lint/type errors
  - [x] Docs updated
  - [ ] **Verified by Zee** — still needed: click through register → login → logout in an actual browser
**Estimated effort:** M
**Risk:** getting refresh-token/cookie handling wrong is the easiest way to introduce a security bug — see AGENTS.md auth rules. Mitigated: refresh rotation + reuse-detection tested directly (see docs/progress.md 2026-08-09), and the cross-origin cookie mechanics were proven with curl, not just assumed.

### M2 — Product catalog — code complete, needs Zee's browser verification
**Goal:** admin can create/edit products with images and stock; customers can browse and view product detail pages.
**Depends on:** M1 (admin auth)
**Definition of Done:**
  - [x] Feature works end-to-end — verified via curl (backend) and curl-against-real-pages (frontend HTML output); **real interactive browser click-through still needed from Zee** (same gap as M1)
  - [x] Automated tests: `SlugGenerator` unit tests (7). Full integration coverage blocked on the same open item as M1 auth (docs/progress.md).
  - [x] Error + loading + empty states handled (loading states, empty "no products yet", form validation errors, 404 for missing products)
  - [x] No new lint/type errors
  - [x] Docs updated (this entry, ADR-010)
  - [ ] Verified by Zee
**Estimated effort:** M
**Risk:** image upload/storage decisions need to be right before this grows (see `docs/architecture.md`) — **resolved as a deliberate MVP simplification**: plain `ImageUrl` string field for now, real upload deferred to when an object storage account exists (ADR-010, `docs/human-actions.md` #16).

### M3 — Cart & checkout — code complete, needs Zee's browser verification
**Goal:** customer can build a cart and reach a checkout screen with shipping address entry.
**Depends on:** M2
**Definition of Done:**
  - [x] Feature works end-to-end — backend fully verified via curl; frontend pages verified serving correctly (no crashes, correct loading states) but **real interactive browser testing still needed** (add-to-cart, login-gate redirect, address form) — same gap as M1/M2
  - [ ] Automated tests — none yet for Cart/Address (same integration-test-DB gap as M1/M2)
  - [x] Error + loading + empty states (empty cart, unavailable/out-of-stock items shown not hidden, form validation, loading states)
  - [x] No new lint/type errors
  - [x] Docs updated (this entry, ADR-011)
  - [ ] Verified by Zee
**Estimated effort:** M
**Decisions:** cart persists server-side for guests too (cookie-tracked, merges into account on login); login required only at checkout, not before adding to cart; cart items always reflect live price/stock; unavailable items stay visible in the cart (marked, not silently removed) — see ADR-011.
**Risk:** cart state design (server-side vs. client-only) affects everything downstream — decide deliberately, not by default.

### M4 — Payments (Razorpay) — ✅ DONE, verified with a real Razorpay-initiated payment + webhook
**Goal:** customer can pay for an order; payment is verified server-side via webhook, never trusted from the frontend.
**Depends on:** M3, Razorpay individual-KYC account created (`docs/human-actions.md`) — **revised**: only test-mode keys were actually needed to build this, not full KYC (see `docs/human-actions.md` #17/#18)
**Definition of Done:**
  - [x] Feature works end-to-end — **fully verified with a real browser payment**: Zee completed a real test-mode checkout (domestic Visa test card `4100 2800 0000 1007`) through the actual Razorpay widget; Razorpay's own servers sent a genuine webhook through an `ngrok` tunnel to the real backend, which verified the real signature and correctly marked the order `Paid`, decremented stock, and cleared the cart. Confirmed directly in the backend log, not inferred.
  - [ ] Automated tests — none yet, same integration-test-DB gap as M1-M3
  - [x] Error + loading + empty states (payment dismissed/failed, polling timeout, cart/address validation) — also incidentally verified for real: an earlier attempt with the wrong (international-flagged) test card produced a genuine `payment.failed` webhook, correctly handled
  - [x] No new lint/type errors
  - [x] Docs updated (this entry, ADR-012, ADR-013)
  - [x] Verified by Zee
**Estimated effort:** L
**Risk:** the highest-stakes milestone in the whole project — money correctness, idempotency, and the order state machine all live here. **Two real bugs were caught and fixed before ever touching a real Razorpay account** — see ADR-012 in docs/decisions.md (a config bug that would have broken order creation entirely, and a webhook event-ID bug, verified against Razorpay's actual documentation, that would have made every real webhook delivery fail silently in production).

### M5 — Custom order requests + quoting
**Goal:** customer submits a custom request; admin reviews and sends a quote; customer accepts and pays.
**Depends on:** M4 (reuses payment flow for the quoted amount)
**Estimated effort:** M
**Risk:** needs its own state machine (`requested → quoted → accepted/declined → paid`), distinct from the catalog order state machine but converging with it after payment.

### M6 — Admin panel & order management
**Goal:** admin can see and manage all orders, update fulfillment status, view a basic dashboard.
**Depends on:** M4, M5
**Estimated effort:** M
**Risk:** every admin action needs a real server-side authorization check — never a hidden button.

### M7 — Emails / notifications
**Goal:** order confirmation, custom-order quote-ready, and shipping-update emails send reliably and don't land in spam.
**Depends on:** M4, M5
**Estimated effort:** S
**Risk:** deliverability (SPF/DKIM/DMARC) is easy to get wrong silently — verify with a mail tester, not by eyeballing it.

### M8 — Legal pages, SEO, accessibility pass
**Goal:** Privacy Policy, Terms, Refund/Shipping policy live; product pages indexable; WCAG 2.1 AA baseline met.
**Depends on:** M2 (product pages), M4 (refund policy needs real payment flow to describe accurately)
**Estimated effort:** M
**Risk:** Razorpay requires these pages live *before* activating a real account — this can quietly block launch if left too late.

### M9 — Deploy to staging
**Goal:** full app running on a real staging URL with test-mode payment keys.
**Depends on:** M0-M8
**Estimated effort:** M
**Risk:** first real test of the deploy pipeline — expect to find gaps here, that's the point of staging.

### M10 — Production launch
**Goal:** live store, real domain, real HTTPS, real (test then live) Razorpay transaction completed and refunded, monitoring/alerts confirmed reaching Zee.
**Depends on:** M9, all `docs/human-actions.md` items for launch marked done
**Estimated effort:** M
**Risk:** see `MASTER-PROMPT.md` §36 go-live checklist — no shortcuts here.

---

Do not start M2 while M1 is unstable, etc. — build in order, keep each milestone shippable before moving on.
