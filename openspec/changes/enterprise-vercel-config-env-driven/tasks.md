## 1. OpenSpec and Config Migration

- [x] 1.1 Replace hardcoded backend rewrite destination with environment-driven Vercel configuration (`API_ORIGIN`) while preserving `/api` rewrite priority.
- [x] 1.2 Add deploy-time guardrail for missing or malformed `API_ORIGIN` in production configuration.
- [x] 1.3 Ensure SPA fallback rewrite remains last and does not capture `/api/*` traffic.

## 2. Documentation and Ops Readiness

- [x] 2.1 Update `frontend/README.md` to document Vercel environment variables and enterprise environment separation (Preview/Production).
- [x] 2.2 Update `frontend/docs/release-checklist.md` to replace Netlify-specific proxy variable checks with Vercel `API_ORIGIN` checks.

## 3. Verification

- [x] 3.1 Run frontend quality gates: `npm.cmd run test`, `npm.cmd run test:coverage`, `npm.cmd run build`.
- [ ] 3.2 Validate routing behavior in deploy preview: `/api/*` reaches backend and `/app/*` refresh serves SPA.
- [ ] 3.3 Confirm auth smoke flow (login, session refresh, logout) works with Vercel rewrite-based routing.
