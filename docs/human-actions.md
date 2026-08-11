# Human Actions

Things only Zee can do. Status: `pending` / `done` / `blocked`.

## Needed soon (blocks or unblocks upcoming milestones)

| # | Action | Why | Status |
|---|---|---|---|
| 1 | Install .NET 10 SDK | Current SDKs (8.0.204, 8.0.406) were on the .NET 8 line, EOL 10 Nov 2026. | done — 10.0.302 installed alongside the existing SDKs |
| 2 | ~~Start Docker Desktop~~ — no longer needed for local DB | Superseded by ADR-008: using existing native PostgreSQL 17 instead of a Docker container. Docker Desktop may still matter later (CI/deployment) but isn't a blocker now. | done (moot) |
| 3 | Create a GitHub account and enable 2FA | Repo hosting + CI/CD. | done — `shahidfarhan22` |
| 4 | Install GitHub CLI and authenticate (`gh auth login`) | Lets me create repos, PRs, and manage the project from the terminal. | done |
| 5 | Add C# Dev Kit extension to VS Code: `code --install-extension ms-dotnettools.csdevkit` | C# editing/debugging/IntelliSense in VS Code. | pending |
| 6 | (Optional, do while it's cheap) Upgrade Node 22 → Node 24 LTS: `winget install OpenJS.NodeJS.LTS` | Node 22 "Jod" is in maintenance, EOL April 2027. Not urgent, not a blocker. | pending |
| 7 | (Optional) Update Docker Desktop via its own UI (Settings → Software updates) | Current version (27.5.1) is ~18 months behind on patches. | pending |
| 8 | Set up a password manager (Bitwarden / 1Password) if you don't have one, before we generate the first real secret (DB password, JWT signing key, API keys) | Secrets need somewhere to live that isn't a text file. | pending |

## Needed soon-ish (not blocking, but unblocks real product photos)

| # | Action | Why | Status |
|---|---|---|---|
| 16 | Create an object storage account (Cloudflare R2 suggested — see docs/technology-stack.md) so product images can be uploaded through the app instead of pasted as URLs | M2's catalog currently uses a plain "image URL" field as an MVP simplification (ADR-010) — works for testing/demo, but real product photos need real hosting. Not urgent: you can paste URLs to any image host in the meantime. | pending |

## Needed before M4 (Payments)

| # | Action | Why | Status |
|---|---|---|---|
| 9 | Decide on store/brand name | Needed for domain, Razorpay account name, branding, legal pages. | pending |
| 10 | Start Razorpay individual-seller KYC (PAN, bank account/UPI for settlement) | Onboarding as an individual can take a few days — worth starting early so it's not the thing blocking launch. | pending |
| 17 | Sign up for Razorpay, generate **test-mode** API keys (Key ID + Key Secret), store via `dotnet user-secrets` | Needed to build/test M4 payment flow — no KYC required for test mode. | done — `Razorpay:KeyId`/`Razorpay:KeySecret` set, order creation verified end-to-end against the real Razorpay test API |
| 18 | Set up `ngrok` (or similar tunnel) to expose local backend, then configure a webhook in the Razorpay dashboard pointing at it; store the real webhook secret via `dotnet user-secrets set "Razorpay:WebhookSecret" "..."` | The webhook is how a real payment confirmation reaches us — currently only tested with a temporary, made-up local secret (see ADR-012), not a real Razorpay-issued one. | done — real `ngrok` tunnel + real webhook registered, verified with a genuine Razorpay-initiated `payment.captured` event (see ADR-013) |

## Needed before M7 (Emails)

| # | Action | Why | Status |
|---|---|---|---|
| 19 | Create a Resend account, add `send.alchemystudios.co.in` as a sending domain in the Resend dashboard, and add the MX/SPF/DKIM records it generates at the registrar under that subdomain | Resend generates the exact record values uniquely per domain — I can't pre-generate these, only tell you what to expect and where. Root domain's existing MX records stay untouched since this is scoped to a subdomain. | done — domain shows Verified in Resend |
| 20 | Add a DMARC record: TXT at `_dmarc.send.alchemystudios.co.in`, value `v=DMARC1; p=none; rua=mailto:alchemy3dstudios@gmail.com` | Independent of Resend's own records — completes the SPF/DKIM/DMARC trio this milestone explicitly flags as a deliverability risk if skipped. | done |
| 21 | Get a Resend API key and store it via `dotnet user-secrets set "Resend:ApiKey" "..."` and `dotnet user-secrets set "Resend:FromAddress" "Alchemy Studio <noreply@send.alchemystudios.co.in>"` | Needed for the backend to actually call Resend's API. Only works once the domain above shows Verified. | done — verified via real test sends landing in inbox, see ADR-018 |

## Needed before M8 (Legal/SEO) / M10 (Launch)

| # | Action | Why | Status |
|---|---|---|---|
| 11 | Review and approve the drafted legal pages (Privacy Policy, Terms, Refund/Shipping policy) — drafts, not legal advice. Live at `/privacy`, `/terms`, `/refund-policy` on branch `feat/m8-legal-seo-a11y` (PR not yet opened) | Razorpay requires these live before activating a real account. | ready for review |
| 12 | ~~Purchase domain~~ | `alchemystudios.co.in` purchased. | done |
| 13 | Create accounts for chosen hosting/DB/monitoring providers (decided at M9) — email is now handled at #19-21 above | I'll tell you exactly which ones and why before you sign up — not yet, to avoid abandoned trial accounts. | pending |
| 14 | Enter final DNS records at the registrar for the production deploy (I'll generate the exact records; you enter them) — separate from the email subdomain records at #19/#20, done already | Only you have registrar access. | pending |
| 15 | Complete Razorpay's live-mode requirements: Terms/Privacy/Refund pages live, business details | Required before any real (non-test) payment can be accepted. | pending |

## Things I will never do (per MASTER-PROMPT.md §0.1)

Creating accounts, entering payment/billing details, purchasing a domain, completing KYC, approving OAuth consent screens, anything requiring your 2FA/email/phone, final DNS entry at the registrar. I'll always produce exact copy-pasteable steps for these and wait.
