import { useRegisterSW } from "virtual:pwa-register/react";

import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";

export default function PWAUpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-50 md:inset-x-auto md:bottom-4 md:right-4 md:w-[min(26rem,90vw)]">
      <Card className="pointer-events-auto border-primary/30">
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <p className="text-sm font-medium">Nueva version disponible</p>
          <Button type="button" size="sm" onClick={() => updateServiceWorker(true)}>
            Actualizar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
