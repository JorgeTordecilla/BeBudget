import Papa from "papaparse";
import { resolveMinorUnits } from "@/utils/money";
import type {
  Account,
  AccountType,
  Category,
  CategoryType,
  TransactionCreate,
  TransactionMood,
  TransactionType
} from "@/api/types";

export type EntityResolution =
  | { status: "found"; id: string }
  | { status: "new"; name: string; inferredType: string }
  | { status: "ambiguous"; name: string; conflictingTypes: string[] };

export type ParsedRowStatus = "valid" | "error";

export type ParsedRowMessage = {
  field: string;
  message: string;
};

export type ParsedRow = {
  rowIndex: number;
  original: Record<string, string>;
  normalized: {
    date?: string;
    type?: TransactionType;
    amount_cents?: number;
    merchant?: string;
    note?: string;
    mood?: TransactionMood | null;
    is_impulse?: boolean | null;
  };
  accountResolution?: EntityResolution;
  categoryResolution?: EntityResolution;
  accountKey?: string;
  categoryKey?: string;
  errors: ParsedRowMessage[];
  warnings: ParsedRowMessage[];
  status: ParsedRowStatus;
};

export type EntityToCreate = {
  sourceKey: string;
  draftName: string;
  draftType: AccountType | CategoryType;
  mappedExistingId?: string;
};

export type ParsedValidRow = {
  rowIndex: number;
  type: TransactionType;
  amount_cents: number;
  date: string;
  merchant?: string;
  note?: string;
  mood?: TransactionMood;
  is_impulse?: boolean;
  accountKey: string;
  categoryKey: string;
};

export type ParsedImportResult = {
  missingRequiredHeaders: string[];
  validRows: ParsedValidRow[];
  allRows: ParsedRow[];
  newAccounts: EntityToCreate[];
  newCategories: EntityToCreate[];
  validCount: number;
  errorCount: number;
  warningCount: number;
};

const REQUIRED_HEADERS = ["date", "type", "account", "category", "amount"] as const;
const MOOD_ALIASES: Record<string, TransactionMood> = {
  happy: "happy",
  "😊": "happy",
  neutral: "neutral",
  "😐": "neutral",
  sad: "sad",
  "😢": "sad",
  anxious: "anxious",
  "😰": "anxious",
  bored: "bored",
  "😑": "bored"
};
const TRUE_VALUES = new Set(["true", "impulse", "yes", "1"]);
const FALSE_VALUES = new Set(["false", "intentional", "no", "0"]);

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day
  );
}

function toIsoDate(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateToIso(raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    return isValidDateParts(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    return isValidDateParts(year, month, day) ? toIsoDate(year, month, day) : null;
  }

  const ddMonYyyy = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (ddMonYyyy) {
    const day = Number(ddMonYyyy[1]);
    const monthName = ddMonYyyy[2];
    const year = Number(ddMonYyyy[3]);
    const date = new Date(`${monthName} ${day}, ${year} UTC`);
    if (!Number.isNaN(date.valueOf())) {
      const month = date.getUTCMonth() + 1;
      return isValidDateParts(year, month, day) ? toIsoDate(year, month, day) : null;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }
  return toIsoDate(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, parsed.getUTCDate());
}

function parseAmountToCents(raw: string, fractionDigits: number): number | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  const sanitized = value.replace(/[^\d,.-]/g, "");
  if (!sanitized || sanitized === "." || sanitized === "," || sanitized === "-") {
    return null;
  }

  const lastDot = sanitized.lastIndexOf(".");
  const lastComma = sanitized.lastIndexOf(",");
  let decimalSeparator = "";
  if (lastDot >= 0 && lastComma >= 0) {
    decimalSeparator = lastDot > lastComma ? "." : ",";
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? "." : ",";
    const sepIndex = sep === "." ? lastDot : lastComma;
    const decimals = sanitized.length - sepIndex - 1;
    if (decimals > 0) {
      if (fractionDigits === 0) {
        return null;
      }
      if (decimals <= fractionDigits) {
        decimalSeparator = sep;
      } else {
        return null;
      }
    }
  }

  let normalized: string;
  if (decimalSeparator) {
    const thousandsSeparator = decimalSeparator === "." ? "," : ".";
    normalized = sanitized
      .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
      .replace(decimalSeparator, ".");
  } else {
    normalized = sanitized.replace(/[.,]/g, "");
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return Math.round(amount * 10 ** fractionDigits);
}

function normalizeType(raw: string): TransactionType | null {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "income" || normalized === "expense") {
    return normalized;
  }
  return null;
}

function normalizeMood(raw: string): { mood: TransactionMood | null; warning: string | null } {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    return { mood: null, warning: null };
  }
  const mood = MOOD_ALIASES[normalized];
  if (!mood) {
    return {
      mood: null,
      warning: `Mood '${raw}' is not recognized and will be ignored.`
    };
  }
  return { mood, warning: null };
}

