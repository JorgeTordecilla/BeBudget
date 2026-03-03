## ADDED Requirements

### Requirement: Native date and month controls SHALL remain bounded on mobile viewports
The frontend SHALL render native `input[type="date"]` and `input[type="month"]` controls with shared styling that prevents horizontal overflow on supported mobile browsers.

#### Scenario: Date controls remain bounded in narrow viewport containers
- **WHEN** a date input is rendered inside a page section or modal on a narrow viewport
- **THEN** the control SHALL fit within available container width
- **AND** the page or modal SHALL NOT require horizontal scrolling to edit the date.

#### Scenario: Month controls remain bounded in narrow viewport containers
- **WHEN** a month input is rendered inside a page section or modal on a narrow viewport
- **THEN** the control SHALL fit within available container width
- **AND** the page or modal SHALL NOT require horizontal scrolling to edit the month.

#### Scenario: Browser matrix coverage is explicit
- **WHEN** BudgetBuddy date/month controls are exercised in iOS Safari/Chrome/Brave and Android Chrome/Brave
- **THEN** intrinsic date/month control width behavior SHALL remain visually bounded
- **AND** responsive layout integrity SHALL remain consistent across those browsers.

### Requirement: Shared date field styling SHALL be reusable across pages and modals
The frontend SHALL use one shared date/month field styling contract so all date selectors inherit the same overflow protections.

#### Scenario: Page-level range filters use shared date style
- **WHEN** analytics, budgets, or transactions range filters render date/month controls
- **THEN** each control SHALL use the shared date field style contract
- **AND** controls SHALL remain fully visible at small viewport widths.

#### Scenario: Modal forms use shared date style
- **WHEN** transaction or budget forms render date/month inputs inside modal dialogs
- **THEN** each control SHALL use the shared date field style contract
- **AND** modal content SHALL remain horizontally stable during interaction.
