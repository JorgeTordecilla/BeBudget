import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const updateServiceWorker = vi.fn();
const hookState = {
  needRefresh: [false, vi.fn()],
  offlineReady: [false, vi.fn()]
};

vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    needRefresh: hookState.needRefresh,
    offlineReady: hookState.offlineReady,
    updateServiceWorker
  })
}));

import PWAUpdatePrompt from "@/components/pwa/PWAUpdatePrompt";

describe("PWAUpdatePrompt", () => {
  it("does not render when no update is available", () => {
    hookState.needRefresh = [false, vi.fn()];
    render(<PWAUpdatePrompt />);
    expect(screen.queryByText("Nueva version disponible")).not.toBeInTheDocument();
  });

  it("renders and triggers service worker update action", () => {
    hookState.needRefresh = [true, vi.fn()];
    render(<PWAUpdatePrompt />);
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });
});
