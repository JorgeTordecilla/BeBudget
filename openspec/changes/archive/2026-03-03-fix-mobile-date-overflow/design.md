## Context

BudgetBuddy currently uses native HTML date/month controls (`input[type="date"]`, `input[type="month"]`) across filters and modal forms. Existing `field-input` constraints (`min-w-0`, `w-full`, `max-w-full`) reduce overflow risk but do not fully constrain intrinsic-width behavior of date/month pseudo-elements on WebKit mobile engines. The issue manifests as horizontal overflow in narrow viewports on iOS and Android browsers, especially in modal containers where available inline space is reduced.

This change is frontend-only and must preserve contract-first API behavior (vendor media types and ProblemDetails handling). It touches shared styling (`index.css`) and multiple route/form surfaces, so a cross-cutting design is appropriate.

## Goals / Non-Goals

**Goals:**
- Prevent horizontal overflow caused by native date/month controls on mobile viewports.
- Apply one reusable approach across all current date/month controls in pages and modal forms.
- Preserve existing form semantics, validation behavior, and keyboard accessibility.
- Add regression checks that fail if shared styles regress.

**Non-Goals:**
- Replacing native inputs with a custom calendar widget.
- Changing API contracts, payload shapes, or route behavior.
- Redesigning non-date form controls or table overflow behavior.

## Decisions

1. Introduce a dedicated shared class for native date/month controls.
- Decision: Add a `field-date-input` class layered on top of `field-input` and apply it to every `type=date|month` control in screens and modals.
- Rationale: A dedicated class gives deterministic, auditable coverage and avoids relying only on global type selectors.
- Alternative considered: Keep only global `input[type=date|month]` selectors. Rejected because explicit class usage makes per-control intent and testability clearer.

2. Harden intrinsic-width constraints for WebKit subparts.
- Decision: Extend CSS with inline-size/min-inline-size constraints and overflow-safe rules for date/month controls and their editable pseudo-elements.
- Rationale: Mobile WebKit often ignores naive width rules unless subparts are constrained too.
- Alternative considered: Migrate to shadcn `Calendar + Popover`. Rejected for this fix because it is a larger UX/behavior change; current bug can be solved with lower-risk CSS hardening.

3. Keep existing modal architecture and only tighten responsive guarantees.
- Decision: Reuse existing `ModalForm` container and keep control order/semantics unchanged.
- Rationale: Existing modal a11y/focus management is already validated; changing container architecture would add unnecessary risk.
- Alternative considered: Introduce viewport-specific modal variants. Rejected due to complexity and no added value for this bug.

4. Verify via targeted frontend tests.
- Decision: Update CSS regression tests to assert the new shared date control class and mobile-safe constraints are present.
- Rationale: This catches future regressions early without brittle browser-specific snapshot tests.
- Alternative considered: add full browser E2E matrix in this change. Deferred to a follow-up because infra/runtime cost is higher than this targeted patch.

## Risks / Trade-offs

- [Risk] Some mobile UAs may still render native picker affordances differently even with width constraints.
  -> Mitigation: Use conservative width constraints and keep controls full-width within already constrained containers.

- [Risk] Adding a new class requires touching multiple files and can miss one input.
  -> Mitigation: Use repository-wide search for `type="date"` and `type="month"` and update all occurrences.

- [Risk] Over-constraining date controls could clip text in unusual locale formats.
  -> Mitigation: Keep full-width input boxes and avoid fixed pixel widths; constrain only overflow, not semantic value content.
