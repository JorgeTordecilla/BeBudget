import { Link } from "react-router-dom";

import ProblemDetailsInline from "@/components/errors/ProblemDetailsInline";
import type { TransactionImportResult } from "@/api/types";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

type ImportExecuteStepProps = {
  logs: string[];
  isRunning: boolean;
  result: TransactionImportResult | null;
  requestError: unknown | null;
  onRun: () => void;
  onRetry: () => void;
};

export default function ImportExecuteStep({ logs, isRunning, result, requestError, onRun, onRetry }: ImportExecuteStepProps) {
  const canRun = !isRunning && !result;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Step 3 - Execute import</h2>
          <p className="text-sm text-muted-foreground">Create missing entities first, then import valid rows.</p>
        </div>

        {requestError ? <ProblemDetailsInline error={requestError} /> : null}

        <div className="space-y-2 rounded-md border p-3">
          {logs.length === 0 ? <p className="text-sm text-muted-foreground">No execution logs yet.</p> : null}
          {logs.map((log) => (
            <p key={log} className="text-sm">
              {log}
            </p>
          ))}
        </div>

        {result ? (
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <p>
              <strong>{result.created_count}</strong> transactions imported successfully.
            </p>
            {result.failures.length > 0 ? (
              <ul className="list-disc pl-5">
                {result.failures.map((failure) => (
                  <li key={`${failure.index}-${failure.message}`}>
                    Row {failure.index + 1}: {failure.message}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="pt-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/app/transactions">View Transactions</Link>
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button type="button" onClick={onRun} disabled={!canRun}>
            {isRunning ? "Executing..." : "Run import"}
          </Button>
          <Button type="button" variant="outline" onClick={onRetry} disabled={isRunning || !requestError}>
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
