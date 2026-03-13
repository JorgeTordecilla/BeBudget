## MODIFIED Requirements

### Requirement: Product branding is consistent across authenticated and public UI
Frontend user-facing branding text SHALL consistently present the product as `BeBudget` across shell and authentication surfaces.

#### Scenario: Shell branding renders BeBudget
- **WHEN** an authenticated user views the app shell header/navigation branding
- **THEN** the visible product label SHALL be `BeBudget`
- **AND** legacy `BudgetBuddy` branding text SHALL NOT appear in those shell surfaces.

#### Scenario: Authentication screens render BeBudget identity
- **WHEN** a user visits `/login` or `/register`
- **THEN** headings and supporting copy that mention the product name SHALL use `BeBudget`.

