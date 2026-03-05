import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { clearAppBadgeIfSupported, useAppBadge } from "@/hooks/useAppBadge";

describe("useAppBadge", () => {
  it("sets app badge when count is positive", async () => {
    const setBadge = vi.fn(async () => undefined);
    const clearBadge = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "setAppBadge", { configurable: true, value: setBadge });
    Object.defineProperty(navigator, "clearAppBadge", { configurable: true, value: clearBadge });

    renderHook(() => useAppBadge(3));

    await waitFor(() => {
      expect(setBadge).toHaveBeenCalledWith(3);
    });
    expect(clearBadge).not.toHaveBeenCalled();
  });

  it("clears app badge when count is zero", async () => {
    const setBadge = vi.fn(async () => undefined);
    const clearBadge = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "setAppBadge", { configurable: true, value: setBadge });
    Object.defineProperty(navigator, "clearAppBadge", { configurable: true, value: clearBadge });

    renderHook(() => useAppBadge(0));

    await waitFor(() => {
      expect(clearBadge).toHaveBeenCalledTimes(1);
    });
    expect(setBadge).not.toHaveBeenCalled();
  });

  it("clear helper no-ops when unsupported", async () => {
    Object.defineProperty(navigator, "clearAppBadge", { configurable: true, value: undefined });
    await expect(clearAppBadgeIfSupported()).resolves.toBeUndefined();
  });
});
