## MODIFIED Requirements

### Requirement: Transactions responsive data rendering
The transactions page SHALL provide card/list rendering on small viewports and dense table rendering on larger viewports using the same underlying data and actions, and SHALL prevent horizontal overflow for filter/form controls in mobile containers.

#### Scenario: Transactions without mobile horizontal dependency
- **WHEN** a user opens Transactions on a small viewport
- **THEN** transaction records are readable and actionable without requiring horizontal table scrolling

#### Scenario: Filter controls remain within mobile container bounds
- **WHEN** the transactions filter surface renders on a small viewport
- **THEN** date and select controls SHALL remain within container width
- **AND** native `input[type="date"]` controls SHALL NOT introduce horizontal page overflow on iOS Safari/Chrome/Brave and Android Chrome/Brave.

#### Scenario: Transaction form controls remain within modal bounds
- **WHEN** a user opens the create or edit transaction modal on a small viewport
- **THEN** all form controls (including native `input[type="date"]`) SHALL remain within modal content width
- **AND** modal interaction SHALL NOT require horizontal scrolling.
