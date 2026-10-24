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
  name: string;
  ingredients: string[];
  allergens: string[];
  estimatedServings: number;
  handlingRequirement: Handling;
  verified: boolean;
}
export interface Proof {
  url: string;
  timestamp: string;
  lat: number;
  lng: number;
  actorId: string;
  sha256: string;
}
export interface FoodBatch {
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
export interface CenterProfile {
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
  eventId: string;
  donorId: string;
  name: string;
  scheduledAt: string;
  location: Location;
  items: MenuItem[];
  notes: string;
}
export interface DispatchRoute {
  routeId: string;
  driverId: string;
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
  scanId: string;
  batchId: string;
  actorId: string;
  kind: "event" | "sticker_link" | "center";
  value: string;
  lat: number;
  lng: number;
  timestamp: string;
}
