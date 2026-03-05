# frontend-pwa-offline-readonly Specification

## Purpose
TBD - created by syncing change frontend-pwa-installable-offline-readonly. Update Purpose after archive.

## Requirements
### Requirement: Frontend MUST be installable as a standards-compliant PWA
The frontend SHALL provide manifest metadata, icons, and service-worker registration needed for installability on supported Android and iOS browsers.

#### Scenario: Manifest is generated at default plugin path
- **WHEN** production build artifacts are inspected
- **THEN** the manifest SHALL be available at `/manifest.webmanifest`
- **AND** the project SHALL NOT require custom `manifestFilename` override.

#### Scenario: Manifest includes installability metadata
- **WHEN** manifest content is validated
- **THEN** it SHALL include `name`, `short_name`, `display: standalone`, `start_url`, icons (192 + 512 + maskable), and shortcuts.

#### Scenario: iOS metadata is present
- **WHEN** `index.html` is inspected
- **THEN** Apple standalone meta tags and `apple-touch-icon` link SHALL be present.

### Requirement: Service worker runtime caching MUST protect auth/session correctness
Runtime caching SHALL use ordered route rules that exclude auth/session-sensitive endpoints from cache and provide offline fallback only for non-sensitive GET APIs.

#### Scenario: Auth/session endpoints bypass cache
- **WHEN** GET requests target `/api/auth/*`, `/api/me`, `/api/token`, or `/api/refresh`
- **THEN** service worker strategy SHALL be `NetworkOnly`
- **AND** responses SHALL NOT be read from or written to runtime cache.

#### Scenario: Other API GET requests use network-first fallback
- **WHEN** GET requests target other `/api/*` routes
- **THEN** service worker strategy SHALL be `NetworkFirst` with `networkTimeoutSeconds = 5`
- **AND** cached response SHALL be used if network does not answer within timeout.

### Requirement: Offline read-only UX MUST be explicit and non-blocking
The app SHALL surface connectivity state and remain usable while rendering cached data.

#### Scenario: Offline banner toggles by browser connectivity events
- **WHEN** browser transitions to offline
- **THEN** app SHALL render an informational top banner indicating cached-data mode.
- **AND** the banner SHALL disappear automatically when browser returns online.

#### Scenario: Offline banner does not block navigation
- **WHEN** offline banner is visible
- **THEN** route navigation, scroll, and interactive controls SHALL remain usable.

### Requirement: Offline non-GET mutations MUST be blocked centrally
Non-GET API writes SHALL be rejected before fetch execution while offline using centralized API-client logic.

#### Scenario: Offline mutation fails deterministically before network call
- **WHEN** browser is offline and a request method is not `GET`
- **THEN** `src/api/client.ts` SHALL reject request with explicit offline mutation error type
- **AND** no transport request SHALL be sent.

#### Scenario: Offline mutation feedback is user-visible
- **WHEN** an offline mutation error is raised
- **THEN** UI SHALL show deterministic feedback equivalent to "No connection, try again when online"
- **AND** generic unknown-error messaging SHALL be avoided for this case.

### Requirement: App update activation MUST be user-controlled
Service-worker upgrades SHALL not interrupt active sessions without user confirmation.

#### Scenario: Update prompt appears when new worker is waiting
- **WHEN** a new service worker version is available
- **THEN** app SHALL show a non-blocking update prompt with explicit refresh action.

#### Scenario: Upgrade occurs only after explicit action
- **WHEN** user triggers update action
- **THEN** app SHALL activate waiting service worker and reload into new version.

### Requirement: App badge MUST reflect current calendar month bill workload
Badge count SHALL be computed from current system month, independent of bills screen navigation context.

#### Scenario: Badge uses current system month source
- **WHEN** app computes monthly bill badge count
- **THEN** query month SHALL be derived from `new Date()` (calendar current month)
- **AND** it SHALL NOT depend on UI-selected month filter state.

#### Scenario: Badge count equals pending plus overdue
- **WHEN** monthly status is available
- **THEN** app badge value SHALL equal `pending_count + overdue_count`
- **AND** badge SHALL clear when count is zero or when app shell mounts.

### Requirement: PWA integration MUST satisfy frontend quality gates
PWA integration SHALL compile and test cleanly with virtual module typings and jsdom mocks.

#### Scenario: TypeScript recognizes virtual PWA modules
- **WHEN** frontend build is executed
- **THEN** `virtual:pwa-register/react` imports SHALL compile without type errors
- **AND** `tsconfig.app.json` SHALL include `vite-plugin-pwa/client` types.

#### Scenario: Test harness supports SW and badge APIs
- **WHEN** frontend tests run in jsdom
- **THEN** service worker and app badge APIs SHALL be mocked in test setup
- **AND** existing and new test suites SHALL pass.
