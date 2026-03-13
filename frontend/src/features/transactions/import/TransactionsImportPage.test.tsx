import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ApiClient } from "@/api/client";
import { ApiProblemError } from "@/api/errors";
import type { Account, Category, TransactionImportJob } from "@/api/types";
import { createAccount, listAccounts } from "@/api/accounts";
import { createCategory, listCategories } from "@/api/categories";
import {
  getTransactionsImportJob,
  importTransactions,
  submitTransactionsImportJob
} from "@/api/transactions";
import { AuthContext } from "@/auth/AuthContext";
import TransactionsImportPage from "@/features/transactions/import/TransactionsImportPage";

vi.mock("@/api/accounts", () => ({
  listAccounts: vi.fn(),
  createAccount: vi.fn()
}));

vi.mock("@/api/categories", () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn()
}));

vi.mock("@/api/transactions", () => ({
  importTransactions: vi.fn(),
  submitTransactionsImportJob: vi.fn(),
  getTransactionsImportJob: vi.fn()
}));

const apiClientStub = {} as ApiClient;

const existingAccounts: Account[] = [
  { id: "acc-existing", name: "Cash", type: "cash", initial_balance_cents: 0, archived_at: null }
];

const existingCategories: Category[] = [
  { id: "cat-groceries", name: "Groceries", type: "expense", archived_at: null },
  { id: "cat-salary", name: "Salary", type: "income", archived_at: null }
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            apiClient: apiClientStub,
            user: { id: "u1", username: "demo", currency_code: "USD" },
            accessToken: "token",
            isAuthenticated: true,
            isBootstrapping: false,
            login: async () => undefined,
            register: async () => undefined,
            logout: async () => undefined,
            bootstrapSession: async () => true
          }}
        >
          <TransactionsImportPage />
        </AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

function getUploadInput(): HTMLInputElement {
  const input = document.getElementById("template-csv-file");
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("Upload input not found");
  }
  return input;
}

function uploadCsv(name: string, content: string, options?: { sizeOverride?: number }) {
  const file = new File([content], name, { type: "text/csv" });
  if (options?.sizeOverride) {
    Object.defineProperty(file, "size", { value: options.sizeOverride });
  }
  fireEvent.change(getUploadInput(), {
    target: { files: [file] }
  });
}

function uploadFile(name: string, content: string, type: string) {
  const file = new File([content], name, { type });
  fireEvent.change(getUploadInput(), {
    target: { files: [file] }
  });
}

async function waitForLookupsLoaded() {
  await waitFor(() => expect(listAccounts).toHaveBeenCalled());
  await waitFor(() => expect(listCategories).toHaveBeenCalled());
}

function mockCompletedJob(overrides?: Partial<TransactionImportJob>) {
  vi.mocked(getTransactionsImportJob).mockResolvedValue({
    job_id: "job-1",
    status: "completed",
    created_at: "2026-03-05T01:00:00Z",
    completed_at: "2026-03-05T01:00:01Z",
    result: {
      created_count: 1,
      failed_count: 0,
      failures: []
    },
    ...overrides
  });
}

