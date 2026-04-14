import type { QueryClient } from "@tanstack/react-query";

export async function invalidateOptionFamilies(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ["accounts"] });
  await queryClient.invalidateQueries({ queryKey: ["categories"] });
  await queryClient.invalidateQueries({ queryKey: ["income-sources"] });
}

export async function invalidateTransactionsAndAnalytics(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ["transactions"] });
  await queryClient.invalidateQueries({ queryKey: ["analytics"] });
}

export async function invalidateTransactionsAnalyticsDashboard(queryClient: QueryClient): Promise<void> {
  await invalidateTransactionsAndAnalytics(queryClient);
  await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export async function invalidateTransactionsAnalyticsAndBudgets(queryClient: QueryClient): Promise<void> {
  await invalidateTransactionsAndAnalytics(queryClient);
  await queryClient.invalidateQueries({ queryKey: ["budgets"] });
}

export async function invalidateAccountMutationDependencies(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ["accounts"] });
  await queryClient.invalidateQueries({ queryKey: ["categories"] });
  await invalidateTransactionsAnalyticsDashboard(queryClient);
}

export async function invalidateCategoryMutationDependencies(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ["categories"] });
  await queryClient.invalidateQueries({ queryKey: ["budgets"] });
  await invalidateTransactionsAnalyticsDashboard(queryClient);
}

export async function invalidateIncomeSourceMutationDependencies(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: ["income-sources"] });
  await queryClient.invalidateQueries({ queryKey: ["analytics"] });
}

export async function invalidateImportExecutionDependencies(queryClient: QueryClient): Promise<void> {
  await invalidateTransactionsAnalyticsAndBudgets(queryClient);
  await invalidateOptionFamilies(queryClient);
}
