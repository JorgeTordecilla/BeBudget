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

  it("does not hijack external or special-scheme links", () => {
    Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

    render(
      <MemoryRouter initialEntries={["/start"]}>
        <StandaloneNavigationBridge />
        <a href="https://example.com" onClick={(event) => event.preventDefault()}>External</a>
        <a href="mailto:test@example.com" onClick={(event) => event.preventDefault()}>Mail</a>
        <a href="tel:+573001112233" onClick={(event) => event.preventDefault()}>Tel</a>
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "External" }));
    fireEvent.click(screen.getByRole("link", { name: "Mail" }));
    fireEvent.click(screen.getByRole("link", { name: "Tel" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/start");
  });

  it("does not navigate when destination equals current location", () => {
    Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia;

    render(
      <MemoryRouter initialEntries={["/start"]}>
        <StandaloneNavigationBridge />
        <a href="/start">Same</a>
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("link", { name: "Same" }));
    expect(screen.getByTestId("location")).toHaveTextContent("/start");
  });
});
