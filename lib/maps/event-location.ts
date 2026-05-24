import { readGoogleMapsServerApiKey } from "@/lib/maps/google-maps-config.mjs";
import { geocodeEventLocation } from "@/lib/maps/google-maps-utils.mjs";
import type { EventInput } from "@/types/evespace";

export async function resolveEventLocationInput(input: EventInput): Promise<EventInput> {
  const location = await geocodeEventLocation(
    {
      googleMapsUrl: input.googleMapsUrl,
      address: input.address,
      locationName: input.locationName,
    },
    {
      apiKey: readGoogleMapsServerApiKey(),
    },
  );

  if (!location) {
    return input;
  }

  return {
    ...input,
    latitude: location.latitude,
    longitude: location.longitude,
    address: input.address ?? location.formattedAddress,
    googleMapsUrl: input.googleMapsUrl ?? location.googleMapsUrl,
  };
}
