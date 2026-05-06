## Purpose
Define backend analytics requirements for deterministic expected-vs-actual income comparison by month and income source.

## Requirements
### Requirement: Income analytics endpoint compares expected vs actual by month and source
The backend MUST implement `GET /analytics/income` returning deterministic integer-cent comparisons of planned and realized income by month and source for the authenticated user.

#### Scenario: Income analytics success
- **WHEN** a valid authenticated request includes valid `from` and `to` dates
- **THEN** the API SHALL return `200` with `IncomeAnalyticsOut`

#### Scenario: Source-level actual income uses explicit linkage
- **WHEN** source-level actual totals are computed
- **THEN** totals SHALL be derived from income transactions explicitly linked by `transactions.income_source_id`

#### Scenario: Source-level totals do not use heuristics
- **WHEN** analytics groups actual income by source
- **THEN** the system SHALL NOT infer attribution from merchant, note, or category name heuristics

#### Scenario: Analytics totals are integer cents only
- **WHEN** expected and actual values are aggregated
- **THEN** the system SHALL use integer cents and SHALL NOT apply floating-point rounding

#### Scenario: Archived records policy is deterministic
- **WHEN** analytics totals are produced
- **THEN** archived transactions SHALL be excluded and archived income sources SHALL follow documented inclusion policy consistently

#### Scenario: Inactive sources are excluded from expected income
- **WHEN** expected totals are computed for `/analytics/income`
- **THEN** only active, non-archived income sources SHALL contribute to `expected_income_cents`

#### Scenario: Income analytics baseline with no sources is deterministic
- **WHEN** `/analytics/income` is requested for a valid date range and the user has no active income sources
- **THEN** the response SHALL still return deterministic month rows for the requested range with `expected_income_cents=0`

#### Scenario: Income analytics validates user currency context
- **WHEN** `/analytics/income` is requested and the authenticated user currency context fails money validation rules
- **THEN** the API SHALL return canonical money-validation `400` ProblemDetails

### Requirement: Analytics expected income must apply recurrence-aware source policy
Expected income for analytics endpoints SHALL be derived from active income sources according to each source frequency.

#### Scenario: Monthly frequency contributes once per month
- **WHEN** active source has `frequency=monthly`
- **THEN** expected monthly contribution SHALL equal `expected_amount_cents` once per month.

#### Scenario: Weekly frequency scales by weekly occurrences in month
- **WHEN** active source has `frequency=weekly`
- **THEN** expected monthly contribution SHALL equal `expected_amount_cents` multiplied by deterministic weekly occurrence count for that month.

#### Scenario: Biweekly frequency uses quincena calendar split
- **WHEN** active source has `frequency=biweekly`
- **THEN** expected monthly contribution SHALL equal monthly total represented by two calendar occurrences (day 15 and month-end)
- **AND** per-half split SHALL follow deterministic cents conservation.

### Requirement: Recurrence-aware expected totals must stay aligned between analytics endpoints
The same recurrence logic SHALL drive expected totals in both by-month and income comparison analytics.

#### Scenario: By-month and income endpoints remain expected-total consistent
- **WHEN** `/analytics/by-month` and `/analytics/income` are requested for the same user and date range
- **THEN** each month expected income total SHALL match across both endpoints.

#### Scenario: Inactive and archived source exclusion still applies
- **WHEN** expected totals are computed with mixed active/inactive/archived sources
- **THEN** only active, non-archived sources SHALL contribute to expected totals regardless of frequency.
