## Purpose
Define frontend requirements that protect React-owned DOM from browser auto-translation mutations and keep portal-based interactions resilient.

## Requirements

### Requirement: SPA root must prevent automatic translation mutations
The frontend MUST declare anti-translation guardrails at document and root-node level to preserve React DOM ownership in mobile browsers.

#### Scenario: Document declares notranslate hint
- **WHEN** `frontend/index.html` is loaded
- **THEN** `<head>` SHALL include `<meta name="google" content="notranslate">`.

#### Scenario: Root node translation is disabled
- **WHEN** the SPA mounts into `#root`
- **THEN** the root container SHALL declare `translate="no"` to prevent automatic text-node replacement inside the React tree.

### Requirement: Shared Select primitive must fail safely under external DOM mutation
The shared `Select` UI primitive MUST isolate runtime failures in portal content so translation or extension-driven DOM mutation does not crash the entire application.

#### Scenario: SelectContent is wrapped with local error boundary
- **WHEN** `SelectContent` renders in `frontend/src/ui/select.tsx`
- **THEN** portal content SHALL be wrapped by an error boundary with `fallback={null}`.

#### Scenario: Select runtime failure does not crash app shell
- **WHEN** a DOM-mutation-related runtime error occurs while opening a `Select`
- **THEN** the Select content MAY fail closed
- **AND** the application shell SHALL remain mounted and interactive.

### Requirement: Auth flows remain stable with translation enabled
Register and login experiences MUST preserve current visual and functional behavior after anti-translation hardening.

#### Scenario: Register currency selector remains functional under translated page
- **WHEN** Android Chrome translation is enabled and user opens register flow
- **THEN** the currency `Select` SHALL open, allow option selection, and submit without `removeChild` runtime failures.

#### Scenario: Login flow has no visual or functional regression
- **WHEN** Android Chrome translation is enabled and user opens login flow
- **THEN** login UI SHALL render normally
- **AND** login interaction SHALL complete without Select-related runtime crashes.
