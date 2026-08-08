# Requirements

**Status:** MVP scope agreed 2026-08-08. Store name not yet chosen — see open items.

## What the application is

An online store for a solo 3D-printing hobby business. The owner ("Zee") recently bought a 3D printer and makes small miniatures to sell.

## Who uses it

| Role | Description |
|---|---|
| **Customer** | Browses the catalog, buys ready-made miniatures, or submits a custom order request. Creates an account to track orders. |
| **Admin (Zee)** | Manages products, fulfills orders, reviews and quotes custom order requests, views a basic dashboard. Single admin for MVP — no multi-admin roles needed yet. |

## Core workflows

1. **Catalog purchase**: customer browses products → adds to cart → checks out → pays via Razorpay → receives confirmation → tracks order status → receives shipping updates.
2. **Custom order**: customer fills a request form (description + optional reference image/file + contact info) → admin reviews in the admin panel → admin sends a quote (price) → customer accepts and pays the quoted price → order proceeds like a normal order from that point.
3. **Admin fulfillment**: admin updates order status as it moves through production/shipping; customer sees status update.

## Business model

- Commercial (sells physical goods for real money), run by one individual.
- Seller status: **individual**, no registered business / GST yet. Revisit GST once turnover approaches ₹20L (services) / ₹40L (goods) threshold.
- Monetisation: direct product sales + custom commission sales. No subscriptions, no marketplace/multi-vendor model.

## Market / scope

- **Geography**: India only, for now. No i18n/multi-currency needed — INR only, one locale (en-IN), one timezone convention (store all times UTC, display IST).
- **Scale expectations**: solo hobby-to-small-business scale at launch (assume low tens of orders/month initially). Architecture should not need a rewrite to reach ~1,000 orders/month, but we are not pre-optimizing for that today.
- **Browser/device support**: modern evergreen browsers (Chrome, Edge, Safari, Firefox, last 2 versions), mobile-first responsive (most customers will browse on phones).

## Data sensitivity

- Handles: customer name, email, phone, shipping address, order history — standard e-commerce PII.
- **No** health data, biometric data, or payment card data stored directly (card/UPI details are handled entirely by Razorpay; the app only ever sees a payment status + Razorpay's reference IDs).
- No specific handling for minors as a distinct user class assumed at this stage — flag if that changes (see [DPDP Act notes, docs/security.md - to be written in Phase security review]).

## Non-negotiables

| Item | Answer |
|---|---|
| Budget cap | Not fixed by owner — default to lean/near-free-tier hosting (~₹0-600/month at launch), reassess if it becomes a bottleneck. See `docs/costs.md`. |
| Timeline | No fixed launch date. Explicitly: **do not compromise scope/quality for speed.** |
| Skill level | Owner wants to be involved in all aspects and is using this project to learn — explain reasoning behind decisions, don't just execute silently. |
| Data sensitivity | Standard e-commerce PII only; no payments/health/biometric data stored directly. |
| Failure tolerance | Not mission-critical infrastructure (no 24/7 SLA needed) — solo business, brief downtime is tolerable, but payment/order data integrity is not negotiable. |

## Out of scope for MVP (Phase 2+)

- Reviews/ratings, wishlists, coupon codes
- In-browser 3D model preview/viewer for miniatures
- WhatsApp notifications, SMS (India DLT registration is slow — deferred)
- Multi-admin roles / staff accounts
- International customers / multi-currency

## Open items

- [ ] Store/brand name — not yet chosen.
- [ ] Domain name — depends on store name (see `docs/human-actions.md`).
- [ ] Exact custom-order form fields (what info to collect from customer) — to be finalized in the M5 design step.

## Related docs

- `docs/product-plan.md` — milestone roadmap
- `docs/architecture.md` — system design
- `docs/technology-stack.md` — stack choice and reasoning
- `docs/decisions.md` — ADR log for every non-trivial decision referenced above
