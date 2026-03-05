## Why

BudgetBuddy already supports installable PWA + offline read-only behavior, but users still rely on opening the app to notice upcoming bills. The product needs proactive reminders for unpaid bills due today and three days ahead, including when the app is closed.

The current service worker strategy uses `generateSW`, which cannot host custom `push` and `notificationclick` handlers. This change introduces a custom service worker via `injectManifest`, plus backend VAPID-based subscription and scheduled dispatch.

## What Changes

- Migrate frontend PWA strategy from `generateSW` to `injectManifest`.
- Add custom `frontend/src/sw.ts` with:
  - precache + cache cleanup.
  - SPA navigation fallback route for offline app paths.
  - `SKIP_WAITING` message handler compatible with update prompt flow.
  - existing API runtime caching rules preserved.
  - `push` + `notificationclick` handlers.
- Add backend push subscription model, schemas, router, and dispatcher.
- Add backend reminder module entrypoint: `python -m app.cli.send_bill_reminders`.
- Add daily Render Cron Job for reminder dispatch.
- Add frontend push APIs, VAPID helper, push subscription hook, and delayed permission banner UX.
- Add tests for push API wrapper, hook, permission banner, and no-regression gates.

## Capabilities

### New Capabilities
- `pwa-push-notifications`: Push subscription lifecycle, scheduled bill reminders, and notification interaction semantics.

### Modified Capabilities
- `frontend-pwa-offline-readonly`: Service worker architecture changes from generated worker to injected custom worker without cache-policy regression.
- `frontend-routing-ui-foundation`: App shell adds push permission prompt surface.

## Impact

- Backend:
  - model + migration + router + dispatcher + CLI module entrypoint.
  - new required env vars for VAPID.
  - no API media type changes (vendor JSON and problem JSON remain canonical).
- Frontend:
  - SW build strategy and custom worker source.
  - push subscription client/hook/UI integration.
- Infra:
  - one Render Cron Job service.
- Backwards compatibility:
  - no contract break for existing endpoints.
  - PWA install/offline behavior must remain compatible with current production expectations.
