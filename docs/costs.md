# Costs (live table — update whenever a service is added)

All figures approximate, in ₹/month, as of 2026-08-08. Nothing here is a committed spend yet — no paid accounts exist.

| Item | Free tier | Cheap paid tier | At ~1,000 orders/month | Notes |
|---|---|---|---|---|
| Domain (.com or .in) | — | ~₹60-85/mo (₹700-1000/yr) | same | Not yet purchased — see `docs/human-actions.md` #12 |
| Frontend hosting | Likely ₹0 (Vercel/Netlify free tier) | — | ₹0-1,500 | Decided at M9 |
| Backend hosting | Varies | ₹0-600 (Railway/Render hobby tier) or ~₹1,100 (Azure App Service B1) | ₹1,500-3,000 | Decided at M9; India-region (Azure) costs more but cuts latency |
| Database (managed Postgres) | ₹0 (Neon/Supabase free tier) | — | ₹800-1,200 | Free tier fine at launch scale |
| Object storage | ₹0 (Cloudflare R2 free tier: 10GB) | — | ₹50-150 | Decided at M2 |
| Email | ₹0 (Resend free tier: ~100/day) | — | ₹300-600 | Decided at M7 |
| Payment gateway fees | n/a | ~2% + GST per transaction | scales with revenue | Not a fixed cost — affects unit economics, not infra budget |
| Monitoring/error tracking | ₹0 (Sentry/UptimeRobot free tier) | — | ₹0 | Free tier stated as sufficient at this scale, not a placeholder |
| CI/CD | ₹0 (GitHub Actions free minutes) | — | ₹0-a few hundred if minutes exceeded | |

## Estimated total

- **At launch:** roughly ₹0-700/month (mostly just the domain, everything else on free tiers).
- **At ~1,000 orders/month:** roughly ₹2,500-4,500/month if we've moved to India-region paid hosting by then; could stay near ₹0-1,000/month longer if free tiers hold up and latency from a non-India host remains acceptable.

## Watch for

- Free-tier expiry dates: to be filled in once accounts actually exist (most are 12-month or usage-capped, not time-limited, for the providers being considered).
- Unbounded usage-based pricing: object storage egress, function invocations, log ingestion — flagged per-service once chosen.
- **Hard billing alerts/spend caps must be set on every account at signup time**, not later — tracked as a human action per account in `docs/human-actions.md` when each is created.
