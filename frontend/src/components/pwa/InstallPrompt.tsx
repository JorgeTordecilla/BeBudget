import { useMemo, useState } from "react";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/ui/button";

const DEFER_KEY = "pwa_install_prompt_defer_until";
const DEFER_MS = 7 * 24 * 60 * 60 * 1000;

function isDeferred(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const value = Number.parseInt(localStorage.getItem(DEFER_KEY) ?? "0", 10);
  return Number.isFinite(value) && value > Date.now();
}

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const standaloneByMedia = typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  return standaloneByMedia || navigatorWithStandalone.standalone === true;
}

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(ua);
  const isSafariEngine = ua.includes("safari");
  const isOtherBrowser = /crios|fxios|edgios|chrome/.test(ua);
  return isIosDevice && isSafariEngine && !isOtherBrowser;
}

export default function InstallPrompt() {
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const { canInstall, promptInstall } = useInstallPrompt();
  const showIosFallback = !canInstall && isIosSafari() && !isStandaloneMode();
  const visible = useMemo(
    () => !dismissed && !isDeferred() && (canInstall || showIosFallback),
    [canInstall, dismissed, showIosFallback]
  );

  if (!visible) {
    return null;
  }

  async function handleInstall(): Promise<void> {
    setInstalling(true);
    try {
      await promptInstall();
    } finally {
      setDismissed(true);
      setInstalling(false);
    }
  }

  function handleDismiss(): void {
    localStorage.setItem(DEFER_KEY, String(Date.now() + DEFER_MS));
    setDismissed(true);
  }

  return (
    <div
      role="banner"
      aria-label="Install BudgetBuddy"
      className="mb-4 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-4 shadow-sm"
    >
      <p className="text-base font-semibold text-foreground">Install BudgetBuddy for quick access</p>
      {showIosFallback ? (
        <p className="mt-1 text-sm text-foreground/80">On iPhone: tap Share, then Add to Home Screen.</p>
      ) : (
        <p className="mt-1 text-sm text-foreground/80">Get a native-like app experience with faster access.</p>
      )}
      <div className="mt-3 flex items-center gap-2">
        {!showIosFallback ? (
          <Button type="button" size="sm" onClick={() => void handleInstall()} disabled={installing}>
            {installing ? "Installing..." : "Install"}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" size="sm" onClick={handleDismiss}>
          Not now
        </Button>
      </div>
    </div>
  );
}
