## Context

The repository uses:
- sync FastAPI routers with `Session` dependencies and `vendor_response`.
- SQLAlchemy UUID-string IDs across domain models.
- a non-`BaseSettings` environment config (`Settings`) built from `os.getenv`.
- frontend API transport through a centralized `ApiClient` instance from auth context.

The design must follow these existing patterns to avoid introducing architectural drift.

## Goals / Non-Goals

**Goals**
- deliver web push reminders for unpaid bills due today and due in 3 days.
- preserve current PWA installability, cache safety, and update prompt behavior.
- keep implementation operable via one daily Render Cron Job.

**Non-Goals**
- background job queues (Celery/Redis), APScheduler, or push retry infrastructure.
- in-app real-time socket updates.
- broad notification templates beyond bill reminders.

## Decisions

1. Backend remains synchronous and repository-consistent.
- Push router uses sync handlers and `Session`.
- IDs remain UUID strings.
- New repository behavior follows existing SQLAlchemy patterns.

2. VAPID config follows existing `Settings` style.
- Read from `os.getenv` in `backend/app/core/config.py`.
- Do not introduce `Field(..., env=...)` or BaseSettings patterns.

3. Upsert strategy must be multi-dialect safe.
- Primary path: PostgreSQL `ON CONFLICT` upsert.
- Compatibility path for SQLite tests: deterministic select+update/insert fallback.
- Upsert updates `user_id`, `p256dh`, and `auth` to handle account switching on same endpoint.

4. Service worker migration keeps existing behavior plus push events.
- Migrate to `injectManifest`.
- Preserve ordered runtime cache rules.
- Add SPA navigation fallback and explicit `SKIP_WAITING` message support.

5. Frontend push API/hook follows existing auth-client composition.
- Use `useAuth().apiClient`, not non-existent `useApiClient`.
- Keep function signatures aligned with existing `src/api/*.ts` style.

6. Reminder computation follows current bill model.
- Bills store `due_day`, not persisted due date.
- Reminder targets are computed per current month date context.
- Paid entries in `BillPayment` for current month exclude reminders.

7. Formatting and portability constraints.
- Avoid non-portable `strftime("%-d %b")`; use portable date formatting strategy.
- Avoid adding Babel for currency formatting in this change.

8. `/push/test` exposure is restricted.
- In production: return 404.
- In non-production: require `X-Push-Test-Token`.

## Architecture Notes

- Backend flow:
  - `GET /api/push/vapid-public-key` public key endpoint (public).
  - authenticated subscribe/unsubscribe/test endpoints.
  - daily CLI module dispatches reminders and removes expired subscriptions (HTTP 410).
- Frontend flow:
  - permission prompt appears after session threshold with defer window.
  - successful permission + subscription posts endpoint/keys to backend.
  - SW receives payload and routes click actions to bills context.

## Risks / Trade-offs

- [Risk] Service-worker regression during strategy migration.
  - Mitigation: preserve runtime cache contract and add targeted tests + manual offline checks.

- [Risk] Endpoint ownership mismatch if endpoint reused on another account.
  - Mitigation: upsert updates `user_id` on conflict.

- [Risk] SQLite test environment incompatibility with postgres-only SQL.
  - Mitigation: implement dialect-aware upsert fallback.

- [Risk] Push-test endpoint abuse.
  - Mitigation: hide in production and require secret header in non-prod.
