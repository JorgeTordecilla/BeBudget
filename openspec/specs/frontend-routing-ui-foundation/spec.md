# frontend-routing-ui-foundation Specification

## Purpose
TBD - created by archiving change hu-fe-01-frontend-skeleton-routing-ui-system. Update Purpose after archive.
## Requirements
### Requirement: Product branding is consistent across authenticated and public UI
Frontend user-facing branding text SHALL consistently present the product as `BeBudget` across shell and authentication surfaces.

#### Scenario: Shell branding renders BeBudget
- **WHEN** an authenticated user views the app shell header/navigation branding
- **THEN** the visible product label SHALL be `BeBudget`
- **AND** legacy `BudgetBuddy` branding text SHALL NOT appear in those shell surfaces.

#### Scenario: Authentication screens render BeBudget identity
- **WHEN** a user visits `/login` or `/register`
- **THEN** headings and supporting copy that mention the product name SHALL use `BeBudget`.

### Requirement: Frontend workspace bootstrap is standardized
The system MUST provide a frontend project scaffold in `frontend/` using Vite + React + TypeScript with strict-mode-compatible defaults, and the runtime entrypoint MUST fail fast with a clear bootstrap error when the required `#root` mount element is missing.

#### Scenario: Frontend workspace is available in monorepo
- **WHEN** developers inspect the monorepo after applying this change
- **THEN** `frontend/` SHALL contain a runnable Vite React TypeScript project skeleton

#### Scenario: Missing root mount element aborts bootstrap clearly
- **WHEN** the frontend entrypoint initializes and `document.getElementById("root")` returns `null`
- **THEN** the application SHALL stop before calling `ReactDOM.createRoot`
- **AND** it SHALL raise a clear bootstrap error identifying the missing `#root` mount element

### Requirement: Public and private routes are explicitly separated
Frontend routing MUST define public and private route boundaries with deterministic redirect behavior.

#### Scenario: Public login route is reachable
- **WHEN** a user navigates to `/login`
- **THEN** the application SHALL render the login screen

#### Scenario: Root route redirects to dashboard path
- **WHEN** a user navigates to `/`
- **THEN** the router SHALL redirect to `/app/dashboard`

#### Scenario: Private route tree is guarded
- **WHEN** a user navigates to `/app` or `/app/dashboard`
- **THEN** the route SHALL be resolved through `RequireAuth`

#### Scenario: Public register route is reachable
- **WHEN** a user navigates to `/register`
- **THEN** the application SHALL render the registration screen

#### Scenario: Login and register screens provide reciprocal navigation
- **WHEN** a user is on `/login`
- **THEN** the UI SHALL expose navigation to `/register`
- **AND** `/register` SHALL expose navigation back to `/login`

### Requirement: Temporary auth guard blocks private routes
Until HU-FE-02 is implemented, the auth guard MUST always treat users as unauthenticated.

#### Scenario: Guard always redirects to login in FE-01 baseline
- **WHEN** `RequireAuth` evaluates a private route in HU-FE-01
- **THEN** it SHALL use `authed = false`
- **AND** it SHALL redirect to `/login`

#### Scenario: Guard uses session-aware bootstrap in FE-02
- **WHEN** HU-FE-02 is implemented
- **THEN** `RequireAuth` SHALL evaluate auth from in-memory session state
- **AND** it SHALL attempt refresh bootstrap before redirecting unauthenticated users
- **AND** it SHALL allow private routes when refresh/bootstrap succeeds

### Requirement: UI system baseline is verified in login route
The frontend MUST initialize Tailwind and shadcn/ui and render baseline components on `/login`, and authenticated route surfaces MUST compose page actions and data views from shared shadcn primitives.

#### Scenario: Login page uses shadcn primitives
- **WHEN** a user opens `/login`
- **THEN** the page SHALL render `Card` and `Button` components generated in the configured shadcn UI path

#### Scenario: Authenticated route actions use shared shadcn controls
- **WHEN** a user navigates to authenticated routes such as Dashboard, Transactions, Budgets, or Analytics
- **THEN** page-level actions and form controls SHALL be composed from shared shadcn-based primitives
- **AND** route behavior and navigation outcomes SHALL remain unchanged.

### Requirement: API base URL comes from environment configuration
Frontend code MUST source backend base URL from Vite environment variables through a dedicated config module.

#### Scenario: Environment value is present
- **WHEN** developers inspect frontend environment defaults
- **THEN** `.env` SHALL include `VITE_API_BASE_URL=http://localhost:8000/api`

#### Scenario: Components avoid hardcoded API URL
- **WHEN** frontend modules need backend base URL
- **THEN** they SHALL consume `API_BASE_URL` from `src/config.ts`
- **AND** they SHALL NOT hardcode backend URLs in route components

### Requirement: Mobile-first primary navigation
The frontend SHALL provide persistent, thumb-friendly primary navigation for authenticated routes on small viewports while preserving an equivalent desktop navigation model on larger viewports. Authenticated app shell route links SHALL be defined from one canonical route list, and any mobile primary versus overflow navigation groupings SHALL be derived from that source instead of being maintained as separate duplicated route arrays.

#### Scenario: Primary route switching on mobile
- **WHEN** an authenticated user is on a viewport below the desktop breakpoint
- **THEN** the UI shows persistent primary navigation that allows direct access to Dashboard, Analytics, Accounts, Categories, Budgets, and Transactions without relying on wrapped header links

#### Scenario: Mobile navigation groupings derive from the canonical route list
- **WHEN** developers add, remove, or rename an authenticated app route in the shell navigation definition
- **THEN** desktop navigation SHALL reflect that route from the canonical route list
- **AND** mobile primary and overflow navigation collections SHALL be derived from the same canonical route definition rather than maintained as separate duplicated arrays

#### Scenario: Mobile bottom navigation remains viewport-bounded across browsers
- **WHEN** an authenticated user navigates on iOS Safari/Chrome/Brave or Android Chrome/Brave
- **THEN** the fixed bottom navigation container SHALL remain fully inside the visual viewport width
- **AND** no horizontal page overflow SHALL be introduced by the navigation shell.

### Requirement: Responsive app shell hierarchy
The app shell SHALL present a consistent visual hierarchy for title, contextual actions, and navigation across mobile, tablet, and desktop breakpoints, including keyboard-driven viewport transitions on mobile.

#### Scenario: Shell layout at breakpoint transitions
- **WHEN** the viewport changes between mobile, tablet, and desktop widths
- **THEN** shell content reflows without overlap, clipped controls, or hidden primary actions

#### Scenario: Mobile auth layout remains stable around virtual keyboard transitions
- **WHEN** a user on a mobile viewport opens and closes the virtual keyboard while interacting with `/login` or `/register`
- **THEN** the layout SHALL return to a stable viewport-aligned position
- **AND** the page SHALL NOT remain in an unintended zoomed visual state

#### Scenario: Fixed mobile navigation preserves page reachability
- **WHEN** fixed bottom navigation and floating transaction action controls are present on mobile routes
- **THEN** app shell spacing SHALL account for safe-area insets and fixed control stack height
- **AND** bottom page content and interactive controls SHALL remain reachable without being obscured.

#### Scenario: Mobile shell remains stable during browser toolbar and keyboard transitions
- **WHEN** browser chrome or virtual keyboard changes visual viewport dimensions on mobile
- **THEN** fixed shell controls (bottom nav and floating actions) SHALL preserve reachable placement
- **AND** layout SHALL remain bounded without clipped or off-screen controls.
