import { describe, expect, it, vi } from "vitest";

import type { Account, Category } from "@/api/types";
import { parseTemplateCsv } from "@/lib/templateCsvParser";

vi.mock("@/lib/templateCsvParser", () => ({
  parseTemplateCsv: vi.fn()
}));

describe("templateCsvParser.worker", () => {
  it("posts success payload when parsing succeeds", async () => {
    const postMessageSpy = vi.fn();
    Object.defineProperty(self, "postMessage", {
      value: postMessageSpy,
      configurable: true
    });

    vi.mocked(parseTemplateCsv).mockReturnValueOnce({
      missingRequiredHeaders: [],
      allRows: [],
      validRows: [],
      newAccounts: [],
      newCategories: [],
      validCount: 1,
      errorCount: 0,
      warningCount: 0
    });

    await import("@/lib/templateCsvParser.worker");

    const event = {
      data: {
        csvText: "date,type,account,category,amount\\n2026-01-01,expense,Cash,Food,1000",
        accounts: [] as Account[],
        categories: [] as Category[],
        currencyCode: "COP"
      }
    } as MessageEvent;

    self.onmessage?.(event as MessageEvent<unknown>);

    expect(parseTemplateCsv).toHaveBeenCalledWith(
      event.data.csvText,
      event.data.accounts,
      event.data.categories,
      "COP"
    );
    expect(postMessageSpy).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true })
    );
  });

  it("posts error payload when parser throws", async () => {
    const postMessageSpy = vi.fn();
    Object.defineProperty(self, "postMessage", {
      value: postMessageSpy,
      configurable: true
    });

    vi.mocked(parseTemplateCsv).mockImplementationOnce(() => {
      throw new Error("boom");
    });

    await import("@/lib/templateCsvParser.worker");

    self.onmessage?.({
      data: {
        csvText: "bad",
        accounts: [] as Account[],
        categories: [] as Category[],
        currencyCode: "USD"
      }
    } as MessageEvent<unknown>);

    expect(postMessageSpy).toHaveBeenCalledWith({ ok: false, message: "boom" });
  });

  it("uses default error message for non-Error throws", async () => {
    const postMessageSpy = vi.fn();
    Object.defineProperty(self, "postMessage", {
      value: postMessageSpy,
      configurable: true
    });

    vi.mocked(parseTemplateCsv).mockImplementationOnce(() => {
      throw "unexpected";
    });

    await import("@/lib/templateCsvParser.worker");

    self.onmessage?.({
      data: {
        csvText: "bad",
        accounts: [] as Account[],
        categories: [] as Category[],
        currencyCode: "USD"
      }
    } as MessageEvent<unknown>);

    expect(postMessageSpy).toHaveBeenCalledWith({ ok: false, message: "Failed to parse CSV" });
  });
});
