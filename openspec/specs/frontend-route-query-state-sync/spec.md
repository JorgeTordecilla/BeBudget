## Purpose

Define deterministic synchronization rules between URL query parameters and frontend view state for filter/range-driven pages.
## Requirements
### Requirement: URL query params and view state MUST remain synchronized
Frontend pages with filter or range controls SHALL keep URL search params and in-memory UI state synchronized after initial load and during navigation.

#### Scenario: State initializes from valid URL query
- **WHEN** user lands on a supported page with valid query params
- **THEN** frontend SHALL initialize local state from URL values
- **AND** first data fetch SHALL use those values.

#### Scenario: URL change after mount updates page state
- **WHEN** URL search params change via back-forward navigation or in-app links
- **THEN** frontend SHALL resynchronize local state to the new URL
- **AND** subsequent fetches SHALL use synchronized values.

#### Scenario: User apply action updates URL deterministically
- **WHEN** user applies filters or range controls
- **THEN** frontend SHALL update URL search params using normalized query encoding
- **AND** page reload or shareable link SHALL reproduce the same view.

### Requirement: Invalid query params MUST degrade safely
Frontend SHALL validate and normalize URL parameters before using them in requests.

#### Scenario: Invalid params fallback to safe defaults
- **WHEN** query params are invalid, unsupported, or incomplete
- **THEN** frontend SHALL fallback to known safe default state
- **AND** SHALL avoid issuing invalid API requests.

#### Scenario: Partial params preserve valid subset
- **WHEN** only a subset of query params is valid
- **THEN** frontend SHALL keep valid parameters
- **AND** SHALL fill missing or invalid parameters with deterministic defaults.

### Requirement: Date-only query state sync must be timezone-stable
Date conversion helpers used by query-state synchronization MUST preserve valid date-only ISO inputs as the same calendar date string.

#### Scenario: Local date conversion remains identity for valid date-only input
- **WHEN** a valid date-only string (for example `2026-04-30`) is converted for API query usage
- **THEN** the conversion helper SHALL output `2026-04-30`
- **AND** SHALL NOT roll over to adjacent day values due to timezone offset.

### Requirement: Date-only serialization must be identity-preserving
Helpers that serialize valid ISO date-only query values MUST return the same calendar date string without timezone-based adjustment.

#### Scenario: Helper preserves valid ISO day token
- **WHEN** a valid date-only string such as `2026-12-31` is serialized for API query params
- **THEN** the output MUST be `2026-12-31`
- **AND** MUST NOT be converted to adjacent-day values.

### Requirement: Invalid date strings must remain pass-through
Date serialization helpers MUST keep invalid inputs unchanged to avoid hidden coercion.

#### Scenario: Invalid input is not transformed
- **WHEN** an invalid date string is provided
- **THEN** the helper MUST return the original string unchanged
- **AND** caller validation paths MUST handle the invalid value explicitly.

