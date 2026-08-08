# Technology Stack

## Stack decision

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 15 + TypeScript + Tailwind CSS** | Server-rendered product pages for SEO (people should be able to find your miniatures on Google); one language (TS) across the whole frontend; large ecosystem, easy to learn from. |
| Backend | **ASP.NET Core 8 Web API, C#** (target .NET 10 once installed — see below) | Explicit choice over a Next.js-full-stack alternative: you want to learn C#/.NET specifically. Trade-off accepted knowingly: two deployables, two hosting bills, CORS/auth plumbing between frontend and backend (see `docs/decisions.md#stack-choice`). |
| Database | **PostgreSQL** | Not SQL Server — better/cheaper managed free-tier options (Neon, Supabase, Railway), open source, works identically in Docker locally and in any managed host later. |
| ORM | **EF Core** | Standard for ASP.NET Core; migrations-first workflow (see `docs/database.md`, written at M2). |
| Auth | **ASP.NET Core Identity** + short-lived JWT access token + httpOnly-cookie refresh token | Free, self-hosted, no per-user vendor cost — appropriate for a lean-budget solo project. A managed provider (Auth0/Clerk) was considered and rejected: adds a monthly cost and a vendor dependency for a fairly standard auth need (see `docs/decisions.md`). |
| Payments | **Razorpay** | Supports individual-seller KYC (you don't have a registered business yet), widely used in India, solid webhook model. Cashfree is the fallback if KYC onboarding proves difficult. |
| File storage | TBD at M2 — leaning **Cloudflare R2** (S3-compatible, no egress fees) or a managed host's built-in object storage | Decided when we pick the hosting provider, since storage often bundles with it. |
| Email | TBD at M7 — leaning **Resend** (generous free tier, good deliverability docs) | Confirmed at that milestone. |
| Local dev database | **Docker Compose (Postgres container)**, not a native install | Your machine has 24GB RAM and working virtualization (WSL2) — Docker is comfortable here. Keeps the environment reproducible and matches how we'd run Postgres in most hosting options. Don't install PostgreSQL natively; don't install pgAdmin — use `docker exec -it <container> psql`, or install **DBeaver** if you want a GUI. |

## Your machine (assessed 2026-08-08)

```
CPU    : Intel i5-10300H (4C/8T, 10th gen mobile)
RAM    : 23.8 GB
OS     : Windows 11 Home Single Language
Disk C : 51.1 GB free of 411.4 GB   <- the constraint to watch
Disk D : 115.1 GB free of 540.8 GB
Virtualization : enabled
```

| Tool | Installed | Verdict |
|---|---|---|
| git | 2.48.1 | OK |
| node | v22.13.0 (LTS "Jod") | Works; upgrade to Node 24 LTS advisable, not urgent (Node 22 EOL April 2027) |
| npm | 10.9.2 | OK |
| dotnet SDK | 8.0.204 **and** 8.0.406 both installed | Need **.NET 10** — see action item below |
| docker | 27.5.1, WSL2 backend live | Working; update via Docker Desktop UI when convenient |
| psql | not installed | Correct — using Docker instead, don't install natively |
| gh (GitHub CLI) | not installed | Worth installing — see `docs/human-actions.md` |
| VS Code | 1.101.2 | OK, needs C# Dev Kit extension |

### Action needed: install .NET 10 SDK

You currently have .NET 8.0.204 and 8.0.406 — both on the .NET 8 line, which **reaches end of support 10 November 2026** (3 months from now). Starting a new project on it means an unnecessary framework upgrade before we even launch.

```powershell
winget install Microsoft.DotNet.SDK.10
# then, in a NEW terminal:
dotnet --list-sdks     # should now also show a 10.x entry
```

It installs side by side — nothing currently depending on .NET 8 breaks. Logged as a pending item in `docs/human-actions.md`.

### C: drive watch item (51GB free)

Docker images, the .NET SDK, and `node_modules` all default to `C:`. Docker in particular grows quietly over time.

- **Do not install Visual Studio Community** (8-20GB) — VS Code + the C# Dev Kit extension covers everything needed and is already installed.
- Repo stays on `D:` (it already is).
- If C: drops below ~25GB: move Docker's disk image to D: (Docker Desktop → Settings → Resources → Advanced → Disk image location) and run `docker system prune -a` periodically.

### Docker licensing note

Docker Personal is free for individuals and for small businesses under **both** 250 employees and $10M revenue — you're comfortably within that as a solo seller. Revisit only if this grows into an actual company.

## Dependency policy

- Every new dependency gets a one-line justification in `docs/decisions.md`.
- Prefer the platform/stdlib over a package; prefer one well-maintained package over three small ones.
- Before adding a package, check: last release date, open critical issues, weekly downloads, licence.
- Pin versions, commit lockfiles (`package-lock.json`, and NuGet's `packages.lock.json` once enabled).
- Dependabot enabled once the repo is on GitHub — updates proposed, never auto-merged.

## Superseded

The CLI session's `docs/prerequisites.md` (written earlier the same day) has been folded into this file and into `docs/human-actions.md`; that file is being removed to avoid two sources of truth. Nothing in it is lost — see `docs/decisions.md` for the log entry.
