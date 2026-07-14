export type NavPanelSide = "explore" | "notifications";

export type NavPanelGeometry = {
  left: number;
  maxHeight: number;
  pointerX: number;
  top: number;
  width: number;
};

export function getDesktopNavPanelGeometry(options: {
  side: NavPanelSide;
  anchorRect: Pick<DOMRect, "bottom" | "left" | "width">;
  viewportWidth: number;
  viewportHeight: number;
  gap?: number;
  margin?: number;
}): NavPanelGeometry;
