import api from "../services/api";
import { DEMO_LOCATION_MODE, demoCoordinates } from "./location";
import type {
  FoodBatch,
  CenterProfile,
  DonorEvent,
  DispatchRoute,
  FeedbackReview,
  CustodyScan,
  FleetVehicle,
  FleetDriver,
} from "../../../shared/types/samrit";
export type {
  FoodBatch,
  CenterProfile,
  DonorEvent,
  DispatchRoute,
  FeedbackReview,
  MenuItem,
  Handling,
  Location,
} from "../../../shared/types/samrit";
export {
  ALLERGENS,
  batchHandlingRequirements,
} from "../../../shared/types/samrit";
import { batchHandlingRequirements } from "../../../shared/types/samrit";
export const batchHandlingLabel = (batch: FoodBatch) =>
  batchHandlingRequirements(batch).map(handlingLabel).join(" + ");
export const REGION = {
  city: import.meta.env.VITE_APP_CITY || "New York City",
  timeZone: import.meta.env.VITE_APP_TIMEZONE || "America/New_York",
  locale: import.meta.env.VITE_APP_LOCALE || "en-US",
  lat: Number(import.meta.env.VITE_DEFAULT_LATITUDE || 40.7306),
  lng: Number(import.meta.env.VITE_DEFAULT_LONGITUDE || -73.9866),
};
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "NGO" | "VOLUNTEER" | "ADMIN";
  isAvailable?: boolean;
  isVerified?: boolean;
  transportCapabilities?: string[];
}
export interface Overview {
  config: { city: string; timeZone: string; aiConfigured: boolean };
  batches: FoodBatch[];
  centers: CenterProfile[];
  events: DonorEvent[];
  routes: DispatchRoute[];
  reviews: FeedbackReview[];
  scans: CustodyScan[];
  drivers: FleetDriver[];
  vehicles: FleetVehicle[];
}
export async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const result = await api.request({
    url: path,
    method,
    data: body,
    ...(body instanceof FormData
      ? { headers: { "Content-Type": undefined } }
      : {}),
  });
  return result.data.data as T;
}
export function errorMessage(error: unknown) {
  const response = (
    error as {
      response?: { data?: { error?: string; message?: string | string[] } };
    }
  ).response?.data;
  const message = response?.error || response?.message;
  return Array.isArray(message)
    ? message.join(", ")
    : message ||
        (error instanceof Error
          ? error.message
          : "Unable to complete the action.");
}
export function localDate(value: string) {
  return new Intl.DateTimeFormat(REGION.locale, {
    timeZone: REGION.timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}
export const portionCount = (batch: FoodBatch) =>
  batch.items.reduce((sum, item) => sum + item.estimatedServings, 0);
export const handlingLabel = (value: string) =>
  ({
    hot: "Hot holding",
    refrigerated: "Refrigerated",
    frozen: "Frozen",
    shelf_stable: "Shelf stable",
  })[value] || value;
export function mediaUrl(path: string) {
  return new URL(
    path,
    import.meta.env.VITE_API_URL || "http://localhost:3000",
  ).toString();
}
export function gps(): Promise<{ lat: number; lng: number }> {
  if (DEMO_LOCATION_MODE) return Promise.resolve(demoCoordinates());
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(
        new Error(
          "This browser does not support location. Open the app in a browser with location access.",
        ),
      );
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) =>
        reject(
          new Error(
            `Location is required for custody records. ${error.message}`,
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}
export function localInputToISO(value: string) {
  // datetime-local has no time zone. Interpret it in the configured service zone.
  const target = new Date(`${value}:00Z`);
  let guess = target.getTime();
  for (let i = 0; i < 3; i++) {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: REGION.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).format(new Date(guess));
    const shown = Date.parse(parts.replace(" ", "T") + "Z");
    guess += target.getTime() - shown;
  }
  return new Date(guess).toISOString();
}
