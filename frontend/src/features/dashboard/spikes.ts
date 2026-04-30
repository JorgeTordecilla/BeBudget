import type { Transaction } from "@/api/types";

export const DEFAULT_SPIKE_MULTIPLIER = 3;
export const DEFAULT_MIN_SPIKE_CENTS = 50_000;
export const DEFAULT_MIN_SAMPLE_SIZE = 8;
export const DEFAULT_ROBUST_Z_THRESHOLD = 3.5;
export const DEFAULT_ROBUST_Z_MEDIUM = 4.5;
export const DEFAULT_ROBUST_Z_HIGH = 6;

export type SpikeDetectionConfig = {
  multiplier?: number;
  minSpikeCents?: number;
  minSampleSize?: number;
  robustZThreshold?: number;
};

export type SpikeSeverity = "low" | "medium" | "high";

export type DashboardSpike = {
  id: string;
  amountCents: number;
  date: string;
  merchant: string | null;
  severity: SpikeSeverity;
};

export type SpikeDetectionResult = {
  medianCents: number | null;
  spikes: DashboardSpike[];
  insufficientData: boolean;
};

function toSortedAmounts(transactions: Transaction[]): number[] {
  return transactions
    .map((item) => item.amount_cents)
    .filter((value) => Number.isInteger(value) && value > 0)
    .sort((a, b) => a - b);
}

function computeMedianFromAmounts(amounts: number[]): number | null {
  if (amounts.length === 0) {
    return null;
  }
  const middle = Math.floor(amounts.length / 2);
  if (amounts.length % 2 === 1) {
    return amounts[middle] ?? null;
  }
  const left = amounts[middle - 1];
  const right = amounts[middle];
  if (left === undefined || right === undefined) {
    return null;
  }
  return Math.round((left + right) / 2);
}

export function computeMedianCents(transactions: Transaction[]): number | null {
  const amounts = toSortedAmounts(transactions);
  return computeMedianFromAmounts(amounts);
}

function computeMadCents(amounts: number[], median: number): number {
  const deviations = amounts.map((value) => Math.abs(value - median)).sort((a, b) => a - b);
  return computeMedianFromAmounts(deviations) ?? 0;
}

function severityFromRobustZ(value: number): SpikeSeverity {
  if (value >= DEFAULT_ROBUST_Z_HIGH) {
    return "high";
  }
  if (value >= DEFAULT_ROBUST_Z_MEDIUM) {
    return "medium";
  }
  return "low";
}

function severityFromFallbackRatio(ratio: number): SpikeSeverity {
  if (ratio >= 2.5) {
    return "high";
  }
  if (ratio >= 1.5) {
    return "medium";
  }
  return "low";
}

export function detectSpendingSpikes(transactions: Transaction[], config: SpikeDetectionConfig = {}): SpikeDetectionResult {
  const multiplier = config.multiplier ?? DEFAULT_SPIKE_MULTIPLIER;
  const minSpikeCents = config.minSpikeCents ?? DEFAULT_MIN_SPIKE_CENTS;
  const minSampleSize = config.minSampleSize ?? DEFAULT_MIN_SAMPLE_SIZE;
  const robustZThreshold = config.robustZThreshold ?? DEFAULT_ROBUST_Z_THRESHOLD;

  const validTransactions = transactions.filter((item) => Number.isInteger(item.amount_cents) && item.amount_cents > 0);
  if (validTransactions.length < minSampleSize) {
    return {
      medianCents: computeMedianCents(validTransactions),
      spikes: [],
      insufficientData: true
    };
  }

  const medianCents = computeMedianCents(validTransactions);
  if (!medianCents || medianCents <= 0) {
    return {
      medianCents,
      spikes: [],
      insufficientData: false
    };
  }

  const threshold = Math.max(minSpikeCents, medianCents * multiplier);
  const byCategory = new Map<string, Transaction[]>();
  for (const item of validTransactions) {
    const key = item.category_id ?? "__uncategorized__";
    const items = byCategory.get(key);
    if (items) {
      items.push(item);
      continue;
    }
    byCategory.set(key, [item]);
  }

  const spikes = validTransactions
    .flatMap((item) => {
      const categoryKey = item.category_id ?? "__uncategorized__";
      const categoryItems = byCategory.get(categoryKey) ?? [];

      if (categoryItems.length >= minSampleSize) {
        const amounts = categoryItems
          .map((entry) => entry.amount_cents)
          .filter((value) => Number.isInteger(value) && value > 0)
          .sort((a, b) => a - b);
        const categoryMedian = computeMedianFromAmounts(amounts);
        if (categoryMedian === null || item.amount_cents < minSpikeCents) {
          return [];
        }
        const mad = computeMadCents(amounts, categoryMedian);
        const robustScale = Math.max(1, Math.round(1.4826 * mad));
        const robustZ = (item.amount_cents - categoryMedian) / robustScale;
        if (robustZ < robustZThreshold) {
          return [];
        }
        return [{
          id: item.id,
          amountCents: item.amount_cents,
          date: item.date,
          merchant: item.merchant ?? null,
          severity: severityFromRobustZ(robustZ)
        }];
      }

      if (item.amount_cents < threshold) {
        return [];
      }
      return [{
        id: item.id,
        amountCents: item.amount_cents,
        date: item.date,
        merchant: item.merchant ?? null,
        severity: severityFromFallbackRatio(item.amount_cents / threshold)
      }];
    })
    .sort((left, right) => right.amountCents - left.amountCents)

  return {
    medianCents,
    spikes,
    insufficientData: false
  };
}
