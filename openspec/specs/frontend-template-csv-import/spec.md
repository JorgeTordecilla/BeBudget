## Purpose
Define the frontend CSV template import experience for transactions, including parsing, entity resolution, execution orchestration, and responsiveness expectations.

## Requirements

### Requirement: CSV upload accepts template files and validates required schema
The transactions import page MUST provide a CSV-only upload entrypoint and block progression when required template columns are missing.

#### Scenario: Upload accepts only CSV files
- **WHEN** user drops or selects a file in the upload area
- **THEN** only `.csv` files are accepted.
- **AND** non-CSV files show inline error: `Only .csv files are supported`.

#### Scenario: Large file warning is non-blocking
- **WHEN** uploaded CSV size is greater than 2MB
- **THEN** UI shows warning: `Large file - parsing may be slow`.
- **AND** user may continue to parsing.

#### Scenario: Headers are detected case-insensitively
- **WHEN** CSV headers vary in casing and order
- **THEN** parser resolves recognized headers by normalized name.
- **AND** unknown headers are ignored without blocking error.

#### Scenario: Missing required columns block step transition
- **WHEN** any required column (`date`, `type`, `account`, `category`, `amount`) is missing
- **THEN** step transition to preview is blocked.
- **AND** UI shows deterministic error listing missing column names.

### Requirement: Entity resolution is case-insensitive and ambiguity-aware
The parser MUST resolve accounts and categories by normalized names, classify missing entities for creation, and block ambiguous category type usage.

#### Scenario: Missing account is classified as new
- **WHEN** account name from CSV does not match existing user accounts by normalized name
- **THEN** account resolution is `new` with default inferred type `bank`.
- **AND** rows using that account remain import-eligible if no other blocking errors exist.

#### Scenario: Missing category is classified as new with inferred type
- **WHEN** category name from CSV does not match existing categories by normalized name
- **THEN** category resolution is `new` with inferred type from transaction `type` usage.

#### Scenario: Ambiguous category usage is blocking
- **WHEN** same normalized category name appears with both `income` and `expense` row types
- **THEN** that category is resolved as `ambiguous`.
- **AND** rows referencing it are marked with blocking error:
  `Category '<name>' appears as both income and expense - rename one in your CSV`.
- **AND** ambiguous category is excluded from "to create" lists.

#### Scenario: Preview exposes editable creation/mapping controls
- **WHEN** step 2 renders resolved entities
- **THEN** UI shows separate panels for `Accounts to create` and `Categories to create`.
- **AND** each item supports editable name/type and `Map to existing` override.
- **AND** mapped items resolve to existing IDs at execution time.

### Requirement: Row normalization supports template-friendly date, amount, mood, and impulse values
The parser MUST normalize common spreadsheet formats and produce row-level diagnostics.

#### Scenario: Amount normalization supports locale variants
- **WHEN** amount values are provided as `45000`, `45,000`, `$45.000`, or `45.000,50`
- **THEN** parser converts to valid `amount_cents`.
- **AND** unparseable values create blocking row error `Invalid amount: '<value>'`.

#### Scenario: Date normalization supports multiple formats
- **WHEN** date values are provided as `YYYY-MM-DD`, `DD/MM/YYYY`, `MMM DD YYYY`, or `DD-MMM-YYYY`
- **THEN** parser normalizes date to `YYYY-MM-DD`.
- **AND** unparseable values create blocking row error `Invalid date: '<value>'`.

#### Scenario: Mood normalization maps emoji and text
- **WHEN** mood values are recognized text or emoji aliases
- **THEN** parser normalizes to enum value in lowercase (`happy`, `neutral`, `sad`, `anxious`, `bored`).
- **AND** unknown mood values normalize to `null` with row-level warning.

#### Scenario: Impulse normalization maps boolean variants
- **WHEN** `is_impulse` values are truthy (`true`, `impulse`, `yes`, `1`) or falsy (`false`, `intentional`, `no`, `0`)
- **THEN** parser normalizes to boolean.
- **AND** empty or unknown values normalize to `null` and are omitted from API payload.

#### Scenario: Preview reports row-level status and diagnostics
- **WHEN** preview table renders parsed rows
- **THEN** each row shows `valid` or `error` state with per-field messages.
- **AND** summary shows valid/error totals.

### Requirement: Execute step creates entities sequentially and imports only valid rows
The execution step MUST run deterministic, fail-fast API orchestration and preserve user context for retries.

#### Scenario: Sequential create-before-import orchestration
- **WHEN** user confirms execution from preview
- **THEN** frontend calls `POST /accounts` for each new account sequentially.
- **AND** then calls `POST /categories` for each new category sequentially.
- **AND** only after successful creation calls `POST /transactions/import`.

#### Scenario: Execution is fail-fast before import
- **WHEN** any `POST /accounts` or `POST /categories` request fails
- **THEN** execution stops immediately.
- **AND** `POST /transactions/import` is not called.
- **AND** UI shows deterministic API error feedback.

#### Scenario: Import payload includes only valid rows in partial mode
- **WHEN** `POST /transactions/import` is called
- **THEN** payload uses `mode: "partial"`.
- **AND** payload includes only rows without blocking errors.

#### Scenario: Progress and final result are visible
- **WHEN** execution is running
- **THEN** UI shows step-by-step progress messages for account creation, category creation, and import.
- **AND** final result shows imported count and any server failures with index/message.

#### Scenario: Canonical API errors are handled for retries
- **WHEN** any execution API call returns ProblemDetails (`400`, `401`, `403`, `409`, `429`)
- **THEN** UI maps and displays deterministic error feedback.
- **AND** user can retry without losing current preview state.

#### Scenario: Re-upload resets wizard state fully
- **WHEN** user selects `Upload different file` from preview state
- **THEN** wizard returns to upload step.
- **AND** all previous parse data, entity edits/mappings, and execution errors are cleared.

### Requirement: Import wizard remains usable on mobile and keeps quality gates green
The new import experience MUST be responsive and pass existing build/test gates.

#### Scenario: Preview remains usable on small viewports
- **WHEN** wizard is rendered on mobile viewport
- **THEN** preview table uses contained horizontal scrolling.
- **AND** content remains readable without page-level horizontal overflow.

#### Scenario: Quality gates pass after feature delivery
- **WHEN** validation is executed
- **THEN** `npm run test`, `npm run test:coverage`, and `npm run build` pass.

### Requirement: Frontend import flow remains non-blocking under heavy local processing
The import experience MUST keep the browser UI responsive while parsing and previewing large CSV files.

#### Scenario: Parsing does not freeze the main UI thread
- **WHEN** a large CSV is parsed
- **THEN** parsing is executed off the main UI thread.
- **AND** user can still interact with cancel/re-upload controls.

#### Scenario: Preview rendering remains responsive for large row counts
- **WHEN** preview table contains many rows
- **THEN** rendering strategy avoids full-table blocking work.
- **AND** scrolling/interactions remain responsive.
