import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDesktopNavPanelGeometry } from "./nav-panel-geometry.js";

describe("desktop nav panel geometry", () => {
  it("keeps the notifications panel inside the viewport and points to its icon", () => {
    const geometry = getDesktopNavPanelGeometry({
      side: "notifications",
      anchorRect: { bottom: 64, left: 978, width: 44 },
      viewportWidth: 1200,
      viewportHeight: 800,
    });

    assert.deepEqual(geometry, {
      left: 764,
      maxHeight: 708,
      pointerX: 236,
      top: 76,
      width: 420,
    });
  });

  it("uses the wider Explore panel without overflowing a narrow desktop", () => {
    const geometry = getDesktopNavPanelGeometry({
      side: "explore",
      anchorRect: { bottom: 70, left: 720, width: 44 },
      viewportWidth: 800,
      viewportHeight: 600,
    });

    assert.equal(geometry.width, 480);
    assert.equal(geometry.left, 304);
    assert.equal(geometry.pointerX, 438);
    assert.equal(geometry.top, 82);
    assert.equal(geometry.maxHeight, 502);
    assert.ok(geometry.left + geometry.width <= 800 - 16);
  });
});
