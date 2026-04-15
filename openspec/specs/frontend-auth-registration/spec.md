# frontend-auth-registration Specification

## Purpose
Define frontend registration contract and UX requirements for auth onboarding, including payload shape, deterministic validation, and conflict messaging.

## Requirements

### Requirement: Frontend register request must include required email
The frontend SHALL submit `email` in `POST /auth/register` payloads and keep client contract types aligned with backend.

#### Scenario: Register payload includes email
- **WHEN** the user submits the Register form
- **THEN** frontend SHALL send `username`, `email`, `password`, and `currency_code`.

#### Scenario: Session user model includes email
- **WHEN** frontend receives auth session payloads (`register`, `login`, `refresh`, `me`)
- **THEN** frontend user typing SHALL include `email`.

### Requirement: Register UI must validate email before submit
The frontend SHALL provide deterministic email validation in the registration form.

#### Scenario: Missing email is blocked client-side
- **WHEN** email is empty
- **THEN** frontend SHALL block submit and show validation feedback.

#### Scenario: Invalid email format is blocked client-side
- **WHEN** email format is invalid
- **THEN** frontend SHALL block submit and show validation feedback.

#### Scenario: Email above 254 chars is blocked client-side
- **WHEN** email length exceeds 254
- **THEN** frontend SHALL block submit and show validation feedback.

### Requirement: Register conflict mapping must distinguish username and email
The frontend SHALL map register conflicts to deterministic user-facing messages.

#### Scenario: Username conflict preserves existing message
- **WHEN** backend returns `409` with detail `Username already exists`
- **THEN** frontend SHALL show username-specific guidance.

#### Scenario: Email conflict shows email-specific guidance
- **WHEN** backend returns `409` with detail `Email already registered`
- **THEN** frontend SHALL show email-specific guidance.
