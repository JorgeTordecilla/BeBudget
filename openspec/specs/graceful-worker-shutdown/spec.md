## Purpose
Define graceful shutdown requirements for in-process background import workers.

## Requirements

### Requirement: Import worker lifecycle supports graceful shutdown
The backend MUST provide explicit lifecycle controls for in-process import workers so service shutdown is deterministic and bounded.

#### Scenario: Shutdown signals idle workers and unblocks waits
- **WHEN** application shutdown is initiated while import workers are waiting for jobs
- **THEN** worker wait loops SHALL be awakened by explicit shutdown signaling
- **AND** workers SHALL exit without indefinite blocking.

#### Scenario: Shutdown join is bounded
- **WHEN** application shutdown waits for import worker termination
- **THEN** worker join behavior SHALL use a bounded timeout
- **AND** shutdown telemetry/logs SHALL indicate if any worker did not terminate within the bound.
