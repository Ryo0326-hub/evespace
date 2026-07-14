const PANEL_WIDTHS = {
  explore: 480,
  notifications: 420,
};

export function getDesktopNavPanelGeometry({
  side,
  anchorRect,
  viewportWidth,
  viewportHeight,
  gap = 12,
  margin = 16,
}) {
  const availableWidth = Math.max(0, viewportWidth - margin * 2);
  const width = Math.min(PANEL_WIDTHS[side], availableWidth);
  const anchorCenter = anchorRect.left + anchorRect.width / 2;
  const unclampedLeft = anchorCenter - width / 2;
  const left = clamp(unclampedLeft, margin, viewportWidth - width - margin);
  const top = anchorRect.bottom + gap;
  const maxHeight = Math.max(0, viewportHeight - top - margin);
  const pointerX = clamp(anchorCenter - left, 18, Math.max(18, width - 18));

  return { left, maxHeight, pointerX, top, width };
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}
