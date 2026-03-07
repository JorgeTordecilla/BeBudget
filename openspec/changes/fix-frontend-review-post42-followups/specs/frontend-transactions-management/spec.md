## MODIFIED Requirements

### Requirement: Transaction create and update flows must follow contract
The frontend SHALL support creating and updating transactions with deterministic payload and response handling.

#### Scenario: Parsed amount validation uses explicit null semantics
- **WHEN** create/edit payload builders parse `formState.amount`
- **THEN** validation SHALL treat parse failure as `amount === null`
- **AND** frontend SHALL NOT use broad falsy checks for parsed cents values.

### Requirement: Authenticated transactions route and list must be available
The frontend SHALL expose a protected transactions experience under the private app shell, including import and export entry points, and SHALL keep transaction filters synchronized with URL state.

#### Scenario: Modal-open callbacks remain dependency-stable
- **WHEN** effects and memos reference modal open/edit/restore callbacks
- **THEN** callback identity and dependency arrays SHALL remain lint-complete and stale-closure-safe
- **AND** navigation/query-param side effects SHALL remain deterministic.

#### Scenario: Quick-transaction options reuse normalized cache keys
- **WHEN** quick-transaction option lists are requested from transactions-related surfaces
- **THEN** queries SHALL use shared `optionQueryKeys` families for accounts/categories/income-sources
- **AND** repeated modal opens SHALL be able to reuse warm cache state.

