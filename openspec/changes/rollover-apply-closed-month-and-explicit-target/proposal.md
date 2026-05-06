## Why
Users are confused by rollover behavior when the selected analytics range includes the first day of the next month. They may think they are applying rollover for April while actually applying for May, which creates a June transaction by design.

## What Changes
- Enforce closed-month policy for rollover apply:
  - Rollover can be applied only for source months strictly earlier than the current calendar month.
- Improve rollover UX copy in analytics:
  - Show explicit `source_month` and explicit target transaction date (`next-month-01`) before confirmation.
  - Clarify action text to indicate month-to-month transfer intent.

## Impact
- Backend rollover apply semantics gain a deterministic guard against in-progress month application.
- Frontend analytics rollover actions become self-explanatory and reduce accidental misapplication.
- API contract/documentation and tests must reflect the closed-month rule and explicit source/target messaging behavior.
