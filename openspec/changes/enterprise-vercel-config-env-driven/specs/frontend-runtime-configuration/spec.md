## MODIFIED Requirements

### Requirement: Frontend runtime configuration must be environment-driven
The frontend deployment runtime SHALL keep API routing same-origin and enforce least-privilege CSP/headers in Vercel delivery.

#### Scenario: Vercel backend rewrite destination is supplied by environment
- **WHEN** frontend deploy runs in Vercel
- **THEN** backend origin SHALL be provided through `API_ORIGIN` environment configuration
- **AND** API rewrites SHALL compose backend destination from this value without hardcoding hostnames in repository config.

#### Scenario: Frontend API base remains same-origin
- **WHEN** frontend runtime initializes API calls
- **THEN** `VITE_API_BASE_URL` SHALL remain `/api`
- **AND** components SHALL not hardcode backend host URLs.

#### Scenario: Vite development proxy target is environment-resolved
- **WHEN** frontend runs in Vite development mode with local `/api` proxy enabled
- **THEN** proxy target SHALL resolve from `VITE_DEV_API_TARGET` when provided
- **AND** SHALL fallback to `http://localhost:8000` when the variable is absent.

#### Scenario: Missing Vercel API origin fails deployment configuration
- **WHEN** production deployment configuration is evaluated without `API_ORIGIN`
- **THEN** deployment setup SHALL fail fast with explicit operator-facing error
- **AND** production release SHALL not proceed with ambiguous API routing.

#### Scenario: Same-origin API proxy remains CSP-compatible
- **WHEN** frontend issues API calls to `/api/*`
- **THEN** requests SHALL remain allowed under `connect-src 'self'`
- **AND** rewrite behavior SHALL continue unchanged from browser perspective.
