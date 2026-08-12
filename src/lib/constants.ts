import type { AddonKey, ItemSize, JobStatus, ServiceLevel, VehicleType } from "./types";

export const ITEM_TYPES = [
  "Couch",
  "Sectional",
  "Bed",
  "Mattress",
  "Dresser",
  "Table",
  "Chair",
  "TV",
  "Appliance",
  "Boxes",
  "Multiple items",
  "Other",
] as const;

export const ITEM_SIZES: { value: ItemSize; label: string }[] = [
  { value: "SMALL", label: "Small — fits in a car" },
  { value: "MEDIUM", label: "Medium — one person can carry" },
  { value: "LARGE", label: "Large — needs two people" },
  { value: "XL", label: "Extra large / very heavy" },
];

export const SIZE_LOAD_UNITS: Record<ItemSize, number> = {
  SMALL: 0.5,
  MEDIUM: 1,
  LARGE: 2.5,
  XL: 4,
};

export const ACCESS_OPTIONS = [
  { value: "GROUND", label: "Ground floor" },
  { value: "STAIRS", label: "Stairs" },
  { value: "ELEVATOR", label: "Elevator" },
  { value: "LOADING_DOCK", label: "Loading dock" },
] as const;

export const SERVICE_LEVELS: { value: ServiceLevel; label: string; description: string }[] = [
  {
    value: "FULL_SERVICE",
    label: "Full Service",
    description: "Movers load, transport, and unload for you.",
  },
  {
    value: "LABOR_ONLY",
    label: "Labor Only",
    description: "Help loading or unloading — no truck.",
  },
  { value: "CURBSIDE", label: "Curbside", description: "Drop-off at the curb or garage." },
  {
    value: "ROOM_OF_CHOICE",
    label: "Room of Choice",
    description: "Delivered to the exact room you pick.",
  },
];

export const ADDONS: { value: AddonKey; label: string; hint: string }[] = [
  { value: "extra_mover", label: "Extra mover", hint: "A second pair of hands" },
  { value: "disassembly", label: "Disassembly", hint: "Take items apart at pickup" },
  { value: "assembly", label: "Assembly", hint: "Rebuild items at drop-off" },
  { value: "additional_stop", label: "Additional stop", hint: "One extra address" },
  { value: "heavy_item", label: "Heavy item", hint: "Piano, safe, gym equipment" },
  { value: "stairs", label: "Stairs", hint: "Flights at pickup or drop-off" },
];

export const VEHICLES: {
  value: VehicleType;
  label: string;
  description: string;
  capacity: string;
}[] = [
  {
    value: "PICKUP_TRUCK",
    label: "Pickup Truck",
    description: "Small loads.",
    capacity: "1–3 items",
  },
  { value: "CARGO_VAN", label: "Cargo Van", description: "Medium loads.", capacity: "3–8 items" },
  {
    value: "BOX_TRUCK",
    label: "Box Truck",
    description: "Large loads.",
    capacity: "Full room or more",
  },
];

export const JOB_FLOW: JobStatus[] = [
  "REQUESTED",
  "SEARCHING",
  "MOVER_ASSIGNED",
  "MOVER_EN_ROUTE",
  "MOVER_ARRIVED",
  "LOADING",
  "IN_TRANSIT",
  "ARRIVED",
  "UNLOADING",
  "COMPLETED",
];

export const STATUS_LABELS: Record<JobStatus, string> = {
  REQUESTED: "Requested",
  SEARCHING: "Finding a mover",
  MOVER_ASSIGNED: "Mover assigned",
  MOVER_EN_ROUTE: "Mover en route",
  MOVER_ARRIVED: "Mover arrived",
  LOADING: "Loading",
  IN_TRANSIT: "In transit",
  ARRIVED: "Arrived at drop-off",
  UNLOADING: "Unloading",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

export const MOVER_ACTIONS: { from: JobStatus; to: JobStatus; label: string }[] = [
  { from: "MOVER_ASSIGNED", to: "MOVER_EN_ROUTE", label: "I'm on my way" },
  { from: "MOVER_EN_ROUTE", to: "MOVER_ARRIVED", label: "I've arrived" },
  { from: "MOVER_ARRIVED", to: "LOADING", label: "Start loading" },
  { from: "LOADING", to: "IN_TRANSIT", label: "Loading complete" },
  { from: "IN_TRANSIT", to: "ARRIVED", label: "Arrived at drop-off" },
  { from: "ARRIVED", to: "UNLOADING", label: "Start unloading" },
  { from: "UNLOADING", to: "COMPLETED", label: "Complete job" },
];

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  PICKUP_TRUCK: "Pickup Truck",
  CARGO_VAN: "Cargo Van",
  BOX_TRUCK: "Box Truck",
};

export const SERVICE_LABELS: Record<ServiceLevel, string> = {
  FULL_SERVICE: "Full Service",
  LABOR_ONLY: "Labor Only",
  CURBSIDE: "Curbside",
  ROOM_OF_CHOICE: "Room of Choice",
};
