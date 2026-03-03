## 1. Shared Date/Month Styling

- [x] 1.1 Add a shared mobile-safe class for native `date`/`month` inputs in `frontend/src/index.css` and harden intrinsic-width constraints.
- [x] 1.2 Ensure global selectors for native `date`/`month` controls include overflow-safe behavior for mobile WebKit sub-elements.

## 2. Apply Shared Styling Across Screens And Modals

- [x] 2.1 Apply the shared date style to transactions date filters and transaction form modal date field.
- [x] 2.2 Apply the shared date style to analytics date range controls.
- [x] 2.3 Apply the shared date style to budgets month range controls and budget form modal month field.

## 3. Regression Tests

- [x] 3.1 Update/add CSS regression tests to assert presence of shared date/month mobile-safe rules.
- [x] 3.2 Run targeted frontend tests for updated style and form surfaces.

## 4. Verification

- [x] 4.1 Run `COREPACK_HOME=/tmp/corepack corepack pnpm run test -- --run src/index.css.test.ts src/components/components.test.tsx src/pages/TransactionsPage.test.tsx src/features/analytics/AnalyticsPage.test.tsx src/features/budgets/BudgetsPage.test.tsx` in `frontend/`.
- [x] 4.2 Run `COREPACK_HOME=/tmp/corepack corepack pnpm run build` in `frontend/`.
