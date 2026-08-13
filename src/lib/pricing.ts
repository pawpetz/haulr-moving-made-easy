import { SIZE_LOAD_UNITS } from "./constants";
import type { AddonKey, BookingItem, VehicleType } from "./types";

/**
 * Pricing engine. All rates come from the `pricing_rules` table so they can be
 * changed from the admin screen without touching code. DEFAULT_PRICING is only
 * a fallback for offline/first render.
 */
export type PricingRules = Record<string, number>;

export const DEFAULT_PRICING: PricingRules = {
  base_fee: 45,
  mileage_rate: 2.25,
  labor_rate: 35,
  extra_mover_rate: 30,
  stair_fee: 15,
  additional_stop_fee: 25,
  heavy_item_fee: 25,
  waiting_fee: 1,
  vehicle_fee_pickup: 0,
  vehicle_fee_van: 20,
  vehicle_fee_box: 45,
  disassembly_fee: 20,
  assembly_fee: 20,
  platform_commission: 20,
};

export interface EstimateInput {
  distanceMiles: number;
  items: BookingItem[];
  pickupFlights: number;
  dropoffFlights: number;
  addons: AddonKey[];
  vehicleType: VehicleType;
  serviceLevel: string;
}

export interface EstimateLine {
  key: string;
  label: string;
  amount: number;
  detail?: string;
}

export interface Estimate {
  lines: EstimateLine[];
  laborHours: number;
  total: number;
  platformFee: number;
  moverPayout: number;
  estimatedMinutes: number;
  loadUnits: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function totalLoadUnits(items: BookingItem[]): number {
  return items.reduce(
    (sum, item) => sum + SIZE_LOAD_UNITS[item.size] * Math.max(1, item.quantity),
    0,
  );
}

export function recommendVehicle(items: BookingItem[]): VehicleType {
  const units = totalLoadUnits(items);
  if (units <= 3) return "PICKUP_TRUCK";
  if (units <= 9) return "CARGO_VAN";
  return "BOX_TRUCK";
}

export function estimateLaborHours(
  items: BookingItem[],
  flights: number,
  distanceMiles: number,
): number {
  const units = totalLoadUnits(items);
  const hours = 0.75 + units * 0.18 + flights * 0.12 + distanceMiles / 30;
  return Math.max(1, Math.round(hours * 4) / 4);
}

function vehicleFee(rules: PricingRules, vehicle: VehicleType): number {
  if (vehicle === "CARGO_VAN") return rules["vehicle_fee_van"] ?? 0;
  if (vehicle === "BOX_TRUCK") return rules["vehicle_fee_box"] ?? 0;
  return rules["vehicle_fee_pickup"] ?? 0;
}

export function calculateEstimate(input: EstimateInput, rulesInput?: PricingRules): Estimate {
  const rules: PricingRules = { ...DEFAULT_PRICING, ...(rulesInput ?? {}) };
  const flights = input.pickupFlights + input.dropoffFlights;
  const laborHours = estimateLaborHours(input.items, flights, input.distanceMiles);

  const lines: EstimateLine[] = [];

  lines.push({ key: "base", label: "Base fee", amount: round2(rules["base_fee"] ?? 0) });

  lines.push({
    key: "distance",
    label: "Distance",
    detail: `${input.distanceMiles.toFixed(1)} mi × $${(rules["mileage_rate"] ?? 0).toFixed(2)}`,
    amount: round2(input.distanceMiles * (rules["mileage_rate"] ?? 0)),
  });

  lines.push({
    key: "labor",
    label: "Labor",
    detail: `${laborHours} hr × $${(rules["labor_rate"] ?? 0).toFixed(2)}`,
    amount: round2(laborHours * (rules["labor_rate"] ?? 0)),
  });

  const vFee = vehicleFee(rules, input.vehicleType);
  if (vFee > 0) {
    lines.push({ key: "vehicle", label: "Vehicle", amount: round2(vFee) });
  }

  let additional = 0;
  const additionalDetails: string[] = [];

  if (flights > 0) {
    const amount = flights * (rules["stair_fee"] ?? 0);
    additional += amount;
    additionalDetails.push(`${flights} flight${flights > 1 ? "s" : ""} of stairs`);
  }
  if (input.addons.includes("extra_mover")) {
    additional += laborHours * (rules["extra_mover_rate"] ?? 0);
    additionalDetails.push("Extra mover");
  }
  if (input.addons.includes("additional_stop")) {
    additional += rules["additional_stop_fee"] ?? 0;
    additionalDetails.push("Additional stop");
  }
  if (input.addons.includes("heavy_item")) {
    additional += rules["heavy_item_fee"] ?? 0;
    additionalDetails.push("Heavy item");
  }
  if (input.addons.includes("disassembly")) {
    additional += rules["disassembly_fee"] ?? 0;
    additionalDetails.push("Disassembly");
  }
  if (input.addons.includes("assembly")) {
    additional += rules["assembly_fee"] ?? 0;
    additionalDetails.push("Assembly");
  }

  if (additional > 0) {
    lines.push({
      key: "additional",
      label: "Additional services",
      detail: additionalDetails.join(" · "),
      amount: round2(additional),
    });
  }

  // The mover is paid the subtotal (their labor + vehicle + distance work).
  // The platform commission is added on top as a separate line so the
  // customer-facing breakdown, the stored job record, and the mover's
  // payout all agree on the same numbers.
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const commission = (rules["platform_commission"] ?? 20) / 100;
  const platformFee = round2(subtotal * commission);
  const total = round2(subtotal + platformFee);

  lines.push({
    key: "platform_fee",
    label: "Platform fee",
    detail: "Booking, support & insurance",
    amount: platformFee,
  });

  return {
    lines,
    laborHours,
    total,
    platformFee,
    moverPayout: round2(subtotal),
    estimatedMinutes: Math.round(laborHours * 60),
    loadUnits: totalLoadUnits(input.items),
  };
}

/** Deterministic mock distance until a real maps provider is connected. */
export function estimateDistance(pickup: string, dropoff: string): number {
  const seed = `${pickup.trim().toLowerCase()}|${dropoff.trim().toLowerCase()}`;
  if (!pickup.trim() || !dropoff.trim()) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }
  return round2(2 + (hash % 1800) / 100);
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
