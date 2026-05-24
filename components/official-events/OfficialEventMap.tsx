"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsSearchUrl,
  buildGoogleRoutesRequest,
} from "@/lib/maps/google-maps-utils.mjs";

type TravelMode = "DRIVING" | "WALKING" | "TRANSIT";

type LatLngLiteral = {
  lat: number;
  lng: number;
};

type GoogleMap = {
  fitBounds: (bounds: GoogleLatLngBounds) => void;
  setCenter: (position: LatLngLiteral) => void;
  setZoom: (zoom: number) => void;
};

type GoogleLatLngBounds = {
  extend: (position: LatLngLiteral) => void;
};

type GoogleMapOverlay = {
  setMap: (map: GoogleMap | null) => void;
};

type GoogleRoute = {
  localizedValues?: {
    distance?: string;
    duration?: string;
    staticDuration?: string;
  };
  legs?: GoogleRouteLeg[];
  path?: LatLngLiteral[];
  createPolylines?: () => GoogleMapOverlay[];
};

type GoogleRouteLeg = {
  localizedValues?: {
    distance?: string;
    duration?: string;
    staticDuration?: string;
  };
  steps?: GoogleRouteStep[];
};

type GoogleRouteStep = {
  instructions?: string;
  localizedValues?: {
    distance?: string;
    staticDuration?: string;
  };
};

type GoogleMapsNamespace = {
  maps: {
    importLibrary: (library: string) => Promise<Record<string, unknown>>;
    LatLngBounds: new () => GoogleLatLngBounds;
    Marker?: new (options: {
      map: GoogleMap;
      position: LatLngLiteral;
      title?: string;
      icon?: Record<string, unknown>;
    }) => GoogleMapOverlay;
    SymbolPath?: {
      CIRCLE?: unknown;
    };
  };
};

type GoogleMapsWindow = Window &
  Record<string, unknown> & {
    google?: GoogleMapsNamespace;
  };

type RouteState = {
  status: "idle" | "locating" | "routing" | "ready" | "error";
  message: string | null;
  summary: string | null;
  steps: string[];
};

const TRAVEL_MODES: Array<{ value: TravelMode; label: string }> = [
  { value: "DRIVING", label: "Driving" },
  { value: "TRANSIT", label: "Transit" },
  { value: "WALKING", label: "Walking" },
];

let googleMapsPromise: Promise<GoogleMapsNamespace> | null = null;

