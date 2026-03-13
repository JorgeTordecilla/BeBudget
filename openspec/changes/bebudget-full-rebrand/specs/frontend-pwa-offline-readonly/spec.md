## MODIFIED Requirements

### Requirement: Frontend MUST be installable as a standards-compliant PWA
The frontend SHALL keep installability requirements while exposing `BeBudget` as the canonical app identity in metadata and install prompts.

#### Scenario: Manifest metadata uses BeBudget identity
- **WHEN** manifest content is validated
- **THEN** `name` and `short_name` SHALL use `BeBudget` branding
- **AND** installability metadata requirements SHALL remain satisfied.

#### Scenario: Install prompt copy uses BeBudget
- **WHEN** install prompt UI is shown to users
- **THEN** visible install copy and accessibility label naming SHALL use `BeBudget`.

