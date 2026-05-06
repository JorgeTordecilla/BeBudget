## Purpose
Define behavior for user-level budget templates and month generation with safe overrides and concurrency guarantees.

## Requirements

### Requirement: Budget Template
The system SHALL allow one base budget template per user with per-category amounts in cents.

#### Scenario: User defines template
- WHEN a user saves the base template
- THEN the template is persisted and available for month generation.

### Requirement: Monthly Generation
The system SHALL generate a month budget from the active template for a target month.

#### Scenario: Generate month first time
- WHEN a user generates `YYYY-MM` with no existing month budget
- THEN the system creates month lines from the active template.

#### Scenario: Idempotent generation
- WHEN month generation is run for an already generated month
- THEN no duplicate lines are created.

#### Scenario: Non-destructive regeneration
- WHEN month lines already include manual overrides
- THEN regeneration only creates missing lines and does not overwrite overrides.

### Requirement: Month Overrides
The system SHALL allow editing month budget amounts without modifying the base template.

#### Scenario: Edit month value
- WHEN a user updates a category amount in `YYYY-MM`
- THEN the change applies only to that month.

### Requirement: Archived Categories
The system SHALL respect category archived state for future generation.

#### Scenario: Archived category in future generation
- WHEN a category is archived
- THEN it is excluded from newly generated months.

#### Scenario: Archived category in historical month
- WHEN an archived category already existed in a generated month
- THEN historical month data remains unchanged.

### Requirement: Concurrency Safety
The system SHALL guarantee uniqueness per user-month-category under concurrent generation requests.

#### Scenario: Concurrent generation
- WHEN two requests generate the same month concurrently
- THEN the final result contains only one line per category.

### Requirement: Generation Audit Metadata
The system SHALL store month generation metadata.

#### Scenario: Generation metadata recorded
- WHEN a month is generated
- THEN `generated_at` and `generated_from_template_version` are stored for that month.
