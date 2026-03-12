## Context

The frontend moved from Netlify-style routing to Vercel rewrites. Current Vercel config correctly prioritizes `/api` before SPA fallback, but backend destination is hardcoded in repo. Enterprise operations need environment isolation so preview and production can target different backend origins without code edits.

Current constraints:
- Frontend runtime expects same-origin API path (`/api`) for refresh-cookie auth behavior.
- Catch-all SPA fallback must remain last to avoid serving `index.html` for API requests.
- Deploy configuration must be deterministic and auditable in source control.

## Goals / Non-Goals

**Goals:**
- Make backend rewrite destination environment-driven in Vercel.
- Preserve strict rewrite order: `/api` routes first, SPA fallback last.
- Fail fast during deployment when required environment variable is missing.
- Update operator docs/checklists to reflect Vercel-based deploy model.

**Non-Goals:**
- No backend API contract or OpenAPI changes.
- No auth/session protocol changes.
- No change to frontend business flows.

## Decisions

1. Use programmatic Vercel config (`vercel.ts`) with `process.env.API_ORIGIN`.
- Rationale: keeps config versioned while enabling per-environment origin without hardcoding.
- Alternative considered: keep static `vercel.json` with literal URL. Rejected due to environment coupling.

2. Keep rewrite precedence explicit.
- Decision: define `/api` and `/api/:path*` rewrites before `/(.*)` fallback.
- Rationale: prevents API traffic from being captured by SPA route handling.

3. Enforce deploy-time guardrail.
- Decision: throw configuration error when `API_ORIGIN` is absent in production deployments.
- Rationale: prevents silent broken deploys where API calls resolve to frontend HTML.

4. Normalize origin handling.
- Decision: treat `API_ORIGIN` as origin-only (without trailing `/api`) and compose destination as `${API_ORIGIN}/api`.
- Rationale: avoids duplicate `/api/api` and reduces operator mistakes.

## Risks / Trade-offs

- [Risk] Missing `API_ORIGIN` in preview/production can block deploy. -> Mitigation: documented required env and checklist updates.
- [Risk] Misconfigured origin (wrong host) routes all API traffic incorrectly. -> Mitigation: smoke tests for login + `/api/healthz` style request validation after deploy.
- [Trade-off] Programmatic config adds a small amount of code compared with static JSON. -> Benefit: enterprise-grade environment separation and safer operations.

## Migration Plan

1. Introduce `frontend/vercel.ts` with env-based rewrites and existing headers.
2. Remove backend hardcoded destination from `frontend/vercel.json` or deprecate JSON in favor of TS config.
3. Update docs/checklists to require `API_ORIGIN` for Vercel Preview/Production.
4. Configure `API_ORIGIN` in Vercel project settings.
5. Validate deep links and auth flows in preview before production promotion.

## Open Questions

- Should preview use a dedicated staging backend origin or shared production-readonly backend?
- Do we want a second optional `API_ORIGIN_PREVIEW` convention, or keep one variable per Vercel environment scope?
