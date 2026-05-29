export function getGalaxySearchSuggestions(boards, query, limit = 5) {
  const normalized = String(query ?? "").trim().toLowerCase();

  if (!normalized) {
    return boards;
  }

  return boards
    .filter((board) => {
      const searchable = [
        board.title,
        board.category,
        board.locationName,
        board.address,
        board.startTime,
        board.ownerDisplayName,
        board.createdBy,
        board.createdByClerkUserId,
        board.createdByProfileId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalized);
    })
    .slice(0, limit);
}
