## ADDED Requirements

### Requirement: Analytics rollover actions are limited to closed months
The analytics rollover section SHALL allow apply actions only for closed source months.

#### Scenario: Current month row does not allow apply
- **WHEN** rollover list includes current calendar month
- **THEN** UI SHALL hide or disable `Apply rollover` for that row
- **AND** SHALL show a non-action status indicating month is not closed.

#### Scenario: Past month row allows apply
- **WHEN** rollover list includes a past closed month with positive surplus and not already applied
- **THEN** UI SHALL present actionable apply control for that source month.

### Requirement: Rollover UI explicitly communicates source and target dates
The analytics rollover UI SHALL make source month and target transaction date explicit before confirmation.

#### Scenario: Row and modal show source month and target date
- **WHEN** user opens rollover apply flow
- **THEN** UI SHALL display `Source month: YYYY-MM`
- **AND** SHALL display `Target transaction date: YYYY-MM-01` (next month start for source month).

#### Scenario: CTA text indicates source-month action
- **WHEN** apply control is rendered
- **THEN** CTA wording SHALL make clear the action applies rollover from the selected source month.