function normalizeImpulse(raw: string): boolean | null {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }
  if (FALSE_VALUES.has(normalized)) {
    return false;
  }
  return null;
}

type ParsedCsvText = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

function parseCsvText(rawCsvText: string): ParsedCsvText {
  const parsed: Papa.ParseResult<Record<string, string>> = Papa.parse(rawCsvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader
  });

  const headers = (parsed.meta.fields ?? []).map(normalizeHeader);
  const rows = parsed.data
    .map((row: Record<string, string>) => {
      const normalized: Record<string, string> = {};
      headers.forEach((header: string) => {
        const value = row[header] ?? "";
        normalized[header] = value;
      });
      return normalized;
    })
    .filter((row: Record<string, string>) => Object.values(row).some((value: string) => value.trim() !== ""));

  return { headers, rows };
}

export function buildTransactionImportItems(
  rows: ParsedValidRow[],
  accountIdsByKey: Map<string, string>,
  categoryIdsByKey: Map<string, string>
): TransactionCreate[] {
  const items: TransactionCreate[] = [];

  rows.forEach((row) => {
    const accountId = accountIdsByKey.get(row.accountKey);
    const categoryId = categoryIdsByKey.get(row.categoryKey);
    if (!accountId || !categoryId) {
      return;
    }

    const payload: TransactionCreate = {
      type: row.type,
      account_id: accountId,
      category_id: categoryId,
      amount_cents: row.amount_cents,
      date: row.date
    };
    if (row.merchant) {
      payload.merchant = row.merchant;
    }
    if (row.note) {
      payload.note = row.note;
    }
    if (row.mood) {
      payload.mood = row.mood;
    }
    if (typeof row.is_impulse === "boolean") {
      payload.is_impulse = row.is_impulse;
    }
    items.push(payload);
  });

  return items;
}

