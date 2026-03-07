## Overview

This change is split intentionally:

- **Phase A (low-risk, deterministic fixes)**: correctness and consistency updates with near-zero architecture churn.
- **Phase B (medium-risk refactor)**: AppShell quick-transaction option loading migration to React Query cache.

```
Phase A ----------------------------------------------------+
  Accounts helper+formatting                                ¦
  Transactions amount null-checks + deps hygiene            ¦
  Budgets query-key normalization                           +--? immediate stability wins
                                                            ¦
Phase B ----------------------------------------------------+
  AppShell option loading: Promise.all/effect -> useQuery
```

## Decisions

### D1. Use explicit null checks for parsed money
`parseMoneyInputToCents` returns `number | null` and currently rejects `<= 0`. Even if `0` is currently impossible, `if (!amount)` is semantically wrong and fragile. We standardize on `amount === null`.

### D2. Shared query key family is canonical
`optionQueryKeys` is the source of truth for option-list data (`accounts`, `categories`, `income-sources`). Budget and shell flows must use it to reuse cache entries and avoid duplicate fetches.

### D3. Callback/dependency hygiene is part of correctness
Transactions modal/open and row action callbacks participate in effects/memos. We keep callbacks stable with `useCallback` and include complete dependency arrays to prevent stale closures.

### D4. Accounts UI should display money, not raw storage units
Accounts list/card should render user-facing formatted currency values (`formatCents`) instead of raw cents to stay consistent with Transactions/Budgets UX.

## Phase Plan

### Phase A Scope
- `AccountsPage`: migrate local `toLocalProblem` import, format initial balance with `formatCents`.
- `TransactionsPage`: replace `!amount` checks; wrap `openCreateModal` with `useCallback`; complete `useMemo` deps for row/mobile action handlers.
- `BudgetsPage`: migrate categories query key to `optionQueryKeys.categories({ includeArchived:false, type:"all", limit:100 })`.

### Phase B Scope
- `AppShell`: replace quick-transaction options `Promise.all`/local state fetch pattern with React Query (`useQuery`) backed by `optionQueryKeys`.
- Ensure open/close modal behavior does not trigger unnecessary network refetch when data is fresh in cache.

## Risks

- Phase A risk: low (local behavior-preserving changes).
- Phase B risk: medium (shell-level state/query lifecycle interactions).

## Verification Strategy

- Targeted unit/integration tests for affected pages/components.
- `npm run test -- --run` focused suites first.
- Full `npm run build` at end.
- Optional manual check: open quick transaction repeatedly and confirm no triple refetch storm when cache is warm.

