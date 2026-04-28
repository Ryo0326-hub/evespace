import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Time TBA";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Date TBA";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string | null) {
  if (!value) {
    return "Time TBA";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function compactDateLocation(date: string | null, location: string | null) {
  return [formatDate(date), location].filter(Boolean).join(" • ");
}

export function generateStarCoordinate(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const x = Math.abs(Math.sin(hash) * 10000) % 10000;
  const y = Math.abs(Math.cos(hash) * 10000) % 10000;

  return {
    x: Math.round(x),
    y: Math.round(y),
  };
}
