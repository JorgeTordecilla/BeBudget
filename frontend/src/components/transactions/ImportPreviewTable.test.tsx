import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ImportPreviewTable from "@/components/transactions/ImportPreviewTable";
import type { ParsedRow } from "@/lib/templateCsvParser";

function makeRow(rowIndex: number): ParsedRow {
  return {
    rowIndex,
    original: {
      date: "2026-01-01",
      type: "expense",
      account: "Cash",
      category: "Food",
      amount: "1200"
    },
    normalized: {
      date: "2026-01-01",
      type: "expense",
      amount_cents: 1200
    },
    errors: [],
    warnings: [],
    status: "valid",
    accountKey: "cash",
    categoryKey: "food"
  };
}

describe("ImportPreviewTable", () => {
  it("renders all rows without windowing for small datasets", () => {
    const rows = Array.from({ length: 5 }, (_, index) => makeRow(index));

    render(<ImportPreviewTable rows={rows} />);

    expect(screen.getByText("Row")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("uses windowing behavior for large datasets", () => {
    const rows = Array.from({ length: 260 }, (_, index) => makeRow(index));

    const { container } = render(<ImportPreviewTable rows={rows} />);

    const scroller = container.querySelector(".overflow-x-auto") as HTMLElement;
    expect(scroller).toBeTruthy();
    expect(scroller.style.maxHeight).toBe("480px");

    fireEvent.scroll(scroller, { target: { scrollTop: 2200 } });

    const spacerCells = container.querySelectorAll("tbody tr[aria-hidden='true'] td");
    expect(spacerCells.length).toBeGreaterThan(0);
  });
});
