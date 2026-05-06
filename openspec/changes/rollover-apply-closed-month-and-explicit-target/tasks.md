## 1. Backend closed-month enforcement

- [x] 1.1 Add server-side validation in rollover apply to reject current/future `source_month`.
- [x] 1.2 Return canonical `422` error semantics for non-closed source month.
- [x] 1.3 Add integration tests for past/current/future `source_month` behavior.

## 2. Frontend rollover UX clarity

- [x] 2.1 Gate rollover apply action to closed months only in analytics rollover section.
- [x] 2.2 Show explicit `Source month` and `Target transaction date` in apply flow.
- [x] 2.3 Update apply CTA copy to emphasize source-month intent.
- [x] 2.4 Add/update UI tests for gating and explicit source/target copy.

## 3. Contract and verification

- [x] 3.1 Update relevant OpenAPI/docs and problem-details mapping if required by backend validation response.
- [x] 3.2 Run backend pytest + frontend test/build + openspec validate for this change.

