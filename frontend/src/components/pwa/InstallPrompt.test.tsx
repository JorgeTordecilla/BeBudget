import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hookState = {
  canInstall: false,
  promptInstall: vi.fn()
};

vi.mock("@/hooks/useInstallPrompt", () => ({
  useInstallPrompt: () => hookState
}));

import InstallPrompt from "@/components/pwa/InstallPrompt";

const originalUserAgent = navigator.userAgent;
const DEFER_KEY = "pwa_install_prompt_defer_until";

function setUserAgent(value: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value
  });
}

describe("InstallPrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    hookState.canInstall = false;
    hookState.promptInstall.mockResolvedValue("accepted");
    setUserAgent(originalUserAgent);
    Object.defineProperty(window.navigator, "standalone", { configurable: true, value: false });
  });

  it("does not render when install prompt is unavailable", () => {
    render(<InstallPrompt />);
    expect(screen.queryByRole("banner", { name: "Install BeBudget" })).not.toBeInTheDocument();
  });

  it("renders when install prompt is available", () => {
    hookState.canInstall = true;
    render(<InstallPrompt />);
    expect(screen.getByRole("banner", { name: "Install BeBudget" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not now" })).toBeInTheDocument();
  });

  it("does not render when deferred period is active", () => {
    hookState.canInstall = true;
    localStorage.setItem(DEFER_KEY, String(Date.now() + 60_000));
    render(<InstallPrompt />);
    expect(screen.queryByRole("banner", { name: "Install BeBudget" })).not.toBeInTheDocument();
  });

  it("dismisses and stores a deferred timestamp when user clicks Not now", () => {
    hookState.canInstall = true;
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(screen.queryByRole("banner", { name: "Install BeBudget" })).not.toBeInTheDocument();
    const stored = Number.parseInt(localStorage.getItem(DEFER_KEY) ?? "0", 10);
    expect(stored).toBeGreaterThan(Date.now());
  });

  it("calls promptInstall and hides banner on Install click", async () => {
    hookState.canInstall = true;
    render(<InstallPrompt />);

    fireEvent.click(screen.getByRole("button", { name: "Install" }));

    await waitFor(() => {
      expect(hookState.promptInstall).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole("banner", { name: "Install BeBudget" })).not.toBeInTheDocument();
  });

  it("renders iOS fallback instructions when browser install prompt is unavailable", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");

    render(<InstallPrompt />);

    expect(screen.getByRole("banner", { name: "Install BeBudget" })).toBeInTheDocument();
    expect(screen.getByText("On iPhone: tap Share, then Add to Home Screen.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Install" })).not.toBeInTheDocument();
  });

  it("does not render iOS fallback when already in standalone mode", () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
    Object.defineProperty(window.navigator, "standalone", { configurable: true, value: true });

    render(<InstallPrompt />);

    expect(screen.queryByRole("banner", { name: "Install BeBudget" })).not.toBeInTheDocument();
  });
});
