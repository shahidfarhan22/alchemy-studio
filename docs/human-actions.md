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

## Needed before M4 (Payments)

| # | Action | Why | Status |
|---|---|---|---|
| 9 | Decide on store/brand name | Needed for domain, Razorpay account name, branding, legal pages. | pending |
| 10 | Start Razorpay individual-seller KYC (PAN, bank account/UPI for settlement) | Onboarding as an individual can take a few days — worth starting early so it's not the thing blocking launch. | pending |

## Needed before M8 (Legal/SEO) / M10 (Launch)

| # | Action | Why | Status |
|---|---|---|---|
| 11 | Review and approve draft legal pages (Privacy Policy, Terms, Refund/Shipping policy) — I will draft them, clearly labelled as drafts, not legal advice | Razorpay requires these live before activating a real account. | pending |
| 12 | Purchase domain (once name is chosen) — on your own account, your own payment method | Never mine. Registrar lock + auto-renew should be enabled once bought. | pending |
| 13 | Create accounts for chosen hosting/DB/email/monitoring providers (decided at M9) | I'll tell you exactly which ones and why before you sign up — not yet, to avoid abandoned trial accounts. | pending |
| 14 | Enter final DNS records at the registrar (I'll generate the exact records; you enter them) | Only you have registrar access. | pending |
| 15 | Complete Razorpay's live-mode requirements: Terms/Privacy/Refund pages live, business details | Required before any real (non-test) payment can be accepted. | pending |

## Things I will never do (per MASTER-PROMPT.md §0.1)

Creating accounts, entering payment/billing details, purchasing a domain, completing KYC, approving OAuth consent screens, anything requiring your 2FA/email/phone, final DNS entry at the registrar. I'll always produce exact copy-pasteable steps for these and wait.
