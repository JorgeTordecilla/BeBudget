import { useEffect } from "react";

type BadgeNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

function getBadgeNavigator(): BadgeNavigator | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  return navigator as BadgeNavigator;
}

export async function clearAppBadgeIfSupported(): Promise<void> {
  const nav = getBadgeNavigator();
  if (!nav?.clearAppBadge) {
    return;
  }
  try {
    await nav.clearAppBadge();
  } catch {
    // Unsupported runtime behavior should not break app flow.
  }
}

export function useAppBadge(count: number | null | undefined): void {
  useEffect(() => {
    const nav = getBadgeNavigator();
    if (!nav) {
      return;
    }

    const nextCount = Math.max(0, Number(count ?? 0));

    if (nextCount > 0 && nav.setAppBadge) {
      void nav.setAppBadge(nextCount).catch(() => undefined);
      return;
    }

    if (nav.clearAppBadge) {
      void nav.clearAppBadge().catch(() => undefined);
    }
  }, [count]);
}
