## 1. Backend Push Foundation

- [x] 1.1 Add push env configuration in `backend/app/core/config.py` using existing `os.getenv` Settings style.
- [x] 1.2 Add `PushSubscription` model (UUID string IDs) and `User.push_subscriptions` relationship in `backend/app/models.py`.
- [x] 1.3 Create Alembic migration for `push_subscriptions` (UUID string id, unique endpoint, user index).
- [x] 1.4 Add push schemas to `backend/app/schemas.py`.
- [x] 1.5 Add push dispatcher module (`send_push`, payload builder, due-date computation, portable date formatting).

## 2. Backend API and Scheduler Entry Point

- [x] 2.1 Add `backend/app/routers/push.py` with:
  - public VAPID key endpoint.
  - authenticated subscribe/unsubscribe.
  - non-prod guarded `/push/test`.
- [x] 2.2 Implement subscription upsert with dialect-safe behavior (Postgres upsert + SQLite-compatible fallback).
- [x] 2.3 Register push router under `/api` in `backend/app/main.py`.
- [x] 2.4 Add `backend/app/cli/send_bill_reminders.py` module entrypoint supporting `--dry-run`.
- [x] 2.5 Update `backend/requirements.txt` with `pywebpush>=2.0`.

## 3. Frontend Service Worker Migration

- [x] 3.1 Migrate `frontend/vite.config.ts` PWA strategy to `injectManifest` with `srcDir` and `filename`.
- [x] 3.2 Add `frontend/src/sw.ts` with:
  - precache + cleanup.
  - navigation fallback route.
  - `SKIP_WAITING` message handler.
  - existing runtime cache rules preserved.
  - `push` and `notificationclick` handlers.
- [x] 3.3 Keep update prompt compatibility with `useRegisterSW().updateServiceWorker(true)`.

## 4. Frontend Push Subscription UX

- [x] 4.1 Add VAPID helper `frontend/src/lib/vapid.ts`.
- [x] 4.2 Add push API module `frontend/src/api/push.ts` with existing `ApiClient` function style.
- [x] 4.3 Add `frontend/src/hooks/usePushNotifications.ts` using `useAuth().apiClient`.
- [x] 4.4 Add `frontend/src/components/pwa/PushPermissionRequest.tsx` with session threshold + defer window logic.
- [x] 4.5 Mount permission prompt in `frontend/src/routes/AppShell.tsx`.
- [x] 4.6 Increment local session counter in `frontend/src/main.tsx`.

## 5. Tests and Verification

- [x] 5.1 Add frontend tests for push API wrapper.
- [x] 5.2 Add frontend tests for push hook browser API mocking.
- [x] 5.3 Add frontend tests for permission banner visibility/defer behavior.
- [x] 5.4 Run `npm run test`, `npm run test:coverage`, `npm run build` in `frontend/`.
- [x] 5.5 Run backend tests impacted by model/router additions.
- [ ] 5.6 Configure Render Cron Job (`python -m app.cli.send_bill_reminders`) and perform manual trigger validation.
