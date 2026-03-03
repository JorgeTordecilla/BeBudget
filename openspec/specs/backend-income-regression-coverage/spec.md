## Purpose
Define backend regression-coverage requirements for income analytics and income-source linkage edge cases.

## Requirements
### Requirement: Income edge-case regression coverage is explicit
The backend test suite MUST include explicit integration coverage for income-source analytics and transaction source-linkage edge cases that are part of the contract behavior.

#### Scenario: Inactive source is excluded from expected income totals
- **WHEN** an income source exists with `is_active=false` in the requested analytics range
- **THEN** expected-income totals in analytics outputs SHALL exclude that source

#### Scenario: Income analytics baseline is deterministic without sources
- **WHEN** `/analytics/income` is requested for a valid date range and no active income sources exist
- **THEN** response items SHALL remain deterministic for each month in range with zero expected totals

#### Scenario: Income analytics enforces currency context
- **WHEN** `/analytics/income` is requested for an authenticated user whose currency context fails money validation
- **THEN** the API SHALL return canonical money-validation `400` ProblemDetails

#### Scenario: Cross-user source linkage is rejected on transaction write
- **WHEN** a transaction write references an `income_source_id` owned by another user
- **THEN** the API SHALL reject the write according to documented ownership conflict semantics
