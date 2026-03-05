import { afterEach, describe, expect, it, vi } from "vitest";

import { copyToClipboard } from "@/utils/clipboard";

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false for empty text without calling clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    await expect(copyToClipboard("")).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("returns true when clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    await expect(copyToClipboard("support-code-123")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("support-code-123");
  });

  it("returns false when clipboard write throws", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    await expect(copyToClipboard("support-code-123")).resolves.toBe(false);
    expect(writeText).toHaveBeenCalledWith("support-code-123");
  });
});
