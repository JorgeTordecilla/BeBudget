import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import StandaloneNavigationBridge from "@/components/pwa/StandaloneNavigationBridge";

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

function renderBridge(initialPath = "/start", preventBrowserNavigation = false) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <StandaloneNavigationBridge />
      <a
        href="/next"
        onClick={(event) => {
          if (preventBrowserNavigation) {
            event.preventDefault();
          }
        }}
      >
        Go next
      </a>
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("StandaloneNavigationBridge", () => {
  it("navigates internal links in standalone display mode", () => {
    Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;

    renderBridge();
    expect(screen.getByTestId("location")).toHaveTextContent("/start");

    fireEvent.click(screen.getByRole("link", { name: "Go next" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/next");
  });

  it("ignores navigation when not in standalone mode", () => {
    Object.defineProperty(navigator, "standalone", { configurable: true, value: false });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia;

    renderBridge(undefined, true);
    fireEvent.click(screen.getByRole("link", { name: "Go next" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/start");
  });

  it("does not hijack modified clicks", () => {
    Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

    renderBridge(undefined, true);
    fireEvent.click(screen.getByRole("link", { name: "Go next" }), { ctrlKey: true });

    expect(screen.getByTestId("location")).toHaveTextContent("/start");
  });
});
