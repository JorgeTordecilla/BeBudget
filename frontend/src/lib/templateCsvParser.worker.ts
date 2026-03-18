import type { Account, Category } from "@/api/types";
import { parseTemplateCsv } from "@/lib/templateCsvParser";

type ParseRequest = {
  csvText: string;
  accounts: Account[];
  categories: Category[];
  currencyCode: string;
};

self.onmessage = (event: MessageEvent<ParseRequest>) => {
  try {
    const { csvText, accounts, categories, currencyCode } = event.data;
    const result = parseTemplateCsv(csvText, accounts, categories, currencyCode);
    self.postMessage({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse CSV";
    self.postMessage({ ok: false, message });
  }
};
