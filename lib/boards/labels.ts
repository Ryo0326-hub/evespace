import type { Board } from "@/types/evespace";

export function sharingScopeLabel(value: Board["sharingScope"]) {
  if (value === "followers") {
    return "Followers only";
  }

  if (value === "public") {
    return "Public";
  }

  return "Owner only";
}

export function boardAccessLabel(board: Board) {
  return board.boardType === "official_event"
    ? "Official event"
    : sharingScopeLabel(board.sharingScope);
}
