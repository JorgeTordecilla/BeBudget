## 1. Phase 1 - User-Facing Brand Surfaces (Non-Breaking)

- [x] 1.1 Replace visible frontend product labels from `BudgetBuddy` to `BeBudget` (AppShell, auth screens, install prompts, related UI copy).
- [x] 1.2 Update frontend PWA metadata (`name`, `short_name`, app title) and related tests to `BeBudget`.
- [x] 1.3 Update root/backend/frontend documentation references from `BudgetBuddy` to `BeBudget` where the text is brand-facing.
- [x] 1.4 Run frontend and docs quality checks and verify no visible legacy branding remains in primary user journeys.

## 2. Phase 2 - Contract and Runtime Identity Migration (Breaking-Controlled)

- [ ] 2.1 Define canonical new vendor media type and ProblemDetails URI namespace for `BeBudget`.
- [ ] 2.2 Implement temporary compatibility support for legacy and new contract identifiers during migration window.
- [ ] 2.3 Migrate runtime env namespace from `BUDGETBUDDY_*` to `BEBUDGET_*` with deterministic precedence and compatibility warning behavior.
- [ ] 2.4 Update OpenAPI, backend constants/errors, and tests to reflect migration policy.

## 3. SDK and Tooling Identity

- [ ] 3.1 Update SDK generator templates and outputs to canonical `BeBudget` naming.
- [ ] 3.2 Provide backward-compatible SDK aliases/import paths for the migration window.
- [ ] 3.3 Update SDK docs and regeneration instructions with migration notes.

## 4. Release and Verification

- [ ] 4.1 Publish migration notes (what changed, compatibility window, and removal timeline).
- [ ] 4.2 Run full frontend/backend test suites and coverage gates for the final implementation branch.
- [ ] 4.3 Run `openspec validate bebudget-full-rebrand --type change` and resolve all critical/warning findings before archive.
