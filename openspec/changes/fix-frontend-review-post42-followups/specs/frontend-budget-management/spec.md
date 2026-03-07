## MODIFIED Requirements

### Requirement: Budget categories selection must include active income and expense categories
The frontend SHALL populate budget category selection from active categories without frontend-only type restrictions.

#### Scenario: Categories query key is normalized for cache reuse
- **WHEN** budget create/edit flows request category options
- **THEN** frontend SHALL use shared `optionQueryKeys.categories(...)` with normalized params
- **AND** cache entries SHALL align with other pages requesting the same active-category option set.

