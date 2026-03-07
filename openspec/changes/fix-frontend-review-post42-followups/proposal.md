## Why

Post-merge review on `main` found remaining frontend inconsistencies and low-level correctness risks not fully covered by PR #42. The highest-value fixes are small but cross-cutting: one duplicated ProblemDetails wrapper in Accounts, fragile falsy amount checks in transaction payload builders, inconsistent query key usage for categories in Budgets, callback/dependency hygiene in Transactions, and money formatting consistency in Accounts. A secondary improvement is moving AppShell quick-transaction option loading to React Query to reuse cache and avoid repeated fetch bursts.

## What Changes

- Phase A (correctness + consistency):
  - Replace remaining local `toLocalProblem` in Accounts with shared `@/lib/problemDetails` helper.
  - Replace `if (!amount)` checks with explicit `if (amount === null)` in transaction payload builders (Transactions + AppShell quick-create path).
  - Align Budgets categories query key to shared `optionQueryKeys.categories(...)` semantics.
  - Stabilize Transactions callbacks/deps (`openCreateModal` via `useCallback`, complete `useMemo` deps).
  - Format account initial balance with `formatCents(currencyCode, ...)` in table and mobile card UI.
- Phase B (query/cache architecture improvement):
  - Move AppShell quick-transaction option loading (accounts/categories/income-sources) from local `Promise.all` effect to React Query using shared keys so opens are cache-backed.

## Capabilities

### New Capabilities
- `frontend-accounts-management`: establish frontend requirements for accounts list money formatting and canonical ProblemDetails helper reuse.

### Modified Capabilities
- `frontend-transactions-management`: tighten amount-validation semantics, callback/dependency stability, and shared option-query caching behavior.
- `frontend-budget-management`: enforce normalized categories query key usage aligned with shared query key family.

## Impact

- **Affected code (frontend)**:
  - `frontend/src/pages/AccountsPage.tsx`
  - `frontend/src/pages/TransactionsPage.tsx`
  - `frontend/src/routes/AppShell.tsx`
  - `frontend/src/features/budgets/BudgetsPage.tsx`
  - shared query key/helper modules already present (`src/query/queryKeys.ts`, `src/lib/problemDetails.ts`)
- **Affected tests**:
  - `frontend/src/pages/TransactionsPage.test.tsx`
  - `frontend/src/features/budgets/BudgetsPage.test.tsx`
  - `frontend/src/pages/AccountsPage.test.tsx` (if absent, create focused coverage)
  - AppShell-focused tests for cache-backed option loading behavior
- **Backwards compatibility**:
  - No API schema/media-type changes.
  - No backend endpoint changes.
  - No expected breaking behavior changes.

