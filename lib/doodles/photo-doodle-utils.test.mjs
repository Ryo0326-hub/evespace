import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getBoundedImageSize,
  makeDoodleFileName,
  shouldAppendStrokePoint,
} from "./photo-doodle-utils.mjs";

describe("photo doodle utilities", () => {
  it("keeps small images at their original size", () => {
    assert.deepEqual(getBoundedImageSize(1200, 900), {
      width: 1200,
      height: 900,
    });
  });

  it("scales landscape images down to the maximum side", () => {
    assert.deepEqual(getBoundedImageSize(4000, 3000, 2000), {
      width: 2000,
      height: 1500,
    });
  });

  it("scales portrait images down to the maximum side", () => {
    assert.deepEqual(getBoundedImageSize(2400, 3600, 1800), {
      width: 1200,
      height: 1800,
    });
  });

  it("creates a safe jpg filename for doodled uploads", () => {
    assert.equal(makeDoodleFileName("My beach memory.PNG"), "My-beach-memory-doodle.jpg");
  });

  it("ignores tiny pointer jitter while preserving meaningful movement", () => {
    assert.equal(
      shouldAppendStrokePoint([{ x: 10, y: 10 }], { x: 10.2, y: 10.2 }, 1),
      false,
    );
    assert.equal(
      shouldAppendStrokePoint([{ x: 10, y: 10 }], { x: 12, y: 10 }, 1),
      true,
    );
  });
});
