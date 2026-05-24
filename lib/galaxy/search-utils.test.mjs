import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getGalaxySearchSuggestions } from "./search-utils.mjs";

const boards = [
  {
    id: "official-1",
    boardType: "official_event",
    title: "Campus Festival",
    category: "Festival",
    locationName: "Main Quad",
    address: null,
    startTime: null,
    ownerDisplayName: "EveSpace",
    createdBy: null,
    createdByClerkUserId: null,
    createdByProfileId: null,
  },
  {
    id: "memory-1",
    boardType: "private_memory",
    title: "Public Ski Trip",
    category: "Trip",
    locationName: "Hakuba",
    address: null,
    startTime: null,
    ownerDisplayName: "Ryo",
    createdBy: null,
    createdByClerkUserId: null,
    createdByProfileId: null,
  },
  {
    id: "official-2",
    boardType: "official_event",
    title: "City Art Fair",
    category: "Art",
    locationName: "Downtown",
    address: null,
    startTime: null,
    ownerDisplayName: "Gallery Team",
    createdBy: null,
    createdByClerkUserId: null,
    createdByProfileId: null,
  },
];

describe("galaxy search suggestions", () => {
  it("shows only official events before the visitor types", () => {
    assert.deepEqual(
      getGalaxySearchSuggestions(boards, "").map((board) => board.id),
      ["official-1", "official-2"],
    );
  });

  it("allows memory boards to appear after typing a matching query", () => {
    assert.deepEqual(
      getGalaxySearchSuggestions(boards, "ski").map((board) => board.id),
      ["memory-1"],
    );
  });
});
