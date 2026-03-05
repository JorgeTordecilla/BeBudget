import type { ApiClient } from "@/api/client";
import { useAuth } from "@/auth/useAuth";
import { useBillMonthlyStatus } from "@/features/analytics/analyticsQueries";
import { useAppBadge } from "@/hooks/useAppBadge";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function AppBadgeSync() {
  const { apiClient } = useAuth();
  const month = currentMonth();
  const hasClient = typeof (apiClient as Partial<ApiClient>).request === "function";
  const monthlyStatus = useBillMonthlyStatus(apiClient, month, hasClient);
  const pendingCount = monthlyStatus.data?.summary.pending_count ?? 0;
  const overdueCount = monthlyStatus.data?.items.filter((item) => item.status === "overdue").length ?? 0;

  useAppBadge(pendingCount + overdueCount);
  return null;
}
