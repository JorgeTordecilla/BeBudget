## Why

The Vercel routing currently uses a hardcoded backend origin in versioned config. This works, but it does not meet enterprise environment-separation practices for preview/staging/production and increases operational risk during backend endpoint changes.

## What Changes

- Replace hardcoded backend rewrite destination with environment-driven configuration for Vercel routing.
- Keep `/api` and `/api/:path*` rewrites ordered before SPA fallback to preserve auth/API behavior.
- Introduce deployment guardrail so production deploy fails fast when API origin is missing.
- Update release docs/checklists from Netlify-specific proxy variable to Vercel environment variable strategy.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `frontend-deploy-routing`: Production frontend routing behavior is updated for Vercel with deterministic `/api` priority and environment-driven backend destination.
- `frontend-runtime-configuration`: Runtime deployment configuration moves from Netlify proxy target to Vercel environment variable policy for backend origin.

## Impact

- **Affected files**: `frontend/vercel.json` (or `frontend/vercel.ts`), `frontend/README.md`, `frontend/docs/release-checklist.md`.
- **Routing impact**: `/api/*` remains same-origin from browser perspective and is rewritten server-side to backend origin.
- **Security impact**: No API/media-type contract changes; reduced risk of accidental cross-environment coupling.
- **Operational impact**: Requires setting `API_ORIGIN` per Vercel environment (Preview/Production).
