import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

Object.defineProperty(navigator, "serviceWorker", {
  configurable: true,
  writable: true,
  value: {
    register: () => Promise.resolve(),
    ready: Promise.resolve({})
  }
});

Object.defineProperty(navigator, "setAppBadge", {
  configurable: true,
  writable: true,
  value: () => Promise.resolve()
});

Object.defineProperty(navigator, "clearAppBadge", {
  configurable: true,
  writable: true,
  value: () => Promise.resolve()
});

afterEach(() => {
  cleanup();
});
