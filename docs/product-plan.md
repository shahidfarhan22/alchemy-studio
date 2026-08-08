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

### M1 — Auth (register / login / roles)
**Goal:** customers and the admin can register, log in, and log out securely.
**Depends on:** M0
**Definition of Done:** feature works end-to-end via UI · tests passing · error/loading/empty states handled · no new lint/type errors · docs updated · verified by Zee
**Estimated effort:** M
**Risk:** getting refresh-token/cookie handling wrong is the easiest way to introduce a security bug — see AGENTS.md auth rules.

### M2 — Product catalog
**Goal:** admin can create/edit products with images and stock; customers can browse and view product detail pages.
**Depends on:** M1 (admin auth)
**Estimated effort:** M
**Risk:** image upload/storage decisions need to be right before this grows (see `docs/architecture.md`).

### M3 — Cart & checkout
**Goal:** customer can build a cart and reach a checkout screen with shipping address entry.
**Depends on:** M2
**Estimated effort:** M
**Risk:** cart state design (server-side vs. client-only) affects everything downstream — decide deliberately, not by default.

### M4 — Payments (Razorpay)
**Goal:** customer can pay for an order; payment is verified server-side via webhook, never trusted from the frontend.
**Depends on:** M3, Razorpay individual-KYC account created (`docs/human-actions.md`)
**Estimated effort:** L
**Risk:** the highest-stakes milestone in the whole project — money correctness, idempotency, and the order state machine all live here. See `docs/payments.md` (written during this milestone).

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
