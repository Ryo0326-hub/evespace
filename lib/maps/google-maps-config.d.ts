export type GoogleMapsEnv = Partial<Record<string, string | undefined>>;

export function readGoogleMapsBrowserApiKey(env?: GoogleMapsEnv): string;

export function readGoogleMapsServerApiKey(env?: GoogleMapsEnv): string;