describe("TransactionsImportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listAccounts).mockResolvedValue({ items: existingAccounts, next_cursor: null });
    vi.mocked(listCategories).mockResolvedValue({ items: existingCategories, next_cursor: null });
    vi.mocked(createAccount).mockResolvedValue({
      id: "acc-created",
      name: "Wallet",
      type: "bank",
      initial_balance_cents: 0,
      archived_at: null
    });
    vi.mocked(createCategory).mockResolvedValue({
      id: "cat-created",
      name: "Transport",
      type: "expense",
      archived_at: null
    });
    vi.mocked(submitTransactionsImportJob).mockResolvedValue({
      job_id: "job-1",
      status: "queued",
      idempotency_reused: false
    });
    mockCompletedJob();
    vi.mocked(importTransactions).mockResolvedValue({
      created_count: 1,
      failed_count: 0,
      failures: []
    });
  });

  it("blocks preview transition when required headers are missing", async () => {
    renderPage();
    await waitForLookupsLoaded();

    uploadCsv("missing.csv", ["date,type,account,category", "2026-01-15,expense,Cash,Groceries"].join("\n"));

    expect(await screen.findByText("Missing required columns: amount")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Step 1 - Upload CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Step 2 - Preview and resolve entities" })).not.toBeInTheDocument();
  });

  it("rejects non-csv files with deterministic validation message", async () => {
    renderPage();
    await waitForLookupsLoaded();

    uploadFile("invalid.txt", "not,csv,content", "text/plain");

    expect(await screen.findByText("Only .csv files are supported")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Step 1 - Upload CSV" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Step 2 - Preview and resolve entities" })).not.toBeInTheDocument();
  });

  it("warns for files larger than 2MB without blocking parsing", async () => {
    renderPage();
    await waitForLookupsLoaded();

    uploadCsv(
      "large.csv",
      ["date,type,account,category,amount", "2026-01-15,expense,Cash,Groceries,45000"].join("\n"),
      { sizeOverride: 2 * 1024 * 1024 + 1 }
    );

    expect(await screen.findByText("Large file - parsing may be slow")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Step 2 - Preview and resolve entities" })).toBeInTheDocument();
  });

  it("shows ambiguous category blocking diagnostics in preview", async () => {
    renderPage();
    await waitForLookupsLoaded();

    uploadCsv(
      "ambiguous.csv",
      [
        "date,type,account,category,amount",
        "2026-01-15,income,Cash,Other,50000",
        "2026-01-16,expense,Cash,Other,10000"
      ].join("\n")
    );

    expect(await screen.findByRole("heading", { name: "Step 2 - Preview and resolve entities" })).toBeInTheDocument();
    expect(screen.getAllByText(/appears as both income and expense/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Continue to execute" })).toBeDisabled();
  });

  it("submits only valid rows in partial mode", async () => {
    renderPage();
    await waitForLookupsLoaded();

    uploadCsv(
      "partial.csv",
      [
        "date,type,account,category,amount",
        "2026-01-15,expense,Cash,Groceries,45000",
        "2026-01-16,expense,Cash,Groceries,not-a-number"
      ].join("\n")
    );

    expect(await screen.findByRole("heading", { name: "Step 2 - Preview and resolve entities" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue to execute" }));
    fireEvent.click(screen.getByRole("button", { name: "Run import" }));

    await waitFor(() => expect(submitTransactionsImportJob).toHaveBeenCalledTimes(1));

    const [, payload] = vi.mocked(submitTransactionsImportJob).mock.calls[0];
    expect(payload.mode).toBe("partial");
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]?.account_id).toBe("acc-existing");
    expect(payload.items[0]?.category_id).toBe("cat-groceries");
  });

  it("supports entity edits before execution", async () => {
    renderPage();
    await waitForLookupsLoaded();

    uploadCsv(
      "edit-entity.csv",
      ["date,type,account,category,amount", "2026-01-15,expense,Wallet,Groceries,45000"].join("\n")
    );

    expect(await screen.findByRole("heading", { name: "Step 2 - Preview and resolve entities" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Accounts to create name wallet/i), {
      target: { value: "Wallet Edited" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Continue to execute" }));
    fireEvent.click(screen.getByRole("button", { name: "Run import" }));

    await waitFor(() => expect(submitTransactionsImportJob).toHaveBeenCalledTimes(1));
    expect(createAccount).toHaveBeenCalledWith(apiClientStub, {
      name: "Wallet Edited",
      type: "bank",
      initial_balance_cents: 0
    });
  });

  it("fails fast on account creation errors and allows retry without losing context", async () => {
    vi.mocked(createAccount).mockRejectedValueOnce(
      new ApiProblemError(
        {
          type: "https://api.bebudget.dev/problems/account-name-conflict",
          title: "Account name conflict",
          status: 409,
          detail: "Account already exists"
        },
        { httpStatus: 409, requestId: "req-1", retryAfter: null }
      )
    );

    renderPage();
    await waitForLookupsLoaded();

    uploadCsv(
      "new-account.csv",
      ["date,type,account,category,amount", "2026-01-15,expense,Wallet,Groceries,45000"].join("\n")
    );

    expect(await screen.findByRole("heading", { name: "Step 2 - Preview and resolve entities" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue to execute" }));
    fireEvent.click(screen.getByRole("button", { name: "Run import" }));

    await waitFor(() => expect(createAccount).toHaveBeenCalledTimes(1));
    expect(submitTransactionsImportJob).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(createAccount).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(submitTransactionsImportJob).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("heading", { name: "Step 3 - Execute import" })).toBeInTheDocument();
    expect(screen.getByText(/transactions imported successfully/)).toBeInTheDocument();
  });

  it("clears prior parse and execution state on upload different file", async () => {
    renderPage();
    await waitForLookupsLoaded();

    uploadCsv(
      "first.csv",
      ["date,type,account,category,amount", "2026-01-15,expense,Cash,Groceries,45000"].join("\n")
    );
    expect(await screen.findByRole("heading", { name: "Step 2 - Preview and resolve entities" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue to execute" }));
    fireEvent.click(screen.getByRole("button", { name: "Run import" }));
    expect(await screen.findByText(/transactions imported successfully/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start over" }));

    const uploadCard = screen.getByRole("heading", { name: "Step 1 - Upload CSV" }).closest("div");
    expect(uploadCard).not.toBeNull();
    expect(within(document.body).queryByText("1 transactions imported successfully.")).not.toBeInTheDocument();
  });

  it("renders back link to transactions", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "Back to transactions" })).toHaveAttribute("href", "/app/transactions");
  });
});

