const BROWSER_KEY_NAMES = [
  "NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "GOOGLE_MAPS_SERVER_API_KEY",
];

const SERVER_KEY_NAMES = [
  "GOOGLE_MAPS_SERVER_API_KEY",
  "GOOGLE_MAPS_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_API_KEY",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
];

export function readGoogleMapsBrowserApiKey(env = process.env) {
  return readFirstEnvValue(env, BROWSER_KEY_NAMES);
}

export function readGoogleMapsServerApiKey(env = process.env) {
  return readFirstEnvValue(env, SERVER_KEY_NAMES);
}

function readFirstEnvValue(env, names) {
  for (const name of names) {
    const value = String(env?.[name] ?? "").trim();

    if (value) {
      return value;
    }
  }

  return "";
}
