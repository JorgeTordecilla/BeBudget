## MODIFIED Requirements

### Requirement: Existing env-variable contract remains stable
Runtime settings SHALL migrate toward `BEBUDGET_*` canonical environment naming while preserving temporary compatibility for legacy `BUDGETBUDDY_*` keys during a defined migration window.

#### Scenario: Canonical namespace is BEBUDGET
- **WHEN** operators configure runtime settings for new deployments
- **THEN** documentation and runtime validation SHALL treat `BEBUDGET_*` keys as canonical.

#### Scenario: Legacy namespace remains temporarily compatible
- **WHEN** only legacy `BUDGETBUDDY_*` keys are present during migration
- **THEN** startup SHALL continue to load equivalent values
- **AND** runtime SHALL emit a clear deprecation warning indicating migration to `BEBUDGET_*`.

#### Scenario: Canonical keys take precedence when both are present
- **WHEN** both legacy and canonical keys are defined for the same setting
- **THEN** runtime SHALL prefer `BEBUDGET_*` values deterministically.

