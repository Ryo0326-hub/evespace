import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsSearchUrl,
  buildGoogleRoutesRequest,
  geocodeEventLocation,
  normalizeGoogleRoutesTravelMode,
  parseGoogleMapsLocationUrl,
} from "./google-maps-utils.mjs";

describe("Google Maps utilities", () => {
  it("extracts precise coordinates from Google Maps URLs", () => {
    const parsed = parseGoogleMapsLocationUrl(
      "https://www.google.com/maps/place/Tokyo+Tower/@35.6585805,139.7454329,17z/data=!3m1!4b1",
    );

    assert.equal(parsed.latitude, 35.6585805);
    assert.equal(parsed.longitude, 139.7454329);
    assert.equal(parsed.query, "Tokyo Tower");
  });

  it("extracts coordinates from compact data payloads", () => {
    const parsed = parseGoogleMapsLocationUrl(
      "https://www.google.com/maps?ftid=0x0:0x0!3d43.653226!4d-79.3831843",
    );

    assert.equal(parsed.latitude, 43.653226);
    assert.equal(parsed.longitude, -79.3831843);
  });

  it("extracts place IDs and query text from Maps URLs", () => {
    const parsed = parseGoogleMapsLocationUrl(
      "https://www.google.com/maps/search/?api=1&query=Sydney%20Opera%20House&query_place_id=ChIJ3S-JXmauEmsRUcIaWtf4MzE",
    );

    assert.equal(parsed.placeId, "ChIJ3S-JXmauEmsRUcIaWtf4MzE");
    assert.equal(parsed.query, "Sydney Opera House");
  });

  it("builds precise Maps search and directions fallback URLs", () => {
    assert.equal(
      buildGoogleMapsSearchUrl({
        latitude: 35.6585805,
        longitude: 139.7454329,
        query: "Tokyo Tower",
      }),
      "https://www.google.com/maps/search/?api=1&query=35.6585805%2C139.7454329",
    );

    assert.equal(
      buildGoogleMapsDirectionsUrl({
        placeId: "ChIJ3S-JXmauEmsRUcIaWtf4MzE",
        query: "Sydney Opera House",
      }),
      "https://www.google.com/maps/dir/?api=1&destination=Sydney%20Opera%20House&destination_place_id=ChIJ3S-JXmauEmsRUcIaWtf4MzE",
    );
  });

  it("builds directions URLs with origin, travel mode, and navigation action", () => {
    assert.equal(
      buildGoogleMapsDirectionsUrl(
        {
          latitude: 35.6585805,
          longitude: 139.7454329,
          query: "Tokyo Tower",
        },
        {
          origin: {
            latitude: 43.653226,
            longitude: -79.3831843,
          },
          travelMode: "WALKING",
          navigate: true,
        },
      ),
      "https://www.google.com/maps/dir/?api=1&origin=43.653226%2C-79.3831843&destination=35.6585805%2C139.7454329&travelmode=walking&dir_action=navigate",
    );
  });

  it("builds Google Routes JS requests with route-level fields only", () => {
    const request = buildGoogleRoutesRequest({
      origin: { lat: 43.653226, lng: -79.3831843 },
      destination: { lat: 35.6585805, lng: 139.7454329 },
      travelMode: "walk",
    });

    assert.deepEqual(request, {
      origin: { lat: 43.653226, lng: -79.3831843 },
      destination: { lat: 35.6585805, lng: 139.7454329 },
      travelMode: "WALKING",
      fields: ["path", "localizedValues", "legs"],
    });
    assert.equal(request.fields.some((field) => field.includes(".")), false);
  });

  it("normalizes Google Routes JS travel modes", () => {
    assert.equal(normalizeGoogleRoutesTravelMode("drive"), "DRIVING");
    assert.equal(normalizeGoogleRoutesTravelMode("two-wheeler"), "TWO_WHEELER");
    assert.equal(normalizeGoogleRoutesTravelMode("TRANSIT"), "TRANSIT");
    assert.equal(normalizeGoogleRoutesTravelMode("teleport"), null);
  });

  it("uses URL coordinates without calling geocoding", async () => {
    const result = await geocodeEventLocation(
      {
        googleMapsUrl:
          "https://www.google.com/maps/place/Tokyo+Tower/@35.6585805,139.7454329,17z/",
        address: "4 Chome-2-8 Shibakoen, Minato City, Tokyo",
        locationName: "Tokyo Tower",
      },
      {
        apiKey: "server-key",
        fetchImpl: async () => {
          throw new Error("fetch should not be called");
        },
      },
    );

    assert.deepEqual(result, {
      latitude: 35.6585805,
      longitude: 139.7454329,
      formattedAddress: null,
      placeId: null,
      googleMapsUrl:
        "https://www.google.com/maps/search/?api=1&query=35.6585805%2C139.7454329",
    });
  });

  it("falls back to server geocoding for address-only locations", async () => {
    const requestedUrls = [];
    const result = await geocodeEventLocation(
      {
        address: "100 Queen St W, Toronto, ON",
        locationName: "Toronto City Hall",
      },
      {
        apiKey: "server-key",
        fetchImpl: async (url) => {
          requestedUrls.push(String(url));
          return Response.json({
            status: "OK",
            results: [
              {
                formatted_address: "100 Queen St W, Toronto, ON M5H 2N2, Canada",
                place_id: "ChIJDbdkHFQayUwR7-8fITgxTmU",
                geometry: {
                  location: {
                    lat: 43.6534392,
                    lng: -79.3840901,
                  },
                },
              },
            ],
          });
        },
      },
    );

    assert.equal(requestedUrls.length, 1);
    assert.match(requestedUrls[0], /address=100\+Queen\+St\+W%2C\+Toronto%2C\+ON/);
    assert.deepEqual(result, {
      latitude: 43.6534392,
      longitude: -79.3840901,
      formattedAddress: "100 Queen St W, Toronto, ON M5H 2N2, Canada",
      placeId: "ChIJDbdkHFQayUwR7-8fITgxTmU",
      googleMapsUrl:
        "https://www.google.com/maps/search/?api=1&query=43.6534392%2C-79.3840901",
    });
  });
});