export function parseTemplateCsv(
  rawCsvText: string,
  accounts: Account[],
  categories: Category[],
  currencyCode = "USD"
): ParsedImportResult {
  const { rows, headers } = parseCsvText(rawCsvText);
  const availableHeaders = new Set(headers);
  const minorUnits = resolveMinorUnits(currencyCode);

  const missingRequiredHeaders = REQUIRED_HEADERS.filter((header) => !availableHeaders.has(header));
  if (missingRequiredHeaders.length > 0) {
    return {
      missingRequiredHeaders,
      allRows: [],
      validRows: [],
      newAccounts: [],
      newCategories: [],
      validCount: 0,
      errorCount: 0,
      warningCount: 0
    };
  }

  const accountByKey = new Map<string, Account>();
  accounts.forEach((account) => accountByKey.set(normalizeKey(account.name), account));

  const categoriesByKeyAndType = new Map<string, Category>();
  categories.forEach((category) => {
    categoriesByKeyAndType.set(`${normalizeKey(category.name)}:${category.type}`, category);
  });

  const categoryTypeUsage = new Map<string, Set<TransactionType>>();
  rows.forEach((row) => {
    const type = normalizeType(row.type ?? "");
    const categoryKey = normalizeKey(row.category ?? "");
    if (!type || !categoryKey) {
      return;
    }
    const set = categoryTypeUsage.get(categoryKey) ?? new Set<TransactionType>();
    set.add(type);
    categoryTypeUsage.set(categoryKey, set);
  });

  const parsedRows: ParsedRow[] = [];
  const validRows: ParsedValidRow[] = [];
  const newAccountsMap = new Map<string, EntityToCreate>();
  const newCategoriesMap = new Map<string, EntityToCreate>();
  let warningCount = 0;
  let errorCount = 0;

  rows.forEach((row, index) => {
    const parsed: ParsedRow = {
      rowIndex: index,
      original: row,
      normalized: {},
      errors: [],
      warnings: [],
      status: "valid"
    };

    const rawType = row.type ?? "";
    const rawDate = row.date ?? "";
    const rawAmount = row.amount ?? "";
    const rawAccount = row.account ?? "";
    const rawCategory = row.category ?? "";

    const type = normalizeType(rawType);
    if (!type) {
      parsed.errors.push({ field: "type", message: `Invalid type: '${rawType}'` });
    } else {
      parsed.normalized.type = type;
    }

    const parsedDate = parseDateToIso(rawDate);
    if (!parsedDate) {
      parsed.errors.push({ field: "date", message: `Invalid date: '${rawDate}'` });
    } else {
      parsed.normalized.date = parsedDate;
    }

    const amountCents = parseAmountToCents(rawAmount, minorUnits);
    if (!amountCents) {
      parsed.errors.push({ field: "amount", message: `Invalid amount: '${rawAmount}'` });
    } else {
      parsed.normalized.amount_cents = amountCents;
    }

    const accountKey = normalizeKey(rawAccount);
    if (!accountKey) {
      parsed.errors.push({ field: "account", message: "Account is required" });
    } else {
      parsed.accountKey = accountKey;
      const existingAccount = accountByKey.get(accountKey);
      if (existingAccount) {
        parsed.accountResolution = { status: "found", id: existingAccount.id };
      } else {
        parsed.accountResolution = { status: "new", name: rawAccount.trim(), inferredType: "bank" };
        if (!newAccountsMap.has(accountKey)) {
          newAccountsMap.set(accountKey, {
            sourceKey: accountKey,
            draftName: rawAccount.trim(),
            draftType: "bank"
          });
        }
      }
    }

    const categoryKey = normalizeKey(rawCategory);
    if (!categoryKey) {
      parsed.errors.push({ field: "category", message: "Category is required" });
    } else {
      parsed.categoryKey = categoryKey;
      const usage = categoryTypeUsage.get(categoryKey) ?? new Set<TransactionType>();
      if (usage.size > 1) {
        const conflictingTypes = Array.from(usage.values()).sort();
        parsed.categoryResolution = {
          status: "ambiguous",
          name: rawCategory.trim(),
          conflictingTypes
        };
        parsed.errors.push({
          field: "category",
          message: `Category '${rawCategory.trim()}' appears as both income and expense - rename one in your CSV`
        });
      } else {
        const inferredType = type ?? (Array.from(usage)[0] ?? null);
        if (!inferredType) {
          parsed.errors.push({ field: "category", message: "Category type cannot be inferred without a valid row type" });
        } else {
          const existingCategory = categoriesByKeyAndType.get(`${categoryKey}:${inferredType}`);
          if (existingCategory) {
            parsed.categoryResolution = { status: "found", id: existingCategory.id };
          } else {
            parsed.categoryResolution = {
              status: "new",
              name: rawCategory.trim(),
              inferredType
            };
            if (!newCategoriesMap.has(categoryKey)) {
              newCategoriesMap.set(categoryKey, {
                sourceKey: categoryKey,
                draftName: rawCategory.trim(),
                draftType: inferredType
              });
            }
          }
        }
      }
    }

    const merchant = (row.merchant ?? "").trim();
    if (merchant) {
      parsed.normalized.merchant = merchant;
    }
    const note = (row.note ?? "").trim();
    if (note) {
      parsed.normalized.note = note;
    }

    const mood = normalizeMood(row.mood ?? "");
    parsed.normalized.mood = mood.mood;
    if (mood.warning) {
      parsed.warnings.push({ field: "mood", message: mood.warning });
      warningCount += 1;
    }

    const impulse = normalizeImpulse(row.is_impulse ?? "");
    parsed.normalized.is_impulse = impulse;

    if (parsed.errors.length > 0) {
      parsed.status = "error";
      errorCount += 1;
    }

    if (
      parsed.status === "valid"
      && parsed.normalized.type
      && parsed.normalized.amount_cents
      && parsed.normalized.date
      && parsed.accountKey
      && parsed.categoryKey
    ) {
      const validRow: ParsedValidRow = {
        rowIndex: index,
        type: parsed.normalized.type,
        amount_cents: parsed.normalized.amount_cents,
        date: parsed.normalized.date,
        accountKey: parsed.accountKey,
        categoryKey: parsed.categoryKey
      };
      if (parsed.normalized.merchant) {
        validRow.merchant = parsed.normalized.merchant;
      }
      if (parsed.normalized.note) {
        validRow.note = parsed.normalized.note;
      }
      if (parsed.normalized.mood) {
        validRow.mood = parsed.normalized.mood;
      }
      if (typeof parsed.normalized.is_impulse === "boolean") {
        validRow.is_impulse = parsed.normalized.is_impulse;
      }
      validRows.push(validRow);
    }

    parsedRows.push(parsed);
  });

  return {
    missingRequiredHeaders,
    allRows: parsedRows,
    validRows,
    newAccounts: Array.from(newAccountsMap.values()),
    newCategories: Array.from(newCategoriesMap.values()),
    validCount: validRows.length,
    errorCount,
    warningCount
  };
}
