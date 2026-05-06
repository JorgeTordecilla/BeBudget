## Purpose

Define backend rollover preview/apply behavior, persistence guarantees, and canonical error semantics.

## Requirements

### Requirement: Rollover preview endpoint is deterministic and side-effect free
The backend MUST provide `GET /rollover/preview?month=YYYY-MM` as a read-only endpoint returning source-month surplus and application state.

#### Scenario: Preview returns positive surplus with unapplied state
- **WHEN** source month has `income_total_cents > expense_total_cents` and no `monthly_rollover` exists for that source month
- **THEN** API SHALL return `200` with `surplus_cents = income - expense`, `already_applied = false`, and `applied_transaction_id = null`.

#### Scenario: Preview clamps deficit to zero
- **WHEN** source month has `income_total_cents <= expense_total_cents`
- **THEN** API SHALL return `200` with `surplus_cents = 0` and `already_applied = false` unless an applied record exists.

#### Scenario: Preview returns applied state when rollover already exists
- **WHEN** `monthly_rollover` exists for the user and source month
- **THEN** API SHALL return `200` with `already_applied = true` and `applied_transaction_id` referencing the stored transaction.

#### Scenario: Preview rejects invalid month value
- **WHEN** preview receives an invalid `month` value
- **THEN** API SHALL return canonical `400` ProblemDetails with invalid-date-range semantics

### Requirement: Rollover apply endpoint materializes exactly one next-month income transaction
The backend MUST provide `POST /rollover/apply` that creates one income transaction on next-month day 1 using computed source-month surplus, while distinguishing ownership failures from archived-resource conflicts.

#### Scenario: Apply succeeds for positive surplus
- **WHEN** request provides valid `source_month`, user-owned `account_id`, and user-owned `income` `category_id`, and computed surplus is positive
- **THEN** API SHALL return `201` and create a transaction with `type=income`, `date=<source_month+1>-01`, `amount_cents=surplus`, and linked rollover income source.

#### Scenario: Apply rejects non-positive surplus
- **WHEN** computed source-month surplus is `0`
- **THEN** API SHALL return `422` as ProblemDetails with canonical type `rollover-no-surplus`.

#### Scenario: Apply is idempotent per source month
- **WHEN** apply is requested for a source month that was already applied by the same user
- **THEN** API SHALL return `409` as ProblemDetails with canonical type `rollover-already-applied` and SHALL NOT create a second transaction.

#### Scenario: Apply requires authentication
- **WHEN** apply is requested without valid authentication
- **THEN** API SHALL return `401` as ProblemDetails.

#### Scenario: Apply rejects invalid source month value
- **WHEN** apply receives an invalid `source_month` value
- **THEN** API SHALL return canonical `400` ProblemDetails with invalid-date-range semantics

#### Scenario: Apply rejects foreign account with forbidden response
- **WHEN** the authenticated user supplies an account that does not belong to them
- **THEN** the API SHALL return canonical `403 Forbidden`.

#### Scenario: Apply rejects foreign income category with forbidden response
- **WHEN** the authenticated user supplies an income category that does not belong to them
- **THEN** the API SHALL return canonical `403 Forbidden`.

#### Scenario: Apply rejects archived owned account with conflict response
- **WHEN** the authenticated user supplies an owned account that is archived
- **THEN** the API SHALL return canonical `409 Conflict`.

#### Scenario: Apply rejects archived owned income category with conflict response
- **WHEN** the authenticated user supplies an owned income category that is archived
- **THEN** the API SHALL return canonical `409 Conflict`.

### Requirement: Applied rollover persistence guarantees uniqueness and traceability
The backend MUST persist applied rollover operations in `monthly_rollover` with user-scoped uniqueness by source month.

#### Scenario: Unique key prevents duplicate apply under concurrency
- **WHEN** two apply operations race for the same `user_id` and `source_month`
- **THEN** persistence SHALL allow at most one committed row in `monthly_rollover` and API conflict mapping SHALL remain deterministic.

#### Scenario: Applied row stores transaction linkage
- **WHEN** apply succeeds
- **THEN** `monthly_rollover` SHALL store `user_id`, `source_month`, `transaction_id`, `amount_cents`, and creation timestamp for auditability.

### Requirement: Rollover source normalization is explicit for maintainers
Rollover source normalization helpers MUST make ORM mutation semantics explicit to callers.

#### Scenario: Source normalization documents caller commit responsibility
- **WHEN** maintainers read the rollover source normalization helper
- **THEN** the helper SHALL document that it mutates a session-bound object
- **AND** it SHALL document that the caller is responsible for committing those mutations.

### Requirement: Rollover apply only permits closed source months
The backend SHALL reject rollover apply requests for source months that are not closed.

#### Scenario: Apply succeeds for closed past month
- **WHEN** `POST /rollover/apply` is requested with `source_month` strictly earlier than current calendar month
- **THEN** API SHALL proceed with existing rollover apply behavior and return `201` on success.

#### Scenario: Apply rejects current month
- **WHEN** `POST /rollover/apply` is requested with `source_month` equal to current calendar month
- **THEN** API SHALL return canonical `422` validation/business-rule error
- **AND** SHALL NOT create `monthly_rollover` row nor rollover income transaction.

#### Scenario: Apply rejects future month
- **WHEN** `POST /rollover/apply` is requested with `source_month` later than current calendar month
- **THEN** API SHALL return canonical `422` validation/business-rule error
- **AND** SHALL NOT create `monthly_rollover` row nor rollover income transaction.
