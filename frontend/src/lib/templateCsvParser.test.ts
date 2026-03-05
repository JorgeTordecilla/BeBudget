import { describe, expect, it } from "vitest";

import type { Account, Category } from "@/api/types";
import { parseTemplateCsv } from "@/lib/templateCsvParser";

const accounts: Account[] = [
  {
    id: "acc-existing",
    name: "Cash",
    type: "cash",
    initial_balance_cents: 0,
    archived_at: null
  }
];

const categories: Category[] = [
  { id: "cat-income", name: "Salary", type: "income", archived_at: null },
  { id: "cat-expense", name: "Groceries", type: "expense", archived_at: null }
];

describe("templateCsvParser", () => {
  it("detects headers case-insensitively and ignores unknown headers", () => {
    const csv = [
      "Date,TYPE,Account,Category,Amount,Random",
      "2026-01-15,Expense,Cash,Groceries,45000,foo"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.missingRequiredHeaders).toEqual([]);
    expect(result.validCount).toBe(1);
  });

  it("fails when required headers are missing", () => {
    const csv = ["date,type,account,category", "2026-01-15,expense,Cash,Groceries"].join("\n");
    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.missingRequiredHeaders).toEqual(["amount"]);
    expect(result.validCount).toBe(0);
  });

  it("parses amount variants and flags invalid amounts", () => {
    const csv = [
      "date,type,account,category,amount",
      "2026-01-15,expense,Cash,Groceries,45000",
      "2026-01-15,expense,Cash,Groceries,\"45,000\"",
      "2026-01-15,expense,Cash,Groceries,$45.000",
      "2026-01-15,expense,Cash,Groceries,\"45.000,50\"",
      "2026-01-15,expense,Cash,Groceries,abc"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(4);
    expect(result.errorCount).toBe(1);
  });

  it("parses date variants and marks invalid dates", () => {
    const csv = [
      "date,type,account,category,amount",
      "2026-01-15,expense,Cash,Groceries,45000",
      "15/01/2026,expense,Cash,Groceries,45000",
      "Jan 15 2026,expense,Cash,Groceries,45000",
      "15-Jan-2026,expense,Cash,Groceries,45000",
      "not-a-date,expense,Cash,Groceries,45000"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(4);
    expect(result.errorCount).toBe(1);
  });

  it("normalizes mood aliases and warns for unknown mood", () => {
    const csv = [
      "date,type,account,category,amount,mood",
      "2026-01-15,expense,Cash,Groceries,45000,😊",
      "2026-01-15,expense,Cash,Groceries,45000,happy",
      "2026-01-15,expense,Cash,Groceries,45000,excited"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(3);
    expect(result.warningCount).toBe(1);
  });

  it("normalizes impulse variants", () => {
    const csv = [
      "date,type,account,category,amount,is_impulse",
      "2026-01-15,expense,Cash,Groceries,45000,true",
      "2026-01-15,expense,Cash,Groceries,45000,intentional",
      "2026-01-15,expense,Cash,Groceries,45000,"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(3);
    expect(result.errorCount).toBe(0);
    expect(result.validRows[0]?.is_impulse).toBe(true);
    expect(result.validRows[1]?.is_impulse).toBe(false);
    expect(result.validRows[2]?.is_impulse).toBeUndefined();
  });

  it("resolves entities case-insensitively and detects ambiguous categories", () => {
    const csv = [
      "date,type,account,category,amount",
      "2026-01-15,expense,cash,groceries,45000",
      "2026-01-16,income,Cash,Other,30000",
      "2026-01-17,expense,Cash,Other,20000"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(1);
    expect(result.errorCount).toBe(2);
    expect(result.newCategories.find((entry) => entry.draftName.toLowerCase() === "other")).toBeUndefined();
  });

  it("classifies missing account/category as new", () => {
    const csv = [
      "date,type,account,category,amount",
      "2026-01-15,expense, Bancolombia ,Household,45000"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(1);
    expect(result.newAccounts).toHaveLength(1);
    expect(result.newCategories).toHaveLength(1);
    expect(result.newAccounts[0]?.draftType).toBe("bank");
    expect(result.newCategories[0]?.draftType).toBe("expense");
  });

  it("marks missing account/category values as blocking row errors", () => {
    const csv = [
      "date,type,account,category,amount",
      "2026-01-15,expense,,,45000"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(0);
    expect(result.errorCount).toBe(1);
    expect(result.allRows[0]?.errors.some((entry) => entry.message === "Account is required")).toBe(true);
    expect(result.allRows[0]?.errors.some((entry) => entry.message === "Category is required")).toBe(true);
  });

  it("returns category inference error when row type is invalid for a new category", () => {
    const csv = [
      "date,type,account,category,amount",
      "2026-01-15,transfer,Cash,Other,45000"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(0);
    expect(result.errorCount).toBe(1);
    expect(
      result.allRows[0]?.errors.some((entry) =>
        entry.message === "Category type cannot be inferred without a valid row type"
      )
    ).toBe(true);
  });

  it("includes merchant, note, mood, and impulse fields when normalized values are valid", () => {
    const csv = [
      "date,type,account,category,amount,merchant,note,mood,is_impulse",
      "2026-01-15,expense,Cash,Groceries,45000,Store A,Weekly shop,happy,yes"
    ].join("\n");

    const result = parseTemplateCsv(csv, accounts, categories);

    expect(result.validCount).toBe(1);
    expect(result.validRows[0]).toMatchObject({
      merchant: "Store A",
      note: "Weekly shop",
      mood: "happy",
      is_impulse: true
    });
  });
});
