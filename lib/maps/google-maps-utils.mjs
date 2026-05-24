const GOOGLE_GEOCODING_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";
const COORDINATE_PAIR_PATTERN =
  /(^|[^\d.-])(-?(?:\d{1,2}|[1-8]\d|90)(?:\.\d+)?),\s*(-?(?:\d{1,3}|1[0-7]\d|180)(?:\.\d+)?)(?=$|[^\d.-])/;
const MAP_PATH_COORDINATE_PATTERN =
  /@(-?(?:\d{1,2}|[1-8]\d|90)(?:\.\d+)?),(-?(?:\d{1,3}|1[0-7]\d|180)(?:\.\d+)?)(?:[,/]|$)/;
const MAP_DATA_COORDINATE_PATTERN =
  /!3d(-?(?:\d{1,2}|[1-8]\d|90)(?:\.\d+)?)!4d(-?(?:\d{1,3}|1[0-7]\d|180)(?:\.\d+)?)/i;

const PLACE_ID_PARAMS = [
  "query_place_id",
  "place_id",
  "destination_place_id",
  "origin_place_id",
];

const QUERY_PARAMS = ["query", "q", "destination", "daddr"];
const GOOGLE_ROUTES_FIELDS = Object.freeze(["path", "localizedValues", "legs"]);
const GOOGLE_ROUTES_TRAVEL_MODES = new Set([
  "DRIVING",
  "WALKING",
  "TRANSIT",
  "BICYCLING",
  "TWO_WHEELER",
]);

export function parseGoogleMapsLocationUrl(value) {
  const rawUrl = String(value ?? "").trim();
  const parsed = {
    latitude: null,
    longitude: null,
    placeId: null,
    query: null,
  };

  if (!rawUrl) {
    return parsed;
  }

  const coordinatePair =
    readCoordinatePairFromText(rawUrl, MAP_PATH_COORDINATE_PATTERN) ??
    readCoordinatePairFromText(rawUrl, MAP_DATA_COORDINATE_PATTERN);

  if (coordinatePair) {
    parsed.latitude = coordinatePair.latitude;
    parsed.longitude = coordinatePair.longitude;
  }

  try {
    const url = new URL(rawUrl);
    const paramCoordinates = readCoordinatePairFromSearchParams(url.searchParams);

    if (paramCoordinates) {
      parsed.latitude = paramCoordinates.latitude;
      parsed.longitude = paramCoordinates.longitude;
    }

    parsed.placeId = readPlaceIdFromSearchParams(url.searchParams) ?? readPlaceIdFromData(rawUrl);
    parsed.query = readQueryFromSearchParams(url.searchParams) ?? readQueryFromPath(url.pathname);
  } catch {
    parsed.query = cleanQuery(rawUrl);
  }

  return parsed;
}

export function buildGoogleMapsSearchUrl(location) {
  const coordinateDestination = readCoordinateDestination(location);

  if (coordinateDestination) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      coordinateDestination,
    )}`;
  }

  const query = cleanQuery(location?.query);
  const placeId = cleanPlaceId(location?.placeId);

  if (query && placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      query,
    )}&query_place_id=${encodeURIComponent(placeId)}`;
  }

  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `place_id:${placeId}`,
    )}`;
  }

  return cleanUrl(location?.googleMapsUrl);
}

export function buildGoogleMapsDirectionsUrl(location, options = {}) {
  const coordinateDestination = readCoordinateDestination(location);
  const query = cleanQuery(location?.query);
  const placeId = cleanPlaceId(location?.placeId);
  const destination = coordinateDestination ?? query ?? (placeId ? `place_id:${placeId}` : null);

  if (!destination) {
    return cleanUrl(location?.googleMapsUrl);
  }

  const placeIdParam =
    placeId && query
      ? `&destination_place_id=${encodeURIComponent(placeId)}`
      : "";
  const origin = readCoordinateDestination(options?.origin);
  const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : "";
  const travelMode = readMapsUrlTravelMode(options?.travelMode);
  const travelModeParam = travelMode ? `&travelmode=${travelMode}` : "";
  const navigationParam = options?.navigate ? "&dir_action=navigate" : "";

  return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encodeURIComponent(
    destination,
  )}${placeIdParam}${travelModeParam}${navigationParam}`;
}

export function buildGoogleRoutesRequest(input = {}) {
  const request = {
    origin: input.origin,
    destination: input.destination,
    fields: GOOGLE_ROUTES_FIELDS,
  };
  const travelMode = normalizeGoogleRoutesTravelMode(input.travelMode);

  if (travelMode) {
    request.travelMode = travelMode;
  }

  return request;
}

export function normalizeGoogleRoutesTravelMode(value) {
  const mode = cleanQuery(value)?.toUpperCase().replace(/-/g, "_");

  if (mode === "DRIVE") {
    return "DRIVING";
  }

  if (mode === "WALK") {
    return "WALKING";
  }

  if (mode === "BICYCLE") {
    return "BICYCLING";
  }

  if (GOOGLE_ROUTES_TRAVEL_MODES.has(mode)) {
    return mode;
  }

  return null;
}

