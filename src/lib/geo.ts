/**
 * Real driving distance between two addresses via Mapbox.
 *
 * Requires VITE_MAPBOX_TOKEN to be set (a public Mapbox access token —
 * safe to expose client-side, same trust model as Supabase's publishable
 * key). Falls back to `null` if the token is missing or either API call
 * fails, so callers can gracefully degrade to the estimate-only distance
 * in `estimateDistance()` (lib/pricing.ts) rather than breaking the
 * booking flow entirely.
 */

export interface RouteResult {
  miles: number;
  minutes: number;
}

async function geocode(address: string, token: string): Promise<[number, number] | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address,
  )}.json?limit=1&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: { center?: [number, number] }[] };
  const center = data.features?.[0]?.center;
  return center ?? null;
}

export async function getRouteDistance(
  pickup: string,
  dropoff: string,
): Promise<RouteResult | null> {
  const token = import.meta.env["VITE_MAPBOX_TOKEN"] as string | undefined;
  if (!token || !pickup.trim() || !dropoff.trim()) return null;

  try {
    const [from, to] = await Promise.all([geocode(pickup, token), geocode(dropoff, token)]);
    if (!from || !to) return null;

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=false&access_token=${token}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: { distance?: number; duration?: number }[];
    };
    const route = data.routes?.[0];
    if (!route?.distance) return null;

    return {
      miles: Math.round((route.distance / 1609.34) * 10) / 10,
      minutes: Math.round((route.duration ?? 0) / 60),
    };
  } catch {
    return null;
  }
}
