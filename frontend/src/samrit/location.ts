export const DEMO_LOCATION_MODE =
  import.meta.env.VITE_DEMO_LOCATION_MODE === "true";
export const demoCoordinates = () => ({
  lat: Number(import.meta.env.VITE_DEFAULT_LATITUDE || 40.7306),
  lng: Number(import.meta.env.VITE_DEFAULT_LONGITUDE || -73.9866),
});
