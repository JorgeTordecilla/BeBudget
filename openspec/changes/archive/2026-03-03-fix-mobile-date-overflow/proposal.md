## Why

Mobile browsers (iOS Safari/Chrome/Brave and Android Chrome/Brave/WebView variants) can enforce intrinsic minimum width behavior for native `input[type="date"]` and `input[type="month"]` controls. In BudgetBuddy this intermittently causes horizontal overflow in narrow viewports, especially inside modal forms, degrading usability and violating existing mobile accessibility/responsiveness goals.

## What Changes

- Add a cross-screen/frontend contract for mobile-safe date and month input rendering.
- Standardize CSS constraints for native date/month controls so intrinsic WebKit sub-elements cannot force overflow.
- Apply the shared date-field styling across all screens and modal forms that use date/month inputs.
- Add verification coverage to ensure mobile layouts with date/month selectors do not introduce horizontal scroll regressions.

## Capabilities

### New Capabilities
- `frontend-mobile-date-field-stability`: Defines requirements for preventing horizontal overflow from native date/month controls on mobile browsers across pages and modals.

### Modified Capabilities
- `frontend-modal-a11y-foundation`: Extend modal responsive behavior to explicitly include native date/month controls across all modal forms.
- `frontend-analytics-dashboard`: Extend range-filter responsiveness requirements to include mobile-safe date control rendering.
- `frontend-budget-management`: Extend month-filter responsiveness requirements to include mobile-safe month control rendering.
- `frontend-transactions-management`: Extend date filter and transaction form responsiveness requirements to include mobile-safe date control rendering.

## Impact

- Affected frontend code:
  - `frontend/src/index.css`
  - `frontend/src/pages/TransactionsPage.tsx`
  - `frontend/src/features/analytics/AnalyticsPage.tsx`
  - `frontend/src/features/budgets/BudgetsPage.tsx`
  - `frontend/src/components/transactions/TransactionForm.tsx`
  - `frontend/src/features/budgets/components/BudgetFormModal.tsx`
- Test impact:
  - Update/add frontend CSS regression tests and mobile viewport behavior checks.
- API/OpenAPI impact:
  - No API path, schema, media type, or contract payload changes (`application/vnd.budgetbuddy.v1+json` and `application/problem+json` unchanged).
- Backwards compatibility:
  - Backward compatible frontend-only UX hardening; no backend or SDK contract break.
