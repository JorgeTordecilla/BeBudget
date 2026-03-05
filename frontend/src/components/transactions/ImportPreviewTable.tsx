import { useMemo, useState } from "react";

import type { ParsedRow } from "@/lib/templateCsvParser";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";

type ImportPreviewTableProps = {
  rows: ParsedRow[];
};

const WINDOWING_THRESHOLD = 200;
const ROW_HEIGHT_PX = 44;
const VIEWPORT_HEIGHT_PX = 480;
const OVERSCAN_ROWS = 12;

export default function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const useWindowing = rows.length >= WINDOWING_THRESHOLD;

  const { visibleRows, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
    if (!useWindowing) {
      return { visibleRows: rows, topSpacerHeight: 0, bottomSpacerHeight: 0 };
    }

    const visibleCount = Math.ceil(VIEWPORT_HEIGHT_PX / ROW_HEIGHT_PX);
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT_PX) - OVERSCAN_ROWS);
    const endIndex = Math.min(rows.length, startIndex + visibleCount + OVERSCAN_ROWS * 2);
    const top = startIndex * ROW_HEIGHT_PX;
    const bottom = Math.max(0, (rows.length - endIndex) * ROW_HEIGHT_PX);
    return {
      visibleRows: rows.slice(startIndex, endIndex),
      topSpacerHeight: top,
      bottomSpacerHeight: bottom
    };
  }, [rows, scrollTop, useWindowing]);

  return (
    <div
      className="overflow-x-auto"
      style={useWindowing ? { maxHeight: `${VIEWPORT_HEIGHT_PX}px`, overflowY: "auto" } : undefined}
      onScroll={useWindowing ? (event) => setScrollTop(event.currentTarget.scrollTop) : undefined}
    >
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead>Row</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Messages</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topSpacerHeight > 0 ? (
            <TableRow aria-hidden="true">
              <TableCell colSpan={8} style={{ height: `${topSpacerHeight}px`, padding: 0 }} />
            </TableRow>
          ) : null}
          {visibleRows.map((row) => (
            <TableRow key={row.rowIndex}>
              <TableCell>{row.rowIndex + 1}</TableCell>
              <TableCell>{row.status === "valid" ? "ready" : "error"}</TableCell>
              <TableCell>{row.normalized.date ?? row.original.date ?? "-"}</TableCell>
              <TableCell>{row.normalized.type ?? row.original.type ?? "-"}</TableCell>
              <TableCell>{row.original.account ?? "-"}</TableCell>
              <TableCell>{row.original.category ?? "-"}</TableCell>
              <TableCell>{row.normalized.amount_cents ?? row.original.amount ?? "-"}</TableCell>
              <TableCell>
                {row.errors.map((entry) => (
                  <p key={`e-${entry.field}-${entry.message}`} className="text-xs text-destructive">
                    {entry.field}: {entry.message}
                  </p>
                ))}
                {row.warnings.map((entry) => (
                  <p key={`w-${entry.field}-${entry.message}`} className="text-xs text-amber-700">
                    {entry.field}: {entry.message}
                  </p>
                ))}
                {row.errors.length === 0 && row.warnings.length === 0 ? <span className="text-xs">-</span> : null}
              </TableCell>
            </TableRow>
          ))}
          {bottomSpacerHeight > 0 ? (
            <TableRow aria-hidden="true">
              <TableCell colSpan={8} style={{ height: `${bottomSpacerHeight}px`, padding: 0 }} />
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
