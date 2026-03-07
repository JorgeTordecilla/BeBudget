import { useRegisterSW } from "virtual:pwa-register/react";

import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export default function PWAUpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  const isStandaloneMode =
    typeof window !== "undefined" &&
    ((typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
      (navigator as NavigatorWithStandalone).standalone === true);

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 box-border md:inset-x-auto md:bottom-4 md:right-4 md:max-w-sm"
      style={{
        bottom: isStandaloneMode
          ? "calc(9.5rem + max(0px, env(safe-area-inset-bottom)))"
          : "calc(10.25rem + env(safe-area-inset-bottom))",
        paddingLeft: isStandaloneMode ? "max(1rem, calc(env(safe-area-inset-left) + 0.5rem))" : "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: isStandaloneMode
          ? "max(1rem, calc(env(safe-area-inset-right) + 0.5rem))"
          : "max(0.75rem, env(safe-area-inset-right))"
      }}
    >
      <Card className="pointer-events-auto mx-auto w-full max-w-[30rem] border-border/80 bg-card/98 shadow-lg backdrop-blur md:max-w-sm">
        <CardContent className="flex items-center justify-between gap-3 p-3 md:p-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-primary">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 4v9" />
                <path d="m8 9 4 4 4-4" />
                <path d="M5 18h14" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">New version available</p>
              <p className="truncate text-xs text-muted-foreground md:hidden">Update to get the latest improvements</p>
            </div>
          </div>
          <Button type="button" size="sm" className="shrink-0 rounded-full px-4" variant="default" onClick={() => updateServiceWorker(true)}>
            Update
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
