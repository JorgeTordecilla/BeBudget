## MODIFIED Requirements

### Requirement: SDK generation is deterministic and reproducible
Generated SDK public identity SHALL align with `BeBudget` naming while keeping deterministic generation behavior unchanged.

#### Scenario: Canonical SDK client naming uses BeBudget
- **WHEN** SDK outputs are generated from the canonical OpenAPI contract
- **THEN** public client naming in generated SDKs SHALL use `BeBudget` identity.

#### Scenario: Legacy SDK naming remains available during migration
- **WHEN** existing integrations still import legacy BudgetBuddy-named client surfaces during the migration window
- **THEN** SDK compatibility aliases SHALL remain available as documented.

