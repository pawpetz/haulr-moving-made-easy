import { MapPin, Navigation } from "lucide-react";

/**
 * Map placeholder. The tracking architecture keeps location rendering behind
 * this component, so a Google Maps / Mapbox provider can be dropped in later
 * without touching the screens that use it.
 */
export function MapPlaceholder({
  pickup,
  dropoff,
  etaMinutes,
}: {
  pickup: string;
  dropoff: string;
  etaMinutes?: number | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <div className="hero-gradient relative h-52 w-full sm:h-64">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            color: "var(--color-ink-foreground)",
          }}
        />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" fill="none">
          <path
            d="M50 160 C 120 150, 130 60, 220 60 S 330 90, 355 45"
            stroke="var(--color-accent)"
            strokeWidth="4"
            strokeDasharray="10 8"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute left-8 bottom-8 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
          <span className="h-2 w-2 rounded-full bg-ink" />
        </span>
        <span className="absolute right-8 top-8 flex h-5 w-5 items-center justify-center rounded-full bg-ink-foreground">
          <span className="h-2 w-2 rounded-full bg-ink" />
        </span>
        {typeof etaMinutes === "number" && (
          <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded-full bg-card/95 px-4 py-1.5 text-sm font-semibold shadow-soft">
            <Navigation className="mr-1.5 inline h-3.5 w-3.5" />
            ETA {etaMinutes} min
          </div>
        )}
      </div>
      <div className="space-y-2 bg-card p-4 text-sm">
        <p className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pickup
            </span>
            {pickup}
          </span>
        </p>
        <p className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>
            <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Drop-off
            </span>
            {dropoff}
          </span>
        </p>
      </div>
    </div>
  );
}
