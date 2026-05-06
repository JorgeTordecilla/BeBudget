## ADDED Requirements

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
