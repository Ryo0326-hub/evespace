import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  readGoogleMapsBrowserApiKey,
  readGoogleMapsServerApiKey,
} from "./google-maps-config.mjs";

describe("Google Maps config", () => {
  it("uses one generic Maps Platform key for both browser and server paths", () => {
    const env = {
      GOOGLE_MAPS_API_KEY: "shared-key",
    };

    assert.equal(readGoogleMapsBrowserApiKey(env), "shared-key");
    assert.equal(readGoogleMapsServerApiKey(env), "shared-key");
  });

  it("keeps dedicated keys preferred when they are configured", () => {
    const env = {
      GOOGLE_MAPS_API_KEY: "shared-key",
      GOOGLE_MAPS_SERVER_API_KEY: "server-key",
      NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY: "browser-key",
    };

    assert.equal(readGoogleMapsBrowserApiKey(env), "browser-key");
    assert.equal(readGoogleMapsServerApiKey(env), "server-key");
  });

  it("supports the shorter public browser key name", () => {
    const env = {
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "public-key",
    };

    assert.equal(readGoogleMapsBrowserApiKey(env), "public-key");
    assert.equal(readGoogleMapsServerApiKey(env), "public-key");
  });

  it("can use the server key as a single Maps Platform key for the browser map", () => {
    const env = {
      GOOGLE_MAPS_SERVER_API_KEY: "maps-platform-key",
    };

    assert.equal(readGoogleMapsBrowserApiKey(env), "maps-platform-key");
    assert.equal(readGoogleMapsServerApiKey(env), "maps-platform-key");
  });
});
