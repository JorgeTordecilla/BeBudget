## MODIFIED Requirements

### Requirement: Budget filter and range control consistency
Budget range controls SHALL maintain clear input grouping and apply behavior across all viewport sizes.

#### Scenario: Applying budget month range responsively
- **WHEN** a user changes from/to month values and applies filters on any supported viewport
- **THEN** the page updates results and retains understandable filter context without layout breakage
- **AND** native `input[type="month"]` controls SHALL remain within container bounds on iOS Safari/Chrome/Brave and Android Chrome/Brave.
