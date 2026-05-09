import {
  createOfficialBoard,
  getBoardById,
  getManagedOfficialBoards,
  getOfficialBoardBySlug,
  getPublicOfficialBoards,
  updateBoard,
} from "@/lib/data/boards";
import type { Event, EventInput, Profile } from "@/types/evespace";

export async function getPublicEvents(): Promise<Event[]> {
  return getPublicOfficialBoards();
}

export async function getAllAdminEvents(): Promise<Event[]> {
  return [];
}

export async function getManagedEvents(profile: Profile): Promise<Event[]> {
  return getManagedOfficialBoards(profile);
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  return getOfficialBoardBySlug(slug);
}

export async function getEventById(eventId: string): Promise<Event | null> {
  return getBoardById(eventId);
}

export async function createEvent(input: EventInput, profile?: Profile | null) {
  if (!profile) {
    return { data: null, error: "Authentication required." };
  }

  return createOfficialBoard(input, profile);
}

export async function updateEvent(eventId: string, input: EventInput) {
  return updateBoard(eventId, input);
}
