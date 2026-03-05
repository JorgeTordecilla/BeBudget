import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { createAccount, listAccounts } from "@/api/accounts";
import { createCategory, listCategories } from "@/api/categories";
import { getTransactionsImportJob, importTransactions, submitTransactionsImportJob } from "@/api/transactions";
import type { Account, Category, TransactionImportResult } from "@/api/types";
import { useAuth } from "@/auth/useAuth";
import ImportExecuteStep from "@/components/transactions/ImportExecuteStep";
import ImportPreviewStep from "@/components/transactions/ImportPreviewStep";
import ImportUploadStep from "@/components/transactions/ImportUploadStep";
import PageHeader from "@/components/PageHeader";
import {
  buildTransactionImportItems,
  parseTemplateCsv,
  type EntityToCreate,
  type ParsedImportResult
} from "@/lib/templateCsvParser";
import { invalidateTransactionsAnalyticsAndBudgets } from "@/features/transactions/transactionCache";
import { Button } from "@/ui/button";

const LARGE_FILE_BYTES = 2 * 1024 * 1024;

type WizardStep = "upload" | "preview" | "execute";

async function fetchAllAccounts(client: ReturnType<typeof useAuth>["apiClient"]): Promise<Account[]> {
  const items: Account[] = [];
  let cursor: string | null = null;

  // Keep list reasonably bounded for selector UX.
  for (let i = 0; i < 20; i += 1) {
    const page = await listAccounts(client, { includeArchived: false, limit: 100, cursor });
    items.push(...page.items);
    if (!page.next_cursor) {
      break;
    }
    cursor = page.next_cursor;
  }

  return items;
}

async function fetchAllCategories(client: ReturnType<typeof useAuth>["apiClient"]): Promise<Category[]> {
  const items: Category[] = [];
  let cursor: string | null = null;

  for (let i = 0; i < 20; i += 1) {
    const page = await listCategories(client, { includeArchived: false, type: "all", limit: 100, cursor });
    items.push(...page.items);
    if (!page.next_cursor) {
      break;
    }
    cursor = page.next_cursor;
  }

  return items;
}

async function parseCsvOffMainThread(csvText: string, accounts: Account[], categories: Category[]): Promise<ParsedImportResult> {
  if (typeof Worker === "undefined") {
    return parseTemplateCsv(csvText, accounts, categories);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("@/lib/templateCsvParser.worker.ts", import.meta.url), { type: "module" });

    worker.onmessage = (event) => {
      const { ok, result, message } = event.data ?? {};
      worker.terminate();
      if (!ok) {
        reject(new Error(message ?? "Failed to parse CSV"));
        return;
      }
      resolve(result as ParsedImportResult);
    };
    worker.onerror = () => {
      worker.terminate();
      reject(new Error("Failed to parse CSV"));
    };

    worker.postMessage({ csvText, accounts, categories });
  });
}

