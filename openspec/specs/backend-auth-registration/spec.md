# backend-auth-registration Specification

## Purpose
Define registration and authenticated user contract requirements for backend auth, including required user identity fields and persistence guarantees.

## Requirements

### Requirement: Registration must require and validate user email
The system SHALL require an `email` field on user registration, validate it, and reject invalid values with deterministic contract behavior.

#### Scenario: Missing email is rejected
- **WHEN** client calls `POST /auth/register` without `email`
- **THEN** API SHALL return `422 Unprocessable Entity`
- **AND** response SHALL indicate email is required.

#### Scenario: Null or empty email is rejected
- **WHEN** client sends `email=null` or `email=""`
- **THEN** API SHALL return `422 Unprocessable Entity`.

#### Scenario: Invalid email format is rejected
- **WHEN** client sends invalid format (e.g., `usuario@`, `usuariocorreo.com`, whitespace-containing email)
- **THEN** API SHALL return `422 Unprocessable Entity`
- **AND** response SHALL describe invalid email format.

#### Scenario: Email length above 254 is rejected
- **WHEN** client sends email longer than 254 characters
- **THEN** API SHALL return `422 Unprocessable Entity`.

#### Scenario: Valid subdomain email is accepted
- **WHEN** client sends email like `user@mail.empresa.co`
- **THEN** registration validation SHALL accept the value.

### Requirement: Registration must enforce email uniqueness and normalization
The system SHALL persist normalized lowercase email and enforce uniqueness for concurrent-safe registration behavior.

#### Scenario: Email is normalized to lowercase on persistence
- **WHEN** client registers with `Usuario@Correo.COM`
- **THEN** system SHALL persist `usuario@correo.com`.

#### Scenario: Duplicate email is rejected
- **WHEN** client registers with email already used by another account
- **THEN** API SHALL return `409 Conflict`
- **AND** detail SHALL state `Email already registered`.

#### Scenario: Username conflict behavior remains unchanged
- **WHEN** client registers with existing username and new email
- **THEN** API SHALL return `409 Conflict`
- **AND** detail SHALL remain username-conflict specific.

#### Scenario: Concurrent duplicate email registration is DB-safe
- **WHEN** two concurrent registration requests use same normalized email
- **THEN** only one request SHALL succeed
- **AND** the other SHALL fail with `409` due to DB uniqueness enforcement.

### Requirement: Email must be available in user session outputs
The system SHALL expose persisted email in authenticated user payloads.

#### Scenario: Register success payload includes email
- **WHEN** registration succeeds
- **THEN** response user object SHALL include `email`.

#### Scenario: Me endpoint returns email
- **WHEN** authenticated client calls `GET /me`
- **THEN** response user object SHALL include `email`.

### Requirement: Email persistence schema must be migration-managed
The database schema SHALL include indexed and constrained email storage in `users`.

#### Scenario: Migration 0014 adds constrained email column
- **WHEN** Alembic upgrades from revision `0013`
- **THEN** migration SHALL add `users.email` as `VARCHAR(254) NOT NULL`
- **AND** SHALL add uniqueness and index support for lookup.

#### Scenario: Migration downgrade removes email schema changes
- **WHEN** Alembic downgrades one revision from `0014`
- **THEN** email index/constraint/column SHALL be removed cleanly.

### Requirement: EmailStr dependency must be available
The backend dependency set SHALL include `email-validator` to support Pydantic email validation.

#### Scenario: Runtime validates EmailStr without missing dependency errors
- **WHEN** application loads auth schemas with `EmailStr`
- **THEN** runtime SHALL resolve validator dependency successfully.
