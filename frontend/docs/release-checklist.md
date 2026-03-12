# Frontend Release Checklist

## Environment

- [ ] `VITE_API_BASE_URL=/api` (same-origin frontend API path).
- [ ] `VITE_APP_ENV=production`.
- [ ] `API_ORIGIN=https://<render-service>` (origin only, no `/api` path).
- [ ] `VITE_RELEASE` is set to commit SHA or tag.
- [ ] Optional flags and telemetry DSN values are set intentionally.
- [ ] Vercel Preview and Production env scopes are configured intentionally.

## Vercel Deploy

- [ ] `vercel.ts` is present and includes framework/output, rewrites, and headers.
- [ ] API rewrites are present and ordered before SPA fallback:
      `/api` and `/api/:path*` -> `${API_ORIGIN}/api...`.
- [ ] SPA fallback rewrite is last (`/(.*) -> /index.html`).
- [ ] Security headers are active (`nosniff`, `Referrer-Policy`, `Permissions-Policy`, CSP baseline).

## Cross-Site Auth Compatibility

- [ ] Login from deployed frontend sets `bb_refresh` cookie.
- [ ] Refresh rotates cookie and keeps session active.
- [ ] Backend CORS allowlist contains exact Vercel origin.
- [ ] Backend sends `Access-Control-Allow-Credentials: true`.
- [ ] Render env `REFRESH_COOKIE_SAMESITE=lax`.
- [ ] Render env `REFRESH_COOKIE_DOMAIN` is empty/unset.
- [ ] Render env `AUTH_REFRESH_MISSING_ORIGIN_MODE=allow_trusted` remains unchanged.
- [ ] Refresh cookie attributes are `HttpOnly; Secure; SameSite=Lax`.
- [ ] Render service was restarted after cookie env changes.

## Quality Gates

- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run test:coverage`
- [ ] `npm run build`
- [ ] `npm run test:e2e`

## Observability

- [ ] Runtime/API failures include release and environment metadata.
- [ ] ProblemDetails telemetry includes allowlisted fields only (`type`, `title`, `status`, request id, method/path).
- [ ] No token, cookie, or credential payload is emitted.

## Rollback

- [ ] Previous Vercel production deploy is identified.
- [ ] Rollback owner and command path are documented in release notes.
