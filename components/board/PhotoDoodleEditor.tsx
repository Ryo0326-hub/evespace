"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  getBoundedImageSize,
  makeDoodleFileName,
  shouldAppendStrokePoint,
} from "@/lib/doodles/photo-doodle-utils.mjs";
import { cn, formatDate } from "@/lib/utils";

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: string;
  color: string;
  size: number;
  points: Point[];
};

type CanvasSize = {
  width: number;
  height: number;
};

export type PhotoDoodleEditorHandle = {
  hasDoodles: () => boolean;
  prepareEditedFile: () => Promise<File | null>;
};

const brushColors = [
  { name: "black", value: "#0f172a" },
  { name: "white", value: "#ffffff" },
  { name: "cyan", value: "#22d3ee" },
  { name: "rose", value: "#fb7185" },
  { name: "gold", value: "#fbbf24" },
  { name: "lime", value: "#a3e635" },
];
const brushSizes = [5, 10, 16, 24];
const exportQualities = [0.92, 0.84, 0.76, 0.68];

function createStrokeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `stroke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

async function exportCanvasBlob(canvas: HTMLCanvasElement) {
  let fallback: Blob | null = null;

  for (const quality of exportQualities) {
    const blob = await canvasToBlob(canvas, quality);

    if (!blob) {
      continue;
    }

    fallback = blob;

    if (blob.size <= 5 * 1024 * 1024) {
      return blob;
    }
  }

  return fallback;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) {
    return;
  }

  configureStrokeContext(ctx, stroke);

  if (stroke.points.length === 1) {
    drawStrokeDot(ctx, stroke.points[0], stroke.size);
    return;
  }

  const [firstPoint] = stroke.points;
  ctx.beginPath();
  ctx.moveTo(firstPoint.x, firstPoint.y);

  for (let index = 1; index < stroke.points.length - 1; index += 1) {
    const point = stroke.points[index];
    const nextPoint = stroke.points[index + 1];
    const midPoint = {
      x: (point.x + nextPoint.x) / 2,
      y: (point.y + nextPoint.y) / 2,
    };

    ctx.quadraticCurveTo(point.x, point.y, midPoint.x, midPoint.y);
  }

  const lastPoint = stroke.points[stroke.points.length - 1];
  ctx.lineTo(lastPoint.x, lastPoint.y);
  ctx.stroke();
}

function configureStrokeContext(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.lineWidth = stroke.size;
}

function drawStrokeDot(
  ctx: CanvasRenderingContext2D,
  point: Point,
  brushSize: number,
) {
  ctx.beginPath();
  ctx.arc(point.x, point.y, Math.max(1, brushSize / 2), 0, Math.PI * 2);
  ctx.fill();
}

function drawStrokeSegment(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  fromPoint: Point,
  toPoint: Point,
) {
  configureStrokeContext(ctx, stroke);
  ctx.beginPath();
  ctx.moveTo(fromPoint.x, fromPoint.y);
  ctx.lineTo(toPoint.x, toPoint.y);
  ctx.stroke();
}

export const PhotoDoodleEditor = forwardRef<
  PhotoDoodleEditorHandle,
  {
    file: File | null;
    imageUrl: string | null;
    authorDisplayName: string;
    caption: string;
    createdAt: string;
    onDoodleStateChange: (hasDoodles: boolean) => void;
  }
>(function PhotoDoodleEditor(
  {
    authorDisplayName,
    caption,
    createdAt,
    file,
    imageUrl,
    onDoodleStateChange,
  },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activeStrokeIdRef = useRef<string | null>(null);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [brushColor, setBrushColor] = useState(brushColors[0].value);
  const [brushSize, setBrushSize] = useState(brushSizes[1]);
  const [imageReady, setImageReady] = useState(false);

  const drawCanvas = useCallback(
    (nextStrokes = strokesRef.current) => {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      const context = canvas?.getContext("2d");

      if (!canvas || !image || !context || !canvasSize) {
        return;
      }

      context.clearRect(0, 0, canvasSize.width, canvasSize.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvasSize.width, canvasSize.height);
      context.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);

      for (const stroke of nextStrokes) {
        drawStroke(context, stroke);
      }
    },
    [canvasSize],
  );

  const commitStrokes = useCallback(
    (nextStrokes: Stroke[]) => {
      strokesRef.current = nextStrokes;
      setStrokes(nextStrokes);
      onDoodleStateChange(nextStrokes.length > 0);
      drawCanvas(nextStrokes);
    },
    [drawCanvas, onDoodleStateChange],
  );

  useEffect(() => {
    let cancelled = false;
    setImageReady(false);
    setCanvasSize(null);
    strokesRef.current = [];
    activeStrokeRef.current = null;
    activeStrokeIdRef.current = null;
    setStrokes([]);
    onDoodleStateChange(false);

    if (!imageUrl) {
      imageRef.current = null;
      return undefined;
    }

    const image = new Image();

    image.onload = () => {
      if (cancelled) {
        return;
      }

      imageRef.current = image;
      setCanvasSize(getBoundedImageSize(image.naturalWidth, image.naturalHeight));
      setImageReady(true);
    };
    image.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl, onDoodleStateChange]);

  useEffect(() => {
    if (imageReady) {
      drawCanvas();
    }
  }, [drawCanvas, imageReady]);

  useImperativeHandle(
    ref,
    () => ({
      hasDoodles: () => strokesRef.current.length > 0,
      prepareEditedFile: async () => {
        const canvas = canvasRef.current;

        if (!file || strokesRef.current.length === 0 || !canvas) {
          return null;
        }

        const blob = await exportCanvasBlob(canvas);

        if (!blob) {
          throw new Error("Could not export doodled photo.");
        }

        return new File([blob], makeDoodleFileName(file.name), {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      },
    }),
    [file],
  );

  function getCanvasPoint(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number,
  ): Point {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    return { x, y };
  }

  function getPointerPoints(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const nativeEvent = event.nativeEvent;
    const sourceEvents =
      typeof nativeEvent.getCoalescedEvents === "function"
        ? nativeEvent.getCoalescedEvents()
        : [nativeEvent];

    return sourceEvents.map((sourceEvent) =>
      getCanvasPoint(canvas, sourceEvent.clientX, sourceEvent.clientY),
    );
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!imageReady) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(
      event.currentTarget,
      event.clientX,
      event.clientY,
    );

    const stroke: Stroke = {
      id: createStrokeId(),
      color: brushColor,
      size: brushSize,
      points: [point],
    };

    activeStrokeIdRef.current = stroke.id;
    activeStrokeRef.current = stroke;
    strokesRef.current = [...strokesRef.current, stroke];
    setStrokes(strokesRef.current);
    onDoodleStateChange(true);

    const context = canvasRef.current?.getContext("2d");

    if (context) {
      configureStrokeContext(context, stroke);
      drawStrokeDot(context, point, stroke.size);
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const activeStrokeId = activeStrokeIdRef.current;
    const activeStroke = activeStrokeRef.current;

    if (!activeStrokeId || !activeStroke || !imageReady) {
      return;
    }

    event.preventDefault();

    const context = canvasRef.current?.getContext("2d");

    if (!context) {
      return;
    }

    for (const point of getPointerPoints(event)) {
      if (!shouldAppendStrokePoint(activeStroke.points, point)) {
        continue;
      }

      const previousPoint = activeStroke.points[activeStroke.points.length - 1];
      activeStroke.points.push(point);
      drawStrokeSegment(context, activeStroke, previousPoint, point);
    }
  }

  function handlePointerEnd(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!activeStrokeIdRef.current) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    drawCanvas(strokesRef.current);
    setStrokes([...strokesRef.current]);
    activeStrokeIdRef.current = null;
    activeStrokeRef.current = null;
  }

  function undoStroke() {
    commitStrokes(strokesRef.current.slice(0, -1));
  }

  function clearStrokes() {
    commitStrokes([]);
  }

  return (
    <section className="grid min-w-0 gap-3">
      <article className="min-w-0 overflow-hidden rounded-2xl border-2 border-black bg-white p-3 text-black shadow-sm sm:p-4">
        <header className="flex min-h-12 items-center justify-between gap-3 px-1 pb-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
              {authorDisplayName || "You"}
            </p>
            <time className="text-xs text-slate-500">{formatDate(createdAt)}</time>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border border-black bg-white">
          {imageUrl ? (
            <canvas
              aria-label="Doodle drawing surface"
              className={cn(
                "block aspect-[4/3] h-auto w-full touch-none select-none object-cover overscroll-contain [-webkit-touch-callout:none]",
                imageReady ? "cursor-crosshair" : "cursor-wait opacity-70",
              )}
              height={canvasSize?.height ?? 1}
              onPointerCancel={handlePointerEnd}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onContextMenu={(event) => event.preventDefault()}
              ref={canvasRef}
              style={{ touchAction: "none" }}
              width={canvasSize?.width ?? 1}
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 px-4 text-center text-sm font-semibold text-slate-500">
              Upload a photo to doodle on it.
            </div>
          )}
        </div>

        <div className="px-1 pb-1 pt-4">
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-black">
            {caption || "Your note will appear here."}
          </p>
        </div>
      </article>

      <div className="grid min-w-0 gap-3 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/55 p-2.5 shadow-2xl shadow-black/25 sm:p-4">
        <div
          className="flex min-w-0 flex-wrap items-center gap-2 max-[360px]:gap-1.5"
          role="radiogroup"
          aria-label="Brush color"
        >
          {brushColors.map((color) => (
            <button
              aria-label={`Use ${color.name} brush`}
              aria-pressed={brushColor === color.value}
              className={cn(
                "h-8 w-8 shrink-0 rounded-full border border-white/30 transition focus:outline-none focus:ring-2 focus:ring-cyan-200 max-[360px]:h-7 max-[360px]:w-7",
                brushColor === color.value &&
                  "scale-110 ring-2 ring-cyan-200 ring-offset-2 ring-offset-slate-950",
              )}
              key={color.value}
              onClick={() => setBrushColor(color.value)}
              style={{ backgroundColor: color.value }}
              title={`${color.name} brush`}
              type="button"
            />
          ))}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 min-[430px]:grid-cols-[auto_minmax(0,1fr)]">
          <div className="grid min-w-0 grid-cols-4 gap-1 rounded-full border border-white/10 bg-white/[0.06] p-1">
            {brushSizes.map((size) => (
              <button
                aria-label={`Use ${size}px brush`}
                aria-pressed={brushSize === size}
                className={cn(
                  "flex h-8 min-w-0 items-center justify-center rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-200",
                  brushSize === size && "bg-white text-slate-950 hover:bg-white",
                )}
                key={size}
                onClick={() => setBrushSize(size)}
                title="Brush size"
                type="button"
              >
                <span
                  className="rounded-full bg-current"
                  style={{ height: `${Math.max(4, size / 2)}px`, width: `${Math.max(4, size / 2)}px` }}
                />
              </button>
            ))}
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-2">
            <button
              className="min-h-9 min-w-0 rounded-full border border-white/10 bg-white/[0.07] px-3 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={strokes.length === 0}
              onClick={undoStroke}
              type="button"
            >
              Undo
            </button>
            <button
              className="min-h-9 min-w-0 rounded-full border border-rose-200/20 bg-rose-400/10 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={strokes.length === 0}
              onClick={clearStrokes}
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </section>
  );
});