export async function geocodeEventLocation(input, options = {}) {
  const parsedUrl = parseGoogleMapsLocationUrl(input?.googleMapsUrl);

  if (hasCoordinates(parsedUrl)) {
    return {
      latitude: parsedUrl.latitude,
      longitude: parsedUrl.longitude,
      formattedAddress: null,
      placeId: parsedUrl.placeId,
      googleMapsUrl: buildGoogleMapsSearchUrl(parsedUrl),
    };
  }

  const apiKey = String(options.apiKey ?? "").trim();

  if (!apiKey) {
    return null;
  }

  const placeId = parsedUrl.placeId;
  const address = readGeocodingAddress(input, parsedUrl.query);

  if (!placeId && !address) {
    return null;
  }

  try {
    const url = new URL(GOOGLE_GEOCODING_ENDPOINT);
    url.searchParams.set("key", apiKey);

    if (placeId) {
      url.searchParams.set("place_id", placeId);
    } else {
      url.searchParams.set("address", address);
    }

    const fetchImpl = options.fetchImpl ?? fetch;
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const result = Array.isArray(payload?.results) ? payload.results[0] : null;
    const location = result?.geometry?.location;
    const latitude = Number(location?.lat);
    const longitude = Number(location?.lng);

    if (payload?.status !== "OK" || !isValidCoordinate(latitude, longitude)) {
      return null;
    }

    const formattedAddress =
      typeof result.formatted_address === "string" ? result.formatted_address : null;
    const nextPlaceId =
      typeof result.place_id === "string" ? result.place_id : placeId ?? null;

    return {
      latitude,
      longitude,
      formattedAddress,
      placeId: nextPlaceId,
      googleMapsUrl: buildGoogleMapsSearchUrl({ latitude, longitude }),
    };
  } catch {
    return null;
  }
}

function readCoordinatePairFromText(value, pattern = COORDINATE_PAIR_PATTERN) {
  const match = String(value ?? "").match(pattern);

  if (!match) {
    return null;
  }

  const [rawLatitude, rawLongitude] = match
    .slice(1)
    .filter((capture) => /^-?\d/.test(capture ?? ""));
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  return isValidCoordinate(latitude, longitude) ? { latitude, longitude } : null;
}

function readCoordinatePairFromSearchParams(searchParams) {
  for (const param of ["query", "q", "ll", "center", "destination", "daddr"]) {
    const coordinates = readCoordinatePairFromText(searchParams.get(param));

    if (coordinates) {
      return coordinates;
    }
  }

  return null;
}

function readCoordinateDestination(location) {
  if (location?.latitude === null || location?.longitude === null) {
    return null;
  }

  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  return `${latitude},${longitude}`;
}

function readMapsUrlTravelMode(value) {
  const mode = cleanQuery(value)?.toUpperCase();

  if (mode === "DRIVING" || mode === "DRIVE") {
    return "driving";
  }

  if (mode === "WALKING" || mode === "WALK") {
    return "walking";
  }

  if (mode === "TRANSIT") {
    return "transit";
  }

  if (mode === "BICYCLING" || mode === "BICYCLE") {
    return "bicycling";
  }

  if (mode === "TWO_WHEELER" || mode === "TWO-WHEELER") {
    return "two-wheeler";
  }

  return null;
}

function readPlaceIdFromSearchParams(searchParams) {
  for (const param of PLACE_ID_PARAMS) {
    const placeId = cleanPlaceId(searchParams.get(param));

    if (placeId) {
      return placeId;
    }
  }

  for (const param of QUERY_PARAMS) {
    const value = cleanQuery(searchParams.get(param));
    const placeId = value?.match(/^place_id:(.+)$/i)?.[1];

    if (placeId) {
      return cleanPlaceId(placeId);
    }
  }

  return null;
}

function readPlaceIdFromData(value) {
  const match = String(value ?? "").match(/!1s([^!/?&]+)/);
  const decoded = match ? decodeText(match[1]) : null;

  if (!decoded || !decoded.startsWith("Ch")) {
    return null;
  }

  return cleanPlaceId(decoded);
}

function readQueryFromSearchParams(searchParams) {
  for (const param of QUERY_PARAMS) {
    const query = cleanQuery(searchParams.get(param));

    if (query && !query.startsWith("place_id:") && !readCoordinatePairFromText(query)) {
      return query;
    }
  }

  return null;
}

function readQueryFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const markerIndex = parts.findIndex((part) => part === "place" || part === "search");
  const encodedQuery = markerIndex >= 0 ? parts[markerIndex + 1] : null;

  if (!encodedQuery || encodedQuery.startsWith("@")) {
    return null;
  }

  return cleanQuery(encodedQuery);
}

function readGeocodingAddress(input, parsedQuery) {
  const address = cleanQuery(input?.address);
  const locationName = cleanQuery(input?.locationName);

  if (address) {
    return address;
  }

  if (locationName && parsedQuery && locationName !== parsedQuery) {
    return `${locationName} ${parsedQuery}`;
  }

  return locationName ?? parsedQuery ?? null;
}

function hasCoordinates(location) {
  return (
    location?.latitude !== null &&
    location?.longitude !== null &&
    isValidCoordinate(Number(location?.latitude), Number(location?.longitude))
  );
}

function isValidCoordinate(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function cleanPlaceId(value) {
  const next = cleanQuery(value);

  if (!next || next.length > 220 || /\s/.test(next)) {
    return null;
  }

  return next.replace(/^place_id:/i, "");
}

function cleanUrl(value) {
  const next = String(value ?? "").trim();
  return next.length > 0 ? next : null;
}

function cleanQuery(value) {
  const next = decodeText(value).replace(/\s+/g, " ").trim();
  return next.length > 0 ? next : null;
}

function decodeText(value) {
  const next = String(value ?? "").replace(/\+/g, " ");

  try {
    return decodeURIComponent(next);
  } catch {
    return next;
  }
}