export function OfficialEventMap({
  title,
  locationName,
  address,
  googleMapsUrl,
  latitude,
  longitude,
  accessInformation,
  apiKey,
}: {
  title: string;
  locationName: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  accessInformation: string | null;
  apiKey: string;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const eventMarkerRef = useRef<GoogleMapOverlay | null>(null);
  const originMarkerRef = useRef<GoogleMapOverlay | null>(null);
  const routeOverlaysRef = useRef<GoogleMapOverlay[]>([]);
  const googleRef = useRef<GoogleMapsNamespace | null>(null);
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVING");
  const [routeOrigin, setRouteOrigin] = useState<LatLngLiteral | null>(null);
  const [routeState, setRouteState] = useState<RouteState>({
    status: "idle",
    message: null,
    summary: null,
    steps: [],
  });

  const destination = useMemo(() => {
    if (!hasFiniteCoordinates(latitude, longitude)) {
      return null;
    }

    return { lat: Number(latitude), lng: Number(longitude) };
  }, [latitude, longitude]);

  const mapsSearchUrl = useMemo(
    () =>
      buildGoogleMapsSearchUrl({
        latitude,
        longitude,
        query: locationName ?? address ?? title,
        googleMapsUrl,
      }),
    [address, googleMapsUrl, latitude, locationName, longitude, title],
  );
  const mapsDirectionsUrl = useMemo(
    () =>
      buildGoogleMapsDirectionsUrl(
        {
          latitude,
          longitude,
          query: locationName ?? address ?? title,
          googleMapsUrl,
        },
        {
          origin: routeOrigin
            ? { latitude: routeOrigin.lat, longitude: routeOrigin.lng }
            : null,
          travelMode,
          navigate: true,
        },
      ),
    [
      address,
      googleMapsUrl,
      latitude,
      locationName,
      longitude,
      routeOrigin,
      title,
      travelMode,
    ],
  );

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!apiKey || !destination || !mapElementRef.current) {
        return;
      }

      setMapStatus("loading");

      try {
        const google = await loadGoogleMaps(apiKey);
        const mapsLibrary = (await google.maps.importLibrary("maps")) as {
          Map: new (
            element: HTMLElement,
            options: Record<string, unknown>,
          ) => GoogleMap;
        };

        if (cancelled || !mapElementRef.current) {
          return;
        }

        const map = new mapsLibrary.Map(mapElementRef.current, {
          center: destination,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          backgroundColor: "#020617",
        });

        googleRef.current = google;
        mapRef.current = map;
        eventMarkerRef.current?.setMap(null);
        eventMarkerRef.current = createMarker({
          google,
          map,
          position: destination,
          title,
        });
        setMapStatus("ready");
      } catch {
        if (!cancelled) {
          setMapStatus("error");
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;
      eventMarkerRef.current?.setMap(null);
      originMarkerRef.current?.setMap(null);
      clearRouteOverlays(routeOverlaysRef.current);
      routeOverlaysRef.current = [];
    };
  }, [apiKey, destination, title]);

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setRouteState({
        status: "error",
        message: "Current location is not available in this browser.",
        summary: null,
        steps: [],
      });
      return;
    }

    setRouteState({
      status: "locating",
      message: "Finding your current location...",
      summary: null,
      steps: [],
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setRouteOrigin(origin);
        if (!destination || !apiKey || mapStatus !== "ready") {
          setRouteState({
            status: "idle",
            message:
              "Directions are ready in Google Maps. Open directions to continue.",
            summary: null,
            steps: [],
          });
          return;
        }

        void renderRoute({
          origin,
          destination,
          mode: travelMode,
        });
      },
      () => {
        setRouteState({
          status: "error",
          message:
            "Location permission was not granted. You can still open directions in Google Maps.",
          summary: null,
          steps: [],
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  }

  async function renderRoute({
    origin,
    destination: routeDestination,
    mode,
  }: {
    origin: LatLngLiteral;
    destination: LatLngLiteral;
    mode: TravelMode;
  }) {
    setRouteState({
      status: "routing",
      message: "Calculating route...",
      summary: null,
      steps: [],
    });

    try {
      const google = googleRef.current ?? (await loadGoogleMaps(apiKey));
      const map = mapRef.current;

      if (!map) {
        throw new Error("Map is not ready.");
      }

      clearRouteOverlays(routeOverlaysRef.current);
      routeOverlaysRef.current = [];
      originMarkerRef.current?.setMap(null);
      originMarkerRef.current = null;

      const routesLibrary = (await google.maps.importLibrary("routes")) as {
        Route: {
          computeRoutes: (request: Record<string, unknown>) => Promise<{
            routes?: GoogleRoute[];
          }>;
        };
      };
      const { routes } = await routesLibrary.Route.computeRoutes({
        ...buildGoogleRoutesRequest({
          origin,
          destination: routeDestination,
          travelMode: mode,
        }),
      });
      const route = routes?.[0];

      if (!route) {
        throw new Error("No route returned.");
      }

      routeOverlaysRef.current = route.createPolylines?.() ?? [];
      routeOverlaysRef.current.forEach((overlay) => overlay.setMap(map));
      originMarkerRef.current = createMarker({
        google,
        map,
        position: origin,
        title: "Your location",
        accent: "origin",
      });
      fitRouteBounds(google, map, origin, routeDestination, route.path ?? []);

      setRouteState({
        status: "ready",
        message: null,
        summary: readRouteSummary(route),
        steps: readRouteSteps(route),
      });
    } catch (error) {
      console.error("Failed to calculate Google route", error);
      setRouteState({
        status: "error",
        message:
          "Directions are ready in Google Maps, but this route could not be drawn in-page for the selected mode.",
        summary: null,
        steps: [],
      });
    }
  }

  const canShowMap = Boolean(apiKey && destination);

  return (
    <Card className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="evespace-card-title">Access & Map</h2>
          {locationName ? (
            <p className="mt-2 text-base font-semibold text-white">{locationName}</p>
          ) : null}
          {address ? (
            <p className="mt-1 text-sm leading-6 text-slate-300">{address}</p>
          ) : null}
        </div>
        {mapsSearchUrl ? (
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/15"
            href={mapsSearchUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps
          </a>
        ) : null}
      </div>

      {accessInformation ? (
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
          {accessInformation}
        </p>
      ) : null}

      {canShowMap ? (
        <div
          ref={mapElementRef}
          aria-label={`${title} map`}
          className="min-h-72 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70"
        />
      ) : (
        <div className="grid min-h-44 place-items-center rounded-3xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-6 text-center text-sm text-slate-300">
          {destination
            ? "Map preview unavailable."
            : "Exact map coordinates are not available yet."}
        </div>
      )}

      {mapStatus === "error" ? (
        <p className="text-sm text-amber-100">Map preview unavailable.</p>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-3 gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1">
          {TRAVEL_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              aria-pressed={travelMode === mode.value}
              className={
                travelMode === mode.value
                  ? "rounded-full bg-cyan-100 px-3 py-2 text-xs font-semibold text-slate-950"
                  : "rounded-full px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              }
              onClick={() => {
                if (mode.value === travelMode) {
                  return;
                }

                setTravelMode(mode.value);
                if (routeOrigin && destination) {
                  void renderRoute({
                    origin: routeOrigin,
                    destination,
                    mode: mode.value,
                  });
                } else {
                  clearRouteOverlays(routeOverlaysRef.current);
                  routeOverlaysRef.current = [];
                  originMarkerRef.current?.setMap(null);
                  originMarkerRef.current = null;
                  setRouteState({
                    status: "idle",
                    message: null,
                    summary: null,
                    steps: [],
                  });
                }
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="w-full sm:w-auto"
            disabled={routeState.status === "locating" || routeState.status === "routing"}
            onClick={handleUseCurrentLocation}
            type="button"
          >
            Use my current location
          </Button>
          {mapsDirectionsUrl ? (
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/15"
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open directions
            </a>
          ) : null}
        </div>
      </div>

      {mapStatus === "loading" ? (
        <p className="text-sm text-slate-400">Loading map...</p>
      ) : null}
      {routeState.message ? (
        <p className="text-sm text-slate-300">{routeState.message}</p>
      ) : null}
      {routeState.summary ? (
        <p className="rounded-2xl border border-cyan-100/20 bg-cyan-100/[0.08] px-4 py-3 text-sm font-semibold text-cyan-50">
          {routeState.summary}
        </p>
      ) : null}
      {routeState.status === "ready" && travelMode === "WALKING" ? (
        <p className="text-xs leading-5 text-slate-400">
          Walking routes can be approximate and may not always include sidewalks or
          pedestrian paths.
        </p>
      ) : null}
      {routeState.steps.length > 0 ? (
        <ol className="grid gap-2 text-sm leading-6 text-slate-300">
          {routeState.steps.slice(0, 6).map((step, index) => (
            <li
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
              key={`${step}-${index}`}
            >
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      ) : null}
    </Card>
  );
}

function loadGoogleMaps(apiKey: string) {
  const mapsWindow = window as unknown as GoogleMapsWindow;

  if (mapsWindow.google?.maps?.importLibrary) {
    return Promise.resolve(mapsWindow.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = "__evespaceGoogleMapsReady";
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      callback: callbackName,
    });

    mapsWindow[callbackName] = () => {
      if (mapsWindow.google?.maps?.importLibrary) {
        resolve(mapsWindow.google);
      } else {
        reject(new Error("Google Maps did not initialize."));
      }
    };

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.append(script);
  });

  return googleMapsPromise;
}

function createMarker({
  google,
  map,
  position,
  title,
  accent = "event",
}: {
  google: GoogleMapsNamespace;
  map: GoogleMap;
  position: LatLngLiteral;
  title: string;
  accent?: "event" | "origin";
}) {
  const Marker = google.maps.Marker;

  if (!Marker) {
    return null;
  }

  return new Marker({
    map,
    position,
    title,
    icon: {
      path: google.maps.SymbolPath?.CIRCLE,
      scale: accent === "origin" ? 7 : 9,
      fillColor: accent === "origin" ? "#67e8f9" : "#f0f9ff",
      fillOpacity: 1,
      strokeColor: accent === "origin" ? "#0e7490" : "#0891b2",
      strokeWeight: 3,
    },
  });
}

function clearRouteOverlays(overlays: GoogleMapOverlay[]) {
  overlays.forEach((overlay) => overlay.setMap(null));
}

function fitRouteBounds(
  google: GoogleMapsNamespace,
  map: GoogleMap,
  origin: LatLngLiteral,
  destination: LatLngLiteral,
  path: LatLngLiteral[],
) {
  const bounds = new google.maps.LatLngBounds();
  bounds.extend(origin);
  bounds.extend(destination);
  path.forEach((point) => bounds.extend(point));
  map.fitBounds(bounds);
}

function readRouteSummary(route: GoogleRoute) {
  const routeValues = route.localizedValues;
  const firstLeg = route.legs?.[0]?.localizedValues;
  const duration = routeValues?.duration ?? firstLeg?.duration ?? firstLeg?.staticDuration;
  const distance = routeValues?.distance ?? firstLeg?.distance;

  return [duration, distance].filter(Boolean).join(" • ") || null;
}

function readRouteSteps(route: GoogleRoute) {
  return (
    route.legs
      ?.flatMap((leg) => leg.steps ?? [])
      .map((step) => cleanInstruction(step.instructions))
      .filter((step): step is string => Boolean(step)) ?? []
  );
}

function cleanInstruction(value: string | undefined) {
  const next = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return next.length > 0 ? next : null;
}

function hasFiniteCoordinates(latitude: number | null, longitude: number | null) {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  );
}
