import { describe, expect, it } from "vitest";

import { computeMedianCents, detectSpendingSpikes } from "@/features/dashboard/spikes";
import type { Transaction } from "@/api/types";

function makeExpense(id: string, amount: number): Transaction {
  return {
    id,
    type: "expense",
    account_id: "a1",
    category_id: "c1",
    amount_cents: amount,
    date: "2026-02-01",
    merchant: "Shop",
    note: null,
    archived_at: null,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z"
  };
}

function makeCategoryExpense(id: string, categoryId: string, amount: number): Transaction {
  return { ...makeExpense(id, amount), category_id: categoryId };
}

describe("dashboard spikes", () => {
  it("computes odd-sized median", () => {
    const rows = [makeExpense("1", 100), makeExpense("2", 300), makeExpense("3", 200)];
    expect(computeMedianCents(rows)).toBe(200);
  });

  it("computes even-sized median using rounded midpoint", () => {
    const rows = [makeExpense("1", 100), makeExpense("2", 300), makeExpense("3", 200), makeExpense("4", 401)];
    expect(computeMedianCents(rows)).toBe(250);
  });

  it("returns insufficientData when sample is below threshold", () => {
    const rows = [makeExpense("1", 1000), makeExpense("2", 2000)];
    const result = detectSpendingSpikes(rows, { minSampleSize: 3 });
    expect(result.insufficientData).toBe(true);
    expect(result.spikes).toEqual([]);
  });

  it("detects spikes using multiplier and minimum absolute threshold", () => {
    const rows = [
      makeExpense("1", 10000),
      makeExpense("2", 11000),
      makeExpense("3", 12000),
      makeExpense("4", 13000),
      makeExpense("5", 14000),
      makeExpense("6", 15000),
      makeExpense("7", 16000),
      makeExpense("8", 17000),
      makeExpense("9", 60000)
    ];
    const result = detectSpendingSpikes(rows, { minSpikeCents: 50000, minSampleSize: 8, multiplier: 3 });
    expect(result.insufficientData).toBe(false);
    expect(result.spikes.map((spike) => spike.id)).toEqual(["9"]);
    expect(result.spikes[0]?.severity).toBe("high");
  });

  it("detects category-aware robust spike and severity", () => {
    const rows = [
      makeCategoryExpense("1", "rent", 980000),
      makeCategoryExpense("2", "rent", 1000000),
      makeCategoryExpense("3", "rent", 1010000),
      makeCategoryExpense("4", "rent", 990000),
      makeCategoryExpense("5", "rent", 1005000),
      makeCategoryExpense("6", "rent", 995000),
      makeCategoryExpense("7", "rent", 1002000),
      makeCategoryExpense("8", "rent", 1001000),
      makeCategoryExpense("9", "rent", 1700000)
    ];
    const result = detectSpendingSpikes(rows, { minSampleSize: 8, minSpikeCents: 50000 });
    expect(result.insufficientData).toBe(false);
    expect(result.spikes.map((spike) => spike.id)).toEqual(["9"]);
    expect(result.spikes[0]?.severity).toBe("high");
  });

  it("falls back to global threshold when category sample is sparse", () => {
    const rows = [
      makeCategoryExpense("1", "food", 10000),
      makeCategoryExpense("2", "food", 11000),
      makeCategoryExpense("3", "fuel", 12000),
      makeCategoryExpense("4", "fuel", 13000),
      makeCategoryExpense("5", "rent", 14000),
      makeCategoryExpense("6", "rent", 15000),
      makeCategoryExpense("7", "misc", 16000),
      makeCategoryExpense("8", "misc", 17000),
      makeCategoryExpense("9", "once", 60000)
    ];
    const result = detectSpendingSpikes(rows, { minSampleSize: 8, minSpikeCents: 50000, multiplier: 3 });
    expect(result.insufficientData).toBe(false);
    expect(result.spikes.map((spike) => spike.id)).toEqual(["9"]);
  });

  it("handles zero-MAD category baseline deterministically", () => {
    const rows = [
      makeCategoryExpense("1", "flat", 100000),
      makeCategoryExpense("2", "flat", 100000),
      makeCategoryExpense("3", "flat", 100000),
      makeCategoryExpense("4", "flat", 100000),
      makeCategoryExpense("5", "flat", 100000),
      makeCategoryExpense("6", "flat", 100000),
      makeCategoryExpense("7", "flat", 100000),
      makeCategoryExpense("8", "flat", 100000),
      makeCategoryExpense("9", "flat", 300000)
    ];
    const result = detectSpendingSpikes(rows, { minSampleSize: 8, minSpikeCents: 50000 });
    expect(result.spikes.map((spike) => spike.id)).toEqual(["9"]);
  });
});
