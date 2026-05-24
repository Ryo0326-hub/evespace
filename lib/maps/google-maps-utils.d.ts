export type ParsedGoogleMapsLocation = {
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  query: string | null;
};

export type GoogleMapsLocationInput = {
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  query?: string | null;
  googleMapsUrl?: string | null;
};

export type GoogleMapsDirectionsOptions = {
  origin?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  travelMode?: string | null;
  navigate?: boolean;
};

export type GoogleRoutesRequestInput = {
  origin?: unknown;
  destination?: unknown;
  travelMode?: string | null;
};

export type GoogleRoutesRequest = {
  origin?: unknown;
  destination?: unknown;
  fields: readonly ["path", "localizedValues", "legs"];
  travelMode?: "DRIVING" | "WALKING" | "TRANSIT" | "BICYCLING" | "TWO_WHEELER";
};

export type EventLocationInput = {
  googleMapsUrl?: string | null;
  address?: string | null;
  locationName?: string | null;
};

export type GeocodedEventLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string | null;
  placeId: string | null;
  googleMapsUrl: string | null;
};

export function parseGoogleMapsLocationUrl(value?: string | null): ParsedGoogleMapsLocation;

export function buildGoogleMapsSearchUrl(
  location?: GoogleMapsLocationInput | null,
): string | null;

export function buildGoogleMapsDirectionsUrl(
  location?: GoogleMapsLocationInput | null,
  options?: GoogleMapsDirectionsOptions,
): string | null;

export function buildGoogleRoutesRequest(
  input?: GoogleRoutesRequestInput,
): GoogleRoutesRequest;

export function normalizeGoogleRoutesTravelMode(
  value?: string | null,
): GoogleRoutesRequest["travelMode"] | null;

export function geocodeEventLocation(
  input?: EventLocationInput | null,
  options?: {
    apiKey?: string | null;
    fetchImpl?: typeof fetch;
  },
): Promise<GeocodedEventLocation | null>;
