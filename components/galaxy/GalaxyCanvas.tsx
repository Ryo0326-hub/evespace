"use client";

import { useEffect, useMemo, useRef } from "react";
import { galaxySize, initialCamera } from "@/lib/constants";
import type { Event } from "@/types/evespace";

type Camera = {
  x: number;
  y: number;
  zoom: number;
};

type DecorativeStar = {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  twinkleSpeed: number;
};

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
}

function createDecorativeStars(count: number): DecorativeStar[] {
  const random = seededRandom(1227);

  return Array.from({ length: count }, () => ({
    x: random() * galaxySize.width,
    y: random() * galaxySize.height,
    radius: 0.45 + random() * 1.8,
    opacity: 0.25 + random() * 0.75,
    twinkleSpeed: 0.001 + random() * 0.0025,
  }));
}

export function GalaxyCanvas({
  events,
  selectedEvent,
  onZoomComplete,
}: {
  events: Event[];
  selectedEvent: Event | null;
  onZoomComplete: (event: Event) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera>({ ...initialCamera });
  const selectedRef = useRef<Event | null>(null);
  const completedRef = useRef(false);
  const animationRef = useRef<{
    start: number;
    from: Camera;
    to: Camera;
  } | null>(null);

  const decorativeStars = useMemo(() => createDecorativeStars(1800), []);

  useEffect(() => {
    selectedRef.current = selectedEvent;
    completedRef.current = false;

    if (!selectedEvent) {
      animationRef.current = null;
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      onZoomComplete(selectedEvent);
      return;
    }

    animationRef.current = {
      start: performance.now(),
      from: { ...cameraRef.current },
      to: {
        x: selectedEvent.starX,
        y: selectedEvent.starY,
        zoom: 2.5,
      },
    };
  }, [onZoomComplete, selectedEvent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let frame = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const toScreen = (x: number, y: number) => ({
      x: (x - cameraRef.current.x) * cameraRef.current.zoom + width / 2,
      y: (y - cameraRef.current.y) * cameraRef.current.zoom + height / 2,
    });

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#030712";
      context.fillRect(0, 0, width, height);

      const animation = animationRef.current;
      if (animation) {
        const progress = Math.min((time - animation.start) / 1600, 1);
        const eased = easeInOutCubic(progress);
        cameraRef.current = {
          x: animation.from.x + (animation.to.x - animation.from.x) * eased,
          y: animation.from.y + (animation.to.y - animation.from.y) * eased,
          zoom:
            animation.from.zoom +
            (animation.to.zoom - animation.from.zoom) * eased,
        };

        if (progress >= 1 && selectedRef.current && !completedRef.current) {
          completedRef.current = true;
          onZoomComplete(selectedRef.current);
        }
      }

      decorativeStars.forEach((star) => {
        const point = toScreen(star.x, star.y);
        if (
          point.x < -40 ||
          point.y < -40 ||
          point.x > width + 40 ||
          point.y > height + 40
        ) {
          return;
        }

        const twinkle =
          star.opacity + Math.sin(time * star.twinkleSpeed + star.x) * 0.18;
        context.beginPath();
        context.fillStyle = `rgba(248, 250, 252, ${Math.max(0.12, twinkle)})`;
        context.arc(
          point.x,
          point.y,
          star.radius * Math.max(0.7, cameraRef.current.zoom * 0.75),
          0,
          Math.PI * 2,
        );
        context.fill();
      });

      events.forEach((event) => {
        const point = toScreen(event.starX, event.starY);
        const isSelected = selectedRef.current?.id === event.id;
        const radius =
          (isSelected ? 6 : 4) *
          event.starSize *
          Math.max(1, cameraRef.current.zoom * 0.45);

        const gradient = context.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          radius * (isSelected ? 5.4 : 3.8),
        );
        gradient.addColorStop(
          0,
          `rgba(248, 250, 252, ${0.9 * event.starBrightness})`,
        );
        gradient.addColorStop(0.28, "rgba(165, 243, 252, 0.65)");
        gradient.addColorStop(0.62, "rgba(196, 181, 253, 0.24)");
        gradient.addColorStop(1, "rgba(196, 181, 253, 0)");

        context.beginPath();
        context.fillStyle = gradient;
        context.arc(point.x, point.y, radius * (isSelected ? 5.4 : 3.8), 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.fillStyle = "#f8fafc";
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      });

      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, [decorativeStars, events, onZoomComplete]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
