## MODIFIED Requirements

### Requirement: Netlify deploy must support SPA deep-link routing
Frontend deploy configuration SHALL provide deterministic API proxy and SPA fallback routing for production deployments.

#### Scenario: Vercel API rewrites take precedence over SPA fallback
- **WHEN** Vercel evaluates incoming frontend routes
- **THEN** rewrite rules for `/api` and `/api/:path*` SHALL be evaluated before catch-all SPA fallback
- **AND** requests matching `/api/*` SHALL NOT be rewritten to `/index.html`.

#### Scenario: SPA deep links continue to resolve via index fallback
- **WHEN** a user refreshes or opens a deep link under `/app/*`
- **THEN** Vercel SHALL rewrite the request to `/index.html`
- **AND** client-side routing SHALL render the requested application route.

### Requirement: Netlify response security headers must be baseline-hardened
Frontend hosting configuration SHALL enforce baseline browser security headers for production responses.

#### Scenario: Security headers remain active in Vercel hosting config
- **WHEN** frontend assets are served from Vercel
- **THEN** configured security headers SHALL include at minimum `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`
- **AND** headers SHALL be defined in version-controlled deploy configuration.

#### Scenario: CSP baseline remains active after routing migration
- **WHEN** Vercel deployment is promoted
- **THEN** a conservative `Content-Security-Policy` baseline SHALL remain active
- **AND** verification SHALL confirm login/navigation flows continue to work.
