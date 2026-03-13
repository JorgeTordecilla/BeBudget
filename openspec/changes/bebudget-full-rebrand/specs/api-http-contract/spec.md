## MODIFIED Requirements

### Requirement: Vendor media type for successful payloads
The API SHALL migrate vendor media-type identity from `budgetbuddy` to `bebudget` using a compatibility window that avoids abrupt client breakage.

#### Scenario: BeBudget media type is canonical for new integrations
- **WHEN** API contract documentation and generated artifacts are reviewed for new clients
- **THEN** the canonical success media type SHALL use `application/vnd.bebudget.v1+json`.

#### Scenario: Legacy media type remains temporarily accepted during migration
- **WHEN** existing clients send or negotiate `application/vnd.budgetbuddy.v1+json` within the migration window
- **THEN** the API SHALL continue to interoperate according to the documented compatibility policy.

### Requirement: ProblemDetails for error payloads
Canonical ProblemDetails type URIs SHALL migrate to the BeBudget namespace with explicit compatibility behavior for legacy identifiers.

#### Scenario: BeBudget problem namespace is canonical for new integrations
- **WHEN** contract documentation and OpenAPI examples are reviewed
- **THEN** canonical problem `type` URIs SHALL use the BeBudget namespace.

#### Scenario: Legacy problem namespaces are handled during migration window
- **WHEN** clients rely on legacy `budgetbuddy` problem identifiers during migration
- **THEN** server/client compatibility behavior SHALL follow documented migration policy without silent ambiguity.

