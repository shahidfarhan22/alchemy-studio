# AGENTS.md — Permanent Project Rules

This file is the contract. If you (any AI session — Claude Code CLI, VS Code extension, or otherwise) are about to violate it, say so and ask first, rather than silently deviating.

**Start of every session:** read this file, `docs/progress.md`, and `docs/decisions.md` before doing anything. Summarize the current state back to the human in 5 lines. Never re-derive the plan from scratch.

**Multiple sessions:** more than one AI session may be pointed at this repo (CLI + IDE extension). Before writing new files or making architectural decisions, check `git status` / `git log` for uncommitted or unfamiliar changes from another session — don't silently overwrite them.

## Full project context

`MASTER-PROMPT.md` (repo root) is the complete process this project follows — phases, standards, and non-negotiables for security, testing, payments, deployment, etc. This file is the condensed day-to-day contract; `MASTER-PROMPT.md` is the full spec behind it.

## Commands

_To be filled in as each part of the stack is scaffolded (M0):_

| Action | Command |
|---|---|
| Run frontend (dev) | `cd frontend && npm run dev` (serves on http://localhost:3000) |
| Run backend (dev) | `cd backend/src/AlchemyStudio.Api && dotnet run --launch-profile http` (serves on http://localhost:5007) |
| Run full stack + DB | Postgres runs natively (always-on Windows service, not started per-session) — see `docs/decisions.md` ADR-008. Run frontend and backend dev commands above in separate terminals. |
| Run frontend tests | TBD — no test runner added yet |
| Run backend tests | `cd backend && dotnet test` (unit tests only so far — real-Postgres integration tests need Docker or a dedicated test DB, see docs/progress.md) |
| Lint frontend | `cd frontend && npm run lint` |
| Build frontend (includes typecheck) | `cd frontend && npm run build` — `next build` runs a full TypeScript check itself; don't run `tsc --noEmit` standalone on a fresh checkout, it needs `.next/types/` which only exists after a build has run at least once (found this breaking CI, see docs/progress.md) |
| Migrate DB | `dotnet ef migrations add <Name>` / `dotnet ef database update` (from `backend/src/AlchemyStudio.Api`) — migrations auto-apply on startup in Development only (see Program.cs); explicit step in staging/production. **If a migration recreates the `Products` table, hand-remove the generated `xmin` column definition** — see ADR-010 in docs/decisions.md, Postgres rejects it as a reserved system-column name. |
| Seed DB | Admin account auto-seeds on startup in Development from `Admin:Email`/`Admin:Password` user-secrets, if no account exists yet — see `Data/AdminSeeder.cs` |
| Build backend | `cd backend && dotnet build` |
| Set backend DB secret (local, one-time) | `dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=alchemy_studio;Username=alchemy_app;Password=YOUR_PASSWORD"` from `backend/src/AlchemyStudio.Api` |
| Set JWT/admin secrets (local, one-time) | `dotnet user-secrets set "Jwt:SigningKey" "..."`, `"Admin:Email" "..."`, `"Admin:Password" "..."` — same location as above |
| Set Razorpay secrets (local, one-time) | `dotnet user-secrets set "Razorpay:KeyId" "rzp_test_..."`, `"Razorpay:KeySecret" "..."` — required. `"Razorpay:WebhookSecret" "..."` — only needed once a webhook is configured in the Razorpay dashboard (see docs/human-actions.md #18); order creation works fine without it. |

## Core rules

- Follow existing architecture (`docs/architecture.md`); don't introduce a new pattern without recording why in `docs/decisions.md`.
- Do not introduce unnecessary dependencies (see dependency policy in `docs/technology-stack.md`).
- Prefer small changes; do not modify unrelated files.
- Never expose secrets. Never log passwords, tokens, API keys, card data, or PII.
- Do not bypass validation. Server-side validation is the security control; client-side is UX only.
- Do not disable a security control merely to make development easier or to fix an error faster.
- Write tests for important business logic — money, auth, and permissions first.
- Keep controllers thin; business logic lives in services.
- TypeScript: strict mode, no `any` without a comment explaining why.
- C#: `TreatWarningsAsErrors` on; no bypassing nullable-reference warnings without justification.
- Follow existing naming conventions.
- Explain significant architectural changes before making them.
- **No destructive database changes without explicit approval in chat.** No hand-modifying any database — migrations only.

## Definition of Done (every milestone)

- [ ] Feature works end-to-end via the UI
- [ ] Automated tests written and passing
- [ ] Error + loading + empty states handled
- [ ] No new lint/type errors
- [ ] Docs updated in the same commit as the code
- [ ] Verified by Zee — with exact steps to reproduce the verification

## Secrets

- Live in `.env` (local, gitignored) or the platform's secret store (GitHub Actions secrets / hosting provider env vars) once deployed. Never in a file that's committed, never pasted into chat.
- `.env.example` lists every variable name with a comment on what it is — no real values, ever.
- To add a new secret: add the name+comment to `.env.example`, tell Zee what value is needed and why, let Zee set the real value locally/in the platform.

## Error envelope contract

See `docs/api.md` (written at M1/M2). One consistent shape for every API error:
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "...", "details": [...], "correlationId": "..." } }
```
Never leak stack traces, SQL, internal paths, or provider errors to the client.

## Money & time rules

- Money: integer paise, never floating point. Currency code stored alongside every amount.
- Time: store UTC, convert at the edge (API response / frontend), never use local server time in business logic.

## Do not touch without asking

- Authentication / authorization logic
- Payment integration (Razorpay client, webhook handling, order state machine)
- Database migrations (structure, not just adding a row)
- CI/CD configuration
- Anything in `docs/decisions.md` marked as a settled ADR

## AI development rules (from MASTER-PROMPT.md §40)

1. Understand before changing. Inspect existing code before proposing modifications.
2. Do not rewrite working code unnecessarily. Make the smallest reasonable change.
3. Do not modify unrelated files. Do not add dependencies without justification.
4. Never expose secrets. No destructive database changes without approval.
5. Run appropriate tests after changes.
6. Every turn: tell Zee what changed, why, how to verify it, and any tradeoffs.
7. Clearly identify assumptions. If uncertain, ask rather than inventing critical requirements.
8. Never claim something works unless verified. Never claim something is secure because a basic test passed.
9. Prefer maintainability over cleverness; simple architecture until complexity is justified.
10. Preserve existing functionality when adding features.
11. **Push back** if asked for something that's a bad idea — say so once, clearly, then do it their way if they still want it.
12. **Say "I don't know"** rather than guessing at library APIs, provider behaviour, or pricing.
13. **Stop when blocked** — don't invent a workaround for a missing credential/decision/failing test. Report and wait.
14. **No placeholder code in committed work.** No `// TODO: implement`, no fake data paths presented as complete.
15. **Report failures immediately and in full**, in the same message they're discovered.
16. **Reread the file before editing it.** Never edit from memory of an earlier session.

## Turn format

```markdown
**Milestone:** M<n> — <name>
**Doing:** one sentence
**Files:** created / modified / deleted
**Decisions:** anything non-obvious, with reasoning
**Verified:** commands run + actual output
**Unverified:** what couldn't be checked, and how to check it
**Assumptions:** anything inferred
**Your turn:** what's needed from Zee before continuing
```
