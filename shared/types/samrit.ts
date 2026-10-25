export const ALLERGENS = [
  "Milk",
  "Eggs",
  "Fish",
  "Crustacean shellfish",
  "Tree nuts",
  "Peanuts",
  "Wheat",
  "Soybeans",
  "Sesame",
] as const;
export type Handling = "hot" | "refrigerated" | "frozen" | "shelf_stable";
export interface Location {
  lat: number;
  lng: number;
  address: string;
}
export interface MenuItem {
  sourceCandidateId?: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  name: string;
  ingredients: string[];
  allergens: string[];
  estimatedServings: number;
  handlingRequirement: Handling;
  verified: boolean;
}
export interface Proof {
  locationSource?: string;
  url: string;
  timestamp: string;
  lat: number;
  lng: number;
  actorId: string;
  sha256: string;
}
export interface FoodBatch {
  handlingRequirements?: Handling[];
  metadata?: Record<string, unknown>;
  batchId: string;
  donorId: string;
  donorEventId: string;
  eventName: string;
  location: Location;
  qrStickerId: string | null;
  status: "pending" | "matched" | "in_transit" | "delivered" | "rejected";
  handlingRequirement: Handling;
  items: MenuItem[];
  expiresAt: string;
  createdAt: string;
  centerId: string | null;
  driverId: string | null;
  rejectionReason?: string;
  chainOfCustody: {
    stage1_DonorPic: Proof;
    stage2_PickupPic: Proof | null;
    stage3_DropoffPic: Proof | null;
  };
}
// Menu items are the normalized source of truth, including legacy batches.
export function batchHandlingRequirements(
  batch: Pick<FoodBatch, "items" | "handlingRequirement">,
): Handling[] {
  return [
    ...new Set(
      batch.items?.length
        ? batch.items.map((item) => item.handlingRequirement)
        : [batch.handlingRequirement],
    ),
  ];
}
export interface CenterProfile {
  metadata?: Record<string, unknown>;
  centerId: string;
  ownerId: string;
  name: string;
  location: Location;
  timeZone: string;
  capabilities: {
    refrigeration: boolean;
    hotHolding: boolean;
    freezer: boolean;
    maxMealCapacity: number;
  };
  operatingHours: { open: string; close: string };
  seating: number;
  staffing: number;
  locationQrCode: string;
  approved: boolean;
}
export interface DonorEvent {
  metadata?: Record<string, unknown>;
  eventId: string;
  donorId: string;
  name: string;
  scheduledAt: string;
  location: Location;
  items: MenuItem[];
  notes: string;
}
export interface DispatchRoute {
  metadata?: Record<string, unknown>;
  routeId: string;
  driverId: string;
  vehicleId?: string; // Absent only on historical routes created before fleet management.
  vehicleSnapshot?: {
    name: string;
    registration: string;
    capacityServings: number;
    capabilities: Handling[];
  };
  cancelledAt?: string;
  cancellationReason?: string;
  centerId: string;
  status: "active" | "completed" | "cancelled";
  assignedBatches: string[];
  distanceMiles: number;
  estimatedMinutes: number;
  createdAt: string;
  waypoints: {
    type: "pickup" | "dropoff";
    location: Location;
    batchId: string;
    status: "pending" | "done";
  }[];
}
export interface FleetVehicle {
  metadata?: Record<string, unknown>;
  vehicleId: string;
  name: string;
  registration: string;
  capacityServings: number;
  capabilities: Handling[];
  equipment: string[];
  status: "ready" | "maintenance" | "inactive";
  createdAt: string;
  updatedAt: string;
}
export interface FleetDriver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isAvailable: boolean;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
  locationSource?: "admin_base" | "driver_report" | "custody_scan" | "simulated";
}
export interface FeedbackReview {
  reviewId: string;
  authorId: string;
  targetType: "donor" | "center";
  targetId: string;
  linkedBatchId: string;
  sentiment: "positive" | "negative";
  rawText: string;
  aiParsedFlags: string[];
  analysisMode: string;
  createdAt: string;
}
export interface CustodyScan {
  locationSource?: string;
  scanId: string;
  batchId: string;
  actorId: string;
  kind: "event" | "sticker_link" | "center";
  value: string;
  lat: number;
  lng: number;
  timestamp: string;
}
