## Context
Current rollover behavior is technically correct:
- `source_month` is the month from which surplus is computed.
- Created transaction date is `next_month_start(source_month)`.

However, users can trigger apply from analytics rows without a strong visual cue about source vs target month/date.

## Goals
- Prevent apply for month-in-progress.
- Make source and target explicit in rollover UX.

## Non-Goals
- Changing rollover persistence model (`monthly_rollover` uniqueness by `user_id + source_month` remains unchanged).
- Changing target date policy (still day 1 of next month).

## Design Decisions
1. Closed-month validation in backend apply endpoint
- Validation rule:
  - Let `current_month = YYYY-MM` derived from server date in configured runtime timezone/UTC policy used by backend date logic.
  - Reject apply when `source_month >= current_month`.
- Error mapping:
  - Return canonical validation error (`422`) with clear detail indicating month must be closed.

2. Frontend rollover action gating and wording
- Action availability:
  - Hide/disable `Apply rollover` for current/future months.
  - Show status label such as `Month not closed yet`.
- Explicit copy:
  - In row and modal show:
    - `Source month: YYYY-MM`
    - `Target transaction date: YYYY-MM-01` (next month start)
  - CTA text indicates direction, e.g. `Apply rollover from YYYY-MM`.

## Risks
- Boundary ambiguity around timezone/date cutover near midnight.
  - Mitigation: use backend server-side month validation as source of truth.

## Verification Strategy
- Backend integration tests for:
  - accept past closed month
  - reject current month
  - reject future month
- Frontend tests for:
  - apply button disabled/hidden for non-closed month rows
  - modal/copy includes explicit source and target date
