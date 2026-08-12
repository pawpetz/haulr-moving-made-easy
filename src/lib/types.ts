export type VehicleType = "PICKUP_TRUCK" | "CARGO_VAN" | "BOX_TRUCK";

export type ServiceLevel = "FULL_SERVICE" | "LABOR_ONLY" | "CURBSIDE" | "ROOM_OF_CHOICE";

export type AccessType = "GROUND" | "STAIRS" | "ELEVATOR" | "LOADING_DOCK";

export type AddonKey =
  | "extra_mover"
  | "disassembly"
  | "assembly"
  | "additional_stop"
  | "heavy_item"
  | "stairs";

export type JobStatus =
  | "REQUESTED"
  | "SEARCHING"
  | "MOVER_ASSIGNED"
  | "MOVER_EN_ROUTE"
  | "MOVER_ARRIVED"
  | "LOADING"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "UNLOADING"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type MoverStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "SUSPENDED";

export type ItemSize = "SMALL" | "MEDIUM" | "LARGE" | "XL";

export interface BookingItem {
  id: string;
  itemType: string;
  quantity: number;
  size: ItemSize;
  weightLbs?: number;
}

export interface BookingDraft {
  pickupAddress: string;
  dropoffAddress: string;
  distanceMiles: number;
  items: BookingItem[];
  photos: string[];
  pickupAccess: AccessType;
  dropoffAccess: AccessType;
  pickupFlights: number;
  dropoffFlights: number;
  parkingAvailable: boolean;
  serviceLevel: ServiceLevel;
  addons: AddonKey[];
  vehicleType: VehicleType;
  asap: boolean;
  scheduledFor: string | null;
  specialInstructions: string;
}
