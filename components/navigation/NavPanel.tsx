"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  getDesktopNavPanelGeometry,
  type NavPanelGeometry,
  type NavPanelSide,
} from "@/lib/navigation/nav-panel-geometry";

type PanelLayout =
  | { mode: "pending"; geometry: null }
  | { mode: "mobile"; geometry: null }
  | { mode: "desktop"; geometry: NavPanelGeometry };

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function NavPanel({
  children,
  side,
  title,
}: {
  children: ReactNode;
  side: NavPanelSide;
  title: string;
}) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [layout, setLayout] = useState<PanelLayout>({
    mode: "pending",
    geometry: null,
  });
  const closingRef = useRef(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const portalRoot = hydrated ? document.body : null;

  const closePanel = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => router.back(), reduceMotion ? 0 : 180);
  }, [router]);

  useLayoutEffect(() => {
    if (!portalRoot) return undefined;

    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const anchor = document.querySelector<HTMLElement>(
      `[data-nav-panel-anchor="${side}"]`,
    );

    function updateLayout() {
      if (!desktopQuery.matches) {
        setLayout({ mode: "mobile", geometry: null });
        return;
      }

      if (!anchor) {
        setLayout({ mode: "pending", geometry: null });
        return;
      }

      setLayout({
        mode: "desktop",
        geometry: getDesktopNavPanelGeometry({
          side,
          anchorRect: anchor.getBoundingClientRect(),
          viewportHeight: window.visualViewport?.height ?? window.innerHeight,
          viewportWidth: window.visualViewport?.width ?? window.innerWidth,
        }),
      });
    }

    let animationFrame = 0;
    function scheduleLayoutUpdate() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateLayout);
    }

    scheduleLayoutUpdate();
    const resizeObserver = new ResizeObserver(scheduleLayoutUpdate);
    if (anchor) resizeObserver.observe(anchor);
    desktopQuery.addEventListener("change", scheduleLayoutUpdate);
    window.addEventListener("resize", scheduleLayoutUpdate);
    window.visualViewport?.addEventListener("resize", scheduleLayoutUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      desktopQuery.removeEventListener("change", scheduleLayoutUpdate);
      window.removeEventListener("resize", scheduleLayoutUpdate);
      window.visualViewport?.removeEventListener("resize", scheduleLayoutUpdate);
    };
  }, [portalRoot, side]);

  const panelReady = layout.mode !== "pending";

  useEffect(() => {
    if (!portalRoot || !panelReady) return undefined;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [closePanel, panelReady, portalRoot]);

  if (!portalRoot) return null;

  const panelStyle = layout.mode === "desktop"
    ? ({
        left: `${layout.geometry.left}px`,
        maxHeight: `${layout.geometry.maxHeight}px`,
        top: `${layout.geometry.top}px`,
        width: `${layout.geometry.width}px`,
        "--nav-panel-pointer-x": `${layout.geometry.pointerX}px`,
      } as CSSProperties)
    : undefined;

  return createPortal(
    <>
      <button
        aria-label={`Close ${title.toLowerCase()}`}
        className="nav-panel-backdrop fixed inset-0 z-[90] cursor-default bg-slate-950/65 backdrop-blur-[2px]"
        data-closing={closing}
        data-positioned={panelReady}
        onClick={closePanel}
        type="button"
      />
      <section
        aria-labelledby={`${side}-panel-title`}
        aria-modal="true"
        className={`nav-panel nav-panel-${side} fixed inset-0 z-[100] flex h-[100dvh] min-h-0 w-screen max-w-none flex-col overflow-hidden bg-slate-950 text-left text-white shadow-2xl shadow-black/45 md:inset-auto md:h-auto md:rounded-3xl md:border md:border-white/15`}
        data-closing={closing}
        data-positioned={panelReady}
        ref={panelRef}
        role="dialog"
        style={panelStyle}
      >
        <header className="nav-panel-header flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3 pt-4 sm:px-5 md:py-4">
          <h1 className="text-lg font-bold" id={`${side}-panel-title`}>
            {title}
          </h1>
          <button
            aria-label={`Close ${title.toLowerCase()}`}
            className="flex size-9 items-center justify-center rounded-full bg-white/8 text-xl text-slate-200 transition hover:bg-white/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"
            onClick={closePanel}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div className="nav-panel-content min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {children}
        </div>
      </section>
    </>,
    portalRoot,
  );
}
