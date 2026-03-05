import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppBadgeSync from "@/components/pwa/AppBadgeSync";

const useAuthMock = vi.fn();
const useMonthlyStatusMock = vi.fn();
const useAppBadgeMock = vi.fn();

vi.mock("@/auth/useAuth", () => ({
  useAuth: () => useAuthMock()
}));

vi.mock("@/features/analytics/analyticsQueries", () => ({
  useBillMonthlyStatus: (...args: unknown[]) => useMonthlyStatusMock(...args)
}));

vi.mock("@/hooks/useAppBadge", () => ({
  useAppBadge: (count: number) => useAppBadgeMock(count)
}));

describe("AppBadgeSync", () => {
  it("publishes pending + overdue count to app badge hook", () => {
    useAuthMock.mockReturnValue({
      apiClient: { request: vi.fn() }
    });
    useMonthlyStatusMock.mockReturnValue({
      data: {
        summary: { pending_count: 2 },
        items: [
          { status: "pending" },
          { status: "overdue" },
          { status: "overdue" }
        ]
      }
    });

    render(<AppBadgeSync />);
    expect(useAppBadgeMock).toHaveBeenCalledWith(4);
  });
});
