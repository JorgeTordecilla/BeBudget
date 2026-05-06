## Purpose
Define backend requirements for user-scoped income-source CRUD behavior and deterministic income-source invariants.

## Requirements
### Requirement: Income sources CRUD is user-scoped and archive-aware
The backend MUST implement `/income-sources` and `/income-sources/{income_source_id}` with create, list, get, patch, and archive behavior scoped to the authenticated user.

#### Scenario: Create income source
- **WHEN** an authenticated user posts valid source payload
- **THEN** the API SHALL return `201` with `IncomeSourceOut`

#### Scenario: List income sources
- **WHEN** an authenticated user calls `GET /income-sources`
- **THEN** the API SHALL return `200` with `IncomeSourceListOut` containing only that user's sources

#### Scenario: Get owned income source
- **WHEN** an authenticated user calls `GET /income-sources/{income_source_id}` for an owned source
- **THEN** the API SHALL return `200` with `IncomeSourceOut`

#### Scenario: Patch income source
- **WHEN** an authenticated user calls `PATCH /income-sources/{income_source_id}` with valid updates
- **THEN** the API SHALL return `200` with updated `IncomeSourceOut`

#### Scenario: Archive income source
- **WHEN** an authenticated user calls `DELETE /income-sources/{income_source_id}`
- **THEN** the API SHALL soft-archive the resource and return `204` with no response body

#### Scenario: Ownership is enforced for item endpoints
- **WHEN** a user accesses a non-owned source on `GET`, `PATCH`, or `DELETE`
- **THEN** the API SHALL return canonical `403` ProblemDetails

### Requirement: Income source domain invariants are explicit
Income sources MUST preserve deterministic naming and money invariants.

#### Scenario: Duplicate source name conflicts per user
- **WHEN** a user creates or renames a source to a name that already exists in that user's active source set
- **THEN** the API SHALL return `409` as ProblemDetails

#### Scenario: Expected income uses integer cents
- **WHEN** source payload is validated
- **THEN** `expected_amount_cents` SHALL be validated as integer cents under existing money safety bounds

#### Scenario: Frequency enum supports monthly weekly biweekly
- **WHEN** a client submits source frequency
- **THEN** accepted value set SHALL be `monthly`, `weekly`, or `biweekly`

### Requirement: Biweekly expected amount must follow calendar quincena split
For `frequency=biweekly`, expected monthly amount SHALL represent a monthly total split across day 15 and month-end.

#### Scenario: Even-cent monthly expected splits equally
- **WHEN** biweekly source expected amount is an even cent total (example: 400000 cents)
- **THEN** first-half expected SHALL be 200000 cents and second-half expected SHALL be 200000 cents.

#### Scenario: Odd-cent monthly expected preserves total deterministically
- **WHEN** biweekly source expected amount is an odd cent total (example: 400001 cents)
- **THEN** first-half expected SHALL be `floor(total/2)` and second-half expected SHALL be `total-first_half`
- **AND** halves SHALL sum exactly to original monthly total.

### Requirement: Biweekly calendar policy must be month-length invariant
Biweekly expected modeling SHALL remain correct across February and 30/31-day months.

#### Scenario: February uses correct month-end day
- **WHEN** expected biweekly income is computed for February in leap and non-leap years
- **THEN** second-half occurrence SHALL align to February 29 (leap) or February 28 (non-leap).

#### Scenario: 30-day and 31-day months use correct month-end day
- **WHEN** expected biweekly income is computed for April and May
- **THEN** second-half occurrence SHALL align to day 30 for April and day 31 for May.
