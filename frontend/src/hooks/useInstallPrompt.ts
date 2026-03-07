import { useCallback, useEffect, useMemo, useState } from "react";

type InstallOutcome = "accepted" | "dismissed" | "unavailable";

type PromptChoice = {
  outcome: "accepted" | "dismissed";
  platform?: string;
};

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<PromptChoice>;
};

function getIsStandalone(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const standaloneByMedia = typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  return standaloneByMedia || navigatorWithStandalone.standalone === true;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(getIsStandalone);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event): void {
      const installEvent = event as DeferredInstallPromptEvent;
      installEvent.preventDefault();
      if (getIsStandalone()) {
        setDeferredPrompt(null);
        return;
      }
      setDeferredPrompt(installEvent);
    }

    function handleAppInstalled(): void {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    function syncStandaloneState(): void {
      const standalone = getIsStandalone();
      setIsStandalone(standalone);
      if (standalone) {
        setDeferredPrompt(null);
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    const media = typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: standalone)") : null;
    if (media) {
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", syncStandaloneState);
      } else if (typeof media.addListener === "function") {
        media.addListener(syncStandaloneState);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (media) {
        if (typeof media.removeEventListener === "function") {
          media.removeEventListener("change", syncStandaloneState);
        } else if (typeof media.removeListener === "function") {
          media.removeListener(syncStandaloneState);
        }
      }
    };
  }, []);

  const canInstall = useMemo(() => !isStandalone && deferredPrompt !== null, [deferredPrompt, isStandalone]);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (getIsStandalone() || !deferredPrompt) {
      setDeferredPrompt(null);
      return "unavailable";
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      return choice.outcome;
    } catch {
      return "unavailable";
    } finally {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  return { canInstall, promptInstall };
}
