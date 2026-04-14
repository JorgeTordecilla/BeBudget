import { describe, expect, it, vi } from "vitest";

import {
  invalidateAccountMutationDependencies,
  invalidateCategoryMutationDependencies,
  invalidateImportExecutionDependencies,
  invalidateIncomeSourceMutationDependencies,
  invalidateOptionFamilies,
  invalidateTransactionsAnalyticsDashboard,
  invalidateTransactionsAnalyticsAndBudgets,
  invalidateTransactionsAndAnalytics
} from "@/features/transactions/transactionCache";

describe("transaction cache invalidation", () => {
  it("invalidates only transactions and analytics for regular transaction flows", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateTransactionsAndAnalytics(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["analytics"] });
    expect(invalidateQueries).not.toHaveBeenCalledWith({ queryKey: ["budgets"] });
  });

  it("invalidates budgets in addition to transactions and analytics for import flows", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateTransactionsAnalyticsAndBudgets(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["analytics"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["budgets"] });
  });

  it("invalidates entity option query families", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateOptionFamilies(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["accounts"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["income-sources"] });
  });

  it("invalidates transactions, analytics, and dashboard for dashboard-coupled transaction flows", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateTransactionsAnalyticsDashboard(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["analytics"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });

  it("invalidates account dependencies including side effects", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateAccountMutationDependencies(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["accounts"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["analytics"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });

  it("invalidates category dependencies for downstream consumers", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateCategoryMutationDependencies(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["budgets"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["analytics"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });

  it("invalidates income-source dependencies for option freshness and analytics", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateIncomeSourceMutationDependencies(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(2);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["income-sources"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["analytics"] });
  });

  it("invalidates import dependencies including option families", async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined);
    const queryClient = { invalidateQueries } as never;

    await invalidateImportExecutionDependencies(queryClient);

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["analytics"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["budgets"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["accounts"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["income-sources"] });
  });
});
