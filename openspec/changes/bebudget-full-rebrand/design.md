## Context

The codebase currently encodes `BudgetBuddy` branding at multiple layers:

- UX copy and PWA metadata.
- Documentation and operational guides.
- API contract identity (`application/vnd.budgetbuddy.v1+json`, `https://api.budgetbuddy.dev/problems/...`).
- Runtime env namespace (`BUDGETBUDDY_*`).
- SDK class/package naming (`BudgetBuddyClient`, `budgetbuddy_sdk`).

These layers have different blast radii; a single-step replacement would create avoidable breakage.

## Goals / Non-Goals

**Goals**
- Establish `BeBudget` as the visible product name everywhere users and operators interact first.
- Define a safe migration path for contract-level identifiers to avoid abrupt client breakage.
- Keep rollout auditable through explicit tasks and compatibility checkpoints.

**Non-Goals**
- Renaming repository slug, deployment hostnames, or database filenames in this change unless explicitly scoped later.
- Forcing immediate removal of legacy identifiers without transition period.

## Decisions

1. Rebrand in two phases.
- Phase 1 updates user-facing and docs surfaces only (non-breaking).
- Phase 2 updates protocol/runtime/SDK identities with compatibility controls.

2. Contract migration must be dual-compatible for a bounded window.
- API should temporarily accept/emit both legacy and new identifiers where feasible.
- Removal of legacy identifiers happens only after explicit deprecation window.

3. Runtime env namespace migration is alias-first.
- Introduce `BEBUDGET_*` canonical keys.
- Support `BUDGETBUDDY_*` during migration with deterministic precedence and clear warnings.

4. SDK migration keeps temporary aliases.
- Publish/ship `BeBudgetClient` as canonical name.
- Keep backward-compatible alias exports for existing integrations during migration window.

## Architecture Sketch

```text
Phase 1 (non-breaking)
┌───────────────┐     ┌─────────────────┐
│ Frontend UX   │ --> │ BeBudget labels │
└───────────────┘     └─────────────────┘
┌───────────────┐     ┌─────────────────┐
│ Docs/OpenSpec │ --> │ BeBudget naming │
└───────────────┘     └─────────────────┘
          (API/runtime identifiers unchanged)

Phase 2 (controlled migration)
┌───────────────┐     ┌────────────────────────┐
│ API Contract  │ --> │ New IDs + compat layer │
└───────────────┘     └────────────────────────┘
┌───────────────┐     ┌────────────────────────┐
│ Runtime ENV   │ --> │ BEBUDGET_* canonical   │
└───────────────┘     │ + legacy alias window  │
                      └────────────────────────┘
┌───────────────┐     ┌────────────────────────┐
│ SDK           │ --> │ BeBudget naming + alias│
└───────────────┘     └────────────────────────┘
```

## Risks / Trade-offs

- [Risk] Hidden contract identifiers in tests/generators/docs are missed.
  - Mitigation: repo-wide search gates and checklist-based acceptance criteria.
- [Risk] Client breakage from media type/problem URI rename.
  - Mitigation: compatibility window + explicit release notes and migration timeline.
- [Risk] Env-key confusion during migration.
  - Mitigation: deterministic precedence (`BEBUDGET_*` first), startup warning on legacy use, and documented cutover date.

## Migration Plan

1. Land Phase 1 rebrand surfaces and docs.
2. Announce contract/runtime migration window and target removal date.
3. Implement Phase 2 dual-compat behavior and validate integration coverage.
4. Remove legacy identifiers after the compatibility window closes.

## Open Questions

- What is the canonical production domain for new ProblemDetails URIs (`api.bebudget.dev` vs another domain)?
- How long should legacy API/media-type compatibility remain active (e.g., 30/60/90 days)?
- Should package/module paths (`budgetbuddy_sdk`) be renamed immediately or deferred behind import aliases?

