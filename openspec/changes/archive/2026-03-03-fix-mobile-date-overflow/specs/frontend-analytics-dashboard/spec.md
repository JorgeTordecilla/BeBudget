## MODIFIED Requirements

### Requirement: Analytics responsive readability
The analytics interface SHALL preserve trend and breakdown readability across mobile, tablet, and desktop by adapting chart, control, and data-summary layouts.

#### Scenario: Analytics interpretation on mobile
- **WHEN** a user opens Analytics on a small viewport
- **THEN** trend insights and category breakdown remain legible and interpretable without requiring horizontal table interaction as the primary mode

#### Scenario: Analytics filter controls avoid mobile overflow
- **WHEN** date range controls are rendered on a small viewport
- **THEN** controls SHALL reflow in a mobile-first layout that keeps each control fully visible
- **AND** native `input[type="date"]` controls SHALL NOT overflow their parent container width on iOS Safari/Chrome/Brave and Android Chrome/Brave.
