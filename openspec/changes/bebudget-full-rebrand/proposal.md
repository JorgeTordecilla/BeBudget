## Why

The product identity is currently split between technical and user-facing surfaces under the `BudgetBuddy` name. We want a cohesive rebrand to `BeBudget` across UI, documentation, and platform contracts without introducing avoidable production breakage.

## What Changes

This change introduces a phased rebrand strategy:

- Phase 1 (non-breaking, immediate):
  - Rename visible product branding in frontend UX (headers, auth screens, install prompts, PWA metadata, and textual labels) from `BudgetBuddy` to `BeBudget`.
  - Update contributor/operator documentation to reflect the new product name while preserving existing technical contract identifiers where needed.
- Phase 2 (breaking-contract migration, controlled rollout):
  - Migrate API vendor media type and canonical ProblemDetails base URIs away from `budgetbuddy` identifiers.
  - Migrate runtime env namespace from `BUDGETBUDDY_*` to `BEBUDGET_*` with temporary compatibility behavior.
  - Rename SDK public client naming/package identity to `BeBudget` while preserving transitional aliases.

## Capabilities

### Modified Capabilities
- `frontend-routing-ui-foundation`: user-facing app branding text and shell labels reflect `BeBudget`.
- `frontend-pwa-offline-readonly`: install prompt and PWA manifest/app-title metadata reflect `BeBudget`.
- `runtime-configuration`: runtime env contract supports/targets `BEBUDGET_*` naming with defined compatibility behavior.
- `api-http-contract`: vendor media type and ProblemDetails canonical namespace migration policy is defined.
- `sdk-generation`: generated SDK naming aligns with `BeBudget` with compatibility strategy for adopters.

## Impact

- Affected code (high-level):
  - Frontend app shell, auth routes, install prompt, PWA manifest metadata, tests.
  - Backend constants, error type catalog, OpenAPI source, tests.
  - SDK generators and generated SDK outputs.
  - Root/backend/frontend documentation and OpenSpec text where product naming appears.
- Risk profile:
  - Phase 1: low risk (copy/branding updates).
  - Phase 2: high risk (contract identifiers + env key migration) and must be rollout-controlled.
- Deployment:
  - Requires explicit migration guidance and compatibility window for API clients/operators.

