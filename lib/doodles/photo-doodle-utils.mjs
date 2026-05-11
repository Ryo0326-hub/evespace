export const maxDoodleCanvasSide = 2048;

export function getBoundedImageSize(width, height, maxSide = maxDoodleCanvasSide) {
  const safeWidth = Math.max(1, Number(width) || 1);
  const safeHeight = Math.max(1, Number(height) || 1);
  const longestSide = Math.max(safeWidth, safeHeight);

  if (longestSide <= maxSide) {
    return {
      width: Math.round(safeWidth),
      height: Math.round(safeHeight),
    };
  }

  const scale = maxSide / longestSide;

  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

export function makeDoodleFileName(originalName) {
  const withoutExtension = String(originalName || "memory-photo")
    .replace(/\.[^.]+$/, "")
    .trim();
  const safeName = withoutExtension.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");

  return `${safeName || "memory-photo"}-doodle.jpg`;
}

export function shouldAppendStrokePoint(points, nextPoint, minDistance = 0.75) {
  if (!Array.isArray(points) || points.length === 0) {
    return true;
  }

  const previousPoint = points[points.length - 1];
  const distance = Math.hypot(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y);

  return distance >= minDistance;
}