async function readFileText(file: File): Promise<string> {
  if (typeof file.text === "function") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function idempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function TransactionsImportPage() {
  const { apiClient } = useAuth();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>("upload");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedImportResult | null>(null);
  const [accountsToCreate, setAccountsToCreate] = useState<EntityToCreate[]>([]);
  const [categoriesToCreate, setCategoriesToCreate] = useState<EntityToCreate[]>([]);
  const [requestError, setRequestError] = useState<unknown | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<TransactionImportResult | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounts", "import-all"],
    queryFn: () => fetchAllAccounts(apiClient)
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories", "import-all"],
    queryFn: () => fetchAllCategories(apiClient)
  });

  const existingAccounts = accountsQuery.data ?? [];
  const existingCategories = categoriesQuery.data ?? [];

  const executionMutation = useMutation({
    meta: { skipGlobalErrorToast: true },
    mutationFn: async () => {
      if (!parseResult) {
        throw new Error("Preview is not ready");
      }

      const accountIdsByKey = new Map<string, string>();
      const categoryIdsByKey = new Map<string, string>();

      existingAccounts.forEach((entry) => accountIdsByKey.set(entry.name.trim().toLowerCase(), entry.id));
      existingCategories.forEach((entry) => categoryIdsByKey.set(`${entry.name.trim().toLowerCase()}:${entry.type}`, entry.id));

      setLogs([]);
      setRequestError(null);
      setResult(null);

      const pushLog = (line: string) => {
        setLogs((prev) => [...prev, line]);
      };

      for (const draft of accountsToCreate) {
        if (draft.mappedExistingId) {
          accountIdsByKey.set(draft.sourceKey, draft.mappedExistingId);
          continue;
        }
        pushLog(`Creating account ${draft.draftName}...`);
        const created = await createAccount(apiClient, {
          name: draft.draftName,
          type: draft.draftType as Account["type"],
          initial_balance_cents: 0
        });
        accountIdsByKey.set(draft.sourceKey, created.id);
        pushLog(`Creating account ${draft.draftName}... ✅`);
      }

      for (const draft of categoriesToCreate) {
        if (draft.mappedExistingId) {
          categoryIdsByKey.set(`${draft.sourceKey}:${draft.draftType}`, draft.mappedExistingId);
          continue;
        }
        pushLog(`Creating category ${draft.draftName}...`);
        const created = await createCategory(apiClient, {
          name: draft.draftName,
          type: draft.draftType as Category["type"]
        });
        categoryIdsByKey.set(`${draft.sourceKey}:${draft.draftType}`, created.id);
        pushLog(`Creating category ${draft.draftName}... ✅`);
      }

      const items = buildTransactionImportItems(
        parseResult.validRows,
        accountIdsByKey,
        new Map(Array.from(categoryIdsByKey.entries()).map(([key, value]) => [key.split(":")[0], value]))
      );

      if (items.length === 0) {
        throw new Error("No valid rows available to import");
      }

      pushLog(`Importing ${items.length} transactions...`);

      // Prefer async backend import job when available.
      let finalResult: TransactionImportResult | null = null;
      try {
        const accepted = await submitTransactionsImportJob(apiClient, { mode: "partial", items }, idempotencyKey());
        for (let attempt = 0; attempt < 180; attempt += 1) {
          const job = await getTransactionsImportJob(apiClient, accepted.job_id);
          if (job.status === "completed" && job.result) {
            finalResult = job.result;
            break;
          }
          if (job.status === "failed") {
            throw new Error(job.error_message ?? "Import job failed");
          }
          await new Promise((resolve) => {
            setTimeout(resolve, 750);
          });
        }
      } catch {
        // Backward compatibility fallback for environments without async import jobs.
        finalResult = await importTransactions(apiClient, { mode: "partial", items });
      }

      if (!finalResult) {
        throw new Error("Import did not complete in time");
      }

      pushLog(`Importing ${items.length} transactions... ✅`);
      return finalResult;
    },
    onSuccess: async (importResult) => {
      setRequestError(null);
      setResult(importResult);
      await invalidateTransactionsAnalyticsAndBudgets(queryClient);
    },
    onError: (error) => {
      setRequestError(error);
    }
  });

  function resetWizard() {
    setStep("upload");
    setSelectedFileName(null);
    setFormatError(null);
    setParseWarning(null);
    setParseResult(null);
    setAccountsToCreate([]);
    setCategoriesToCreate([]);
    setRequestError(null);
    setLogs([]);
    setResult(null);
  }

  async function handleFileSelect(file: File | null) {
    setFormatError(null);
    setParseWarning(null);
    setRequestError(null);
    setResult(null);

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFormatError("Only .csv files are supported");
      return;
    }
    if (file.size > LARGE_FILE_BYTES) {
      setParseWarning("Large file - parsing may be slow");
    }

    const text = await readFileText(file);
    try {
      const parsed = await parseCsvOffMainThread(text, existingAccounts, existingCategories);
      if (parsed.missingRequiredHeaders.length > 0) {
        setFormatError(`Missing required columns: ${parsed.missingRequiredHeaders.join(", ")}`);
        return;
      }
      setParseResult(parsed);
      setAccountsToCreate(parsed.newAccounts);
      setCategoriesToCreate(parsed.newCategories);
      setStep("preview");
    } catch (error) {
      setFormatError(error instanceof Error ? error.message : "Failed to parse CSV file");
    }
  }

  function updateAccounts(sourceKey: string, patch: Partial<EntityToCreate>) {
    setAccountsToCreate((prev) => prev.map((entry) => (entry.sourceKey === sourceKey ? { ...entry, ...patch } : entry)));
  }

  function updateCategories(sourceKey: string, patch: Partial<EntityToCreate>) {
    setCategoriesToCreate((prev) => prev.map((entry) => (entry.sourceKey === sourceKey ? { ...entry, ...patch } : entry)));
  }

  return (
    <section className="space-y-4">
      <PageHeader
        title="Import transactions"
        description="Upload CSV template, preview mappings, and import valid rows with progress visibility."
        actions={(
          <Button asChild type="button" variant="outline" className="w-full sm:w-auto">
            <Link to="/app/transactions">Back to transactions</Link>
          </Button>
        )}
      />

      {step === "upload" ? (
        <ImportUploadStep
          fileName={selectedFileName}
          formatError={formatError}
          parseWarning={parseWarning}
          onFileSelect={(file) => {
            void handleFileSelect(file);
          }}
        />
      ) : null}

      {step === "preview" && parseResult ? (
        <ImportPreviewStep
          parsed={parseResult}
          accountsToCreate={accountsToCreate}
          categoriesToCreate={categoriesToCreate}
          existingAccounts={existingAccounts}
          existingCategories={existingCategories}
          onEditAccount={updateAccounts}
          onEditCategory={updateCategories}
          onUploadDifferent={resetWizard}
          onConfirm={() => setStep("execute")}
          isConfirmDisabled={parseResult.validCount === 0}
        />
      ) : null}

      {step === "execute" ? (
        <ImportExecuteStep
          logs={logs}
          isRunning={executionMutation.isPending}
          result={result}
          requestError={requestError}
          onRun={() => {
            void executionMutation.mutateAsync().catch(() => undefined);
          }}
          onRetry={() => {
            void executionMutation.mutateAsync().catch(() => undefined);
          }}
        />
      ) : null}

      {step !== "upload" ? (
        <div>
          <Button type="button" variant="ghost" onClick={resetWizard}>
            Start over
          </Button>
        </div>
      ) : null}
    </section>
  );
}
