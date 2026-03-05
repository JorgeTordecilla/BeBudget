import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-50 md:inset-x-auto md:right-4 md:top-4 md:w-[min(26rem,90vw)]">
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-amber-400/50 bg-amber-100/90 px-3 py-2 text-sm font-medium text-amber-950 shadow"
      >
        Sin conexion - mostrando datos guardados
      </div>
    </div>
  );
}
