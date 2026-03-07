import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

type MockInstallEvent = Event & {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function createInstallEvent(outcome: "accepted" | "dismissed"): MockInstallEvent {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as MockInstallEvent;
  event.prompt = vi.fn(async () => undefined);
  event.userChoice = Promise.resolve({ outcome });
  return event;
}

describe("useInstallPrompt", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "standalone", { configurable: true, value: false });
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }) as unknown as typeof window.matchMedia;
  });

  it("captures beforeinstallprompt and resolves accepted flow", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const installEvent = createInstallEvent("accepted");
    const preventDefaultSpy = vi.spyOn(installEvent, "preventDefault");

    act(() => {
      window.dispatchEvent(installEvent);
    });

    await waitFor(() => expect(result.current.canInstall).toBe(true));
    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);

    let outcome: "accepted" | "dismissed" | "unavailable" = "unavailable";
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe("accepted");
    expect(installEvent.prompt).toHaveBeenCalledTimes(1);
    expect(result.current.canInstall).toBe(false);
  });

  it("returns dismissed when user dismisses browser prompt", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const installEvent = createInstallEvent("dismissed");

    act(() => {
      window.dispatchEvent(installEvent);
    });

    await waitFor(() => expect(result.current.canInstall).toBe(true));

    let outcome: "accepted" | "dismissed" | "unavailable" = "unavailable";
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe("dismissed");
    expect(result.current.canInstall).toBe(false);
  });

  it("keeps canInstall false in standalone mode", async () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useInstallPrompt());
    const installEvent = createInstallEvent("accepted");

    act(() => {
      window.dispatchEvent(installEvent);
    });

    await waitFor(() => expect(result.current.canInstall).toBe(false));

    let outcome: "accepted" | "dismissed" | "unavailable" = "accepted";
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe("unavailable");
    expect(installEvent.prompt).not.toHaveBeenCalled();
  });

  it("returns unavailable when no deferred prompt exists", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    let outcome: "accepted" | "dismissed" | "unavailable" = "accepted";
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe("unavailable");
    expect(result.current.canInstall).toBe(false);
  });

  it("clears install availability after appinstalled event", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const installEvent = createInstallEvent("accepted");

    act(() => {
      window.dispatchEvent(installEvent);
    });
    await waitFor(() => expect(result.current.canInstall).toBe(true));

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    await waitFor(() => expect(result.current.canInstall).toBe(false));
  });

  it("uses legacy media-query listeners when addEventListener is unavailable", () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addListener,
      removeListener
    }) as unknown as typeof window.matchMedia;

    const { unmount } = renderHook(() => useInstallPrompt());
    expect(addListener).toHaveBeenCalledTimes(1);
    unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it("returns unavailable when browser prompt throws", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const installEvent = createInstallEvent("accepted");
    installEvent.prompt.mockRejectedValue(new Error("prompt_failed"));

    act(() => {
      window.dispatchEvent(installEvent);
    });
    await waitFor(() => expect(result.current.canInstall).toBe(true));

    let outcome: "accepted" | "dismissed" | "unavailable" = "accepted";
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(outcome).toBe("unavailable");
    expect(result.current.canInstall).toBe(false);
  });

  it("clears deferred install event when display-mode changes to standalone", async () => {
    let matches = false;
    let onChange: (() => void) | null = null;
    window.matchMedia = vi.fn().mockImplementation(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_event: string, handler: () => void) => {
        onChange = handler;
      },
      removeEventListener: vi.fn()
    })) as unknown as typeof window.matchMedia;

    const { result } = renderHook(() => useInstallPrompt());
    const installEvent = createInstallEvent("accepted");

    act(() => {
      window.dispatchEvent(installEvent);
    });
    await waitFor(() => expect(result.current.canInstall).toBe(true));

    act(() => {
      matches = true;
      onChange?.();
    });

    await waitFor(() => expect(result.current.canInstall).toBe(false));
  });

  it("does not register media listeners when matchMedia is unavailable", () => {
    const originalMatchMedia = window.matchMedia;
    // Cover legacy browser path where display-mode media query API is absent.
    Reflect.deleteProperty(window, "matchMedia");
    try {
      expect(() => renderHook(() => useInstallPrompt())).not.toThrow();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
