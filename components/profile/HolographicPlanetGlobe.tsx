"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";

export type PlanetGlobeSignal = {
  href: string;
  id: string;
  summary: string;
  title: string;
};

type TooltipState = PlanetGlobeSignal & {
  x: number;
  y: number;
};

type MobileSignalLabel = Pick<PlanetGlobeSignal, "id" | "title"> & {
  x: number;
  y: number;
};

const GLOBE_RADIUS = 1.72;
const GLOBE_Y = 0.34;
const BASE_Y = -2.08;

export function HolographicPlanetGlobe({
  emptyText,
  signals,
}: {
  emptyText: string;
  signals: PlanetGlobeSignal[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [mobileLabels, setMobileLabels] = useState<MobileSignalLabel[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const canvasElement = canvas;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.16, 6.35);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvasElement,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const globeGroup = new THREE.Group();
    globeGroup.position.y = GLOBE_Y;
    globeGroup.rotation.set(-0.12, -0.42, 0.02);
    scene.add(globeGroup);

    const bodyMaterial = new THREE.MeshBasicMaterial({
      color: 0x061d35,
      depthWrite: true,
      opacity: 0.72,
      transparent: true,
    });
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS, 96, 48),
      bodyMaterial,
    );
    globeGroup.add(body);

    const innerGlow = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.018, 96, 48),
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: 0x55dfff,
        depthWrite: false,
        opacity: 0.12,
        side: THREE.BackSide,
        transparent: true,
      }),
    );
    globeGroup.add(innerGlow);

    const gridMaterial = new THREE.LineBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: 0x6beaff,
      depthTest: false,
      depthWrite: false,
      opacity: 0.78,
      transparent: true,
    });
    createGlobeGrid(GLOBE_RADIUS * 1.012, gridMaterial).forEach((line) => {
      globeGroup.add(line);
    });

    const haloTexture = createRadialTexture([
      [0, "rgba(255,255,255,0.72)"],
      [0.13, "rgba(139,245,255,0.58)"],
      [0.36, "rgba(59,220,255,0.24)"],
      [1, "rgba(59,220,255,0)"],
    ]);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        map: haloTexture,
        opacity: 0.92,
        transparent: true,
      }),
    );
    halo.position.set(0, 0.24, -0.75);
    halo.scale.set(5.9, 5.9, 1);
    scene.add(halo);

    const beamMaterial = new THREE.LineBasicMaterial({
      blending: THREE.AdditiveBlending,
      color: 0x8ef7ff,
      depthWrite: false,
      opacity: 0.48,
      transparent: true,
    });
    createProjectionBase(beamMaterial).forEach((line) => scene.add(line));

    const markerTexture = createRadialTexture([
      [0, "rgba(255,255,255,1)"],
      [0.22, "rgba(255,255,255,0.98)"],
      [0.44, "rgba(170,245,255,0.55)"],
      [1, "rgba(170,245,255,0)"],
    ]);
    const markers = signals.map((signal, index) => {
      const marker = new THREE.Sprite(
        new THREE.SpriteMaterial({
          blending: THREE.AdditiveBlending,
          depthTest: true,
          depthWrite: false,
          map: markerTexture,
          transparent: true,
        }),
      );
      marker.position.copy(
        getSignalVector(index, signals.length, GLOBE_RADIUS + 0.075),
      );
      marker.scale.set(0.18, 0.18, 1);
      marker.userData.signal = signal;
      globeGroup.add(marker);
      return marker;
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hoverWorldPosition = new THREE.Vector3();
    const globeCenter = new THREE.Vector3();
    const markerNormal = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    const labelWorldPosition = new THREE.Vector3();
    const labelScreenPosition = new THREE.Vector3();
    const mobileLabelSnapshot = { current: "" };
    const mobileFrame = { current: 0 };
    const drag = {
      active: false,
      lastX: 0,
      lastY: 0,
      startX: 0,
      startY: 0,
      velocityX: 0,
      pending: false,
    };

    function resize() {
      const width = canvasElement.clientWidth;
      const height = canvasElement.clientHeight;

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.position.z = camera.aspect < 0.82 ? 9.15 : 6.35;
      camera.updateProjectionMatrix();
    }

    function markerIsFacingCamera(marker: THREE.Object3D) {
      marker.getWorldPosition(hoverWorldPosition);
      globeGroup.getWorldPosition(globeCenter);
      markerNormal.subVectors(hoverWorldPosition, globeCenter).normalize();
      cameraDirection.subVectors(camera.position, hoverWorldPosition).normalize();
      return markerNormal.dot(cameraDirection) > 0.08;
    }

    function updateMobileLabels() {
      mobileFrame.current += 1;

      if (mobileFrame.current % 3 !== 0) {
        return;
      }

      const width = canvasElement.clientWidth;
      const height = canvasElement.clientHeight;

      if (width >= 640 || signals.length === 0) {
        if (mobileLabelSnapshot.current !== "[]") {
          mobileLabelSnapshot.current = "[]";
          setMobileLabels([]);
        }
        return;
      }

      const nextLabels = markers
        .flatMap((marker) => {
          if (!markerIsFacingCamera(marker)) {
            return [];
          }

          const signal = marker.userData.signal as PlanetGlobeSignal;
          marker.getWorldPosition(labelWorldPosition);
          labelScreenPosition.copy(labelWorldPosition).project(camera);

          const x = (labelScreenPosition.x * 0.5 + 0.5) * width;
          const y = (-labelScreenPosition.y * 0.5 + 0.5) * height;

          if (x < 16 || x > width - 16 || y < 36 || y > height - 24) {
            return [];
          }

          return [
            {
              id: signal.id,
              title: signal.title,
              x: Math.round(clamp(x, 54, width - 54)),
              y: Math.round(clamp(y - 18, 54, height - 36)),
            },
          ];
        })
        .slice(0, 8);

      const snapshot = nextLabels
        .map((label) => `${label.id}:${label.x}:${label.y}:${label.title}`)
        .join("|");

      if (snapshot !== mobileLabelSnapshot.current) {
        mobileLabelSnapshot.current = snapshot;
        setMobileLabels(nextLabels);
      }
    }

    function setPointerFromEvent(event: PointerEvent) {
      const rect = canvasElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      return rect;
    }

    function eventHitsGlobe(event: PointerEvent) {
      setPointerFromEvent(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(body, false).length > 0;
    }

    function getMarkerAt(event: PointerEvent) {
      setPointerFromEvent(event);
      raycaster.setFromCamera(pointer, camera);
      return raycaster
        .intersectObjects(markers, false)
        .find((hit) => markerIsFacingCamera(hit.object))?.object as
        | THREE.Sprite
        | undefined;
    }

    function updateTooltip(event: PointerEvent) {
      const marker = getMarkerAt(event);

      if (!marker) {
        canvasElement.style.cursor = drag.active
          ? "grabbing"
          : eventHitsGlobe(event)
            ? "grab"
            : "default";
        setTooltip(null);
        return;
      }

      const rect = canvasElement.getBoundingClientRect();
      const signal = marker.userData.signal as PlanetGlobeSignal;
      canvasElement.style.cursor = "pointer";
      setTooltip({
        ...signal,
        x: clamp(event.clientX - rect.left, 126, rect.width - 126),
        y: clamp(event.clientY - rect.top, 88, rect.height - 18),
      });
    }

    function handlePointerDown(event: PointerEvent) {
      const startsOnGlobe = Boolean(getMarkerAt(event)) || eventHitsGlobe(event);

      if (!startsOnGlobe) {
        drag.active = false;
        drag.pending = false;
        drag.velocityX = 0;
        canvasElement.style.cursor = "default";
        setTooltip(null);
        return;
      }

      drag.active = event.pointerType === "mouse";
      drag.pending = !drag.active;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.startX = event.clientX;
      drag.startY = event.clientY;
      drag.velocityX = 0;
      canvasElement.style.cursor = drag.active ? "grabbing" : "grab";

      if (drag.active) {
        event.preventDefault();
        canvasElement.setPointerCapture(event.pointerId);
      }
    }

    function handlePointerMove(event: PointerEvent) {
      if (drag.pending) {
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absY > 8 && absY > absX) {
          drag.pending = false;
          drag.velocityX = 0;
          canvasElement.style.cursor = eventHitsGlobe(event) ? "grab" : "default";
          return;
        }

        if (absX > 4 && absX >= absY) {
          drag.active = true;
          drag.pending = false;
          canvasElement.setPointerCapture(event.pointerId);
          canvasElement.style.cursor = "grabbing";
        } else {
          return;
        }
      }

      if (!drag.active) {
        updateTooltip(event);
        return;
      }

      event.preventDefault();
      const dx = event.clientX - drag.lastX;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.velocityX = dx * 0.0012;
      globeGroup.rotation.y += dx * 0.008;
      setTooltip(null);
    }

    function handlePointerUp(event: PointerEvent) {
      const wasInteractive = drag.active || drag.pending;
      const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
      drag.active = false;
      drag.pending = false;
      canvasElement.style.cursor = eventHitsGlobe(event) ? "grab" : "default";

      if (canvasElement.hasPointerCapture(event.pointerId)) {
        canvasElement.releasePointerCapture(event.pointerId);
      }

      if (wasInteractive && moved < 9) {
        const marker = getMarkerAt(event);
        const signal = marker?.userData.signal as PlanetGlobeSignal | undefined;

        if (signal) {
          router.push(signal.href);
        }
      }
    }

    function handlePointerCancel(event: PointerEvent) {
      drag.active = false;
      drag.pending = false;
      drag.velocityX = 0;

      if (canvasElement.hasPointerCapture(event.pointerId)) {
        canvasElement.releasePointerCapture(event.pointerId);
      }

      canvasElement.style.cursor = "default";
      setTooltip(null);
    }

    function handlePointerLeave() {
      if (!drag.active && !drag.pending) {
        canvasElement.style.cursor = "default";
        setTooltip(null);
      }
    }

    canvasElement.addEventListener("pointerdown", handlePointerDown);
    canvasElement.addEventListener("pointermove", handlePointerMove);
    canvasElement.addEventListener("pointerup", handlePointerUp);
    canvasElement.addEventListener("pointercancel", handlePointerCancel);
    canvasElement.addEventListener("pointerleave", handlePointerLeave);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvasElement);
    resize();

    let frame = 0;

    function animate() {
      if (!prefersReducedMotion && !drag.active && !drag.pending) {
        globeGroup.rotation.y += 0.0022 + drag.velocityX;
        drag.velocityX *= 0.94;
      }

      halo.material.opacity = prefersReducedMotion
        ? 0.78
        : 0.78 + Math.sin(Date.now() * 0.0014) * 0.08;
      updateMobileLabels();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvasElement.removeEventListener("pointerdown", handlePointerDown);
      canvasElement.removeEventListener("pointermove", handlePointerMove);
      canvasElement.removeEventListener("pointerup", handlePointerUp);
      canvasElement.removeEventListener("pointercancel", handlePointerCancel);
      canvasElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.dispose();
      scene.traverse((object) => {
        const maybeMesh = object as THREE.Mesh | THREE.Line | THREE.Sprite;
        maybeMesh.geometry?.dispose();

        if (Array.isArray(maybeMesh.material)) {
          maybeMesh.material.forEach((material) => material.dispose());
        } else {
          maybeMesh.material?.dispose();
        }
      });
      haloTexture.dispose();
      markerTexture.dispose();
    };
  }, [router, signals]);

  return (
    <div className="relative h-[clamp(21rem,68svh,35rem)] w-full overflow-hidden rounded-b-[1.5rem] bg-slate-950">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 48%, rgba(103,232,249,0.26), transparent 36%), radial-gradient(circle at 50% 80%, rgba(103,232,249,0.24), transparent 30%), linear-gradient(180deg, rgba(2,6,23,0.2), rgba(2,6,23,0.94))",
        }}
      />
      <canvas
        aria-label="Interactive 3D holographic planet"
        className="absolute inset-0 h-full w-full cursor-default"
        ref={canvasRef}
        style={{ touchAction: "pan-y" }}
      />
      <div className="planet-scanline pointer-events-none absolute inset-0 opacity-35 mix-blend-screen" />

      {mobileLabels.map((label) => (
        <div
          className="pointer-events-none absolute z-20 max-w-[7.25rem] -translate-x-1/2 -translate-y-full truncate rounded-full border border-cyan-100/35 bg-slate-950/82 px-2.5 py-1 text-[0.62rem] font-black leading-none text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.28)] backdrop-blur-md sm:hidden"
          key={label.id}
          style={{ left: label.x, top: label.y }}
        >
          {label.title}
        </div>
      ))}

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-20 w-64 max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] rounded-2xl border border-cyan-100/25 bg-slate-950/92 px-3.5 py-3 text-left shadow-2xl shadow-cyan-950/40 backdrop-blur-md"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="truncate text-xs font-semibold text-cyan-50">{tooltip.title}</p>
          <p className="mt-1 line-clamp-3 text-[0.7rem] leading-4 text-slate-300">
            {tooltip.summary}
          </p>
        </div>
      ) : null}

      {signals.length === 0 ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 w-[min(78%,18rem)] -translate-x-1/2 rounded-2xl border border-dashed border-cyan-100/30 bg-slate-950/70 px-4 py-3 text-center text-sm font-medium text-cyan-50 backdrop-blur">
          {emptyText}
        </div>
      ) : null}

      {signals.length > 0 ? (
        <ul className="sr-only">
          {signals.map((signal) => (
            <li key={signal.id}>
              <a href={signal.href}>{signal.title}</a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function createGlobeGrid(radius: number, material: THREE.LineBasicMaterial) {
  const lines: (THREE.Line | THREE.LineLoop)[] = [];

  for (let degrees = -75; degrees <= 75; degrees += 15) {
    const latitude = THREE.MathUtils.degToRad(degrees);
    const y = Math.sin(latitude) * radius;
    const ringRadius = Math.cos(latitude) * radius;
    const points: THREE.Vector3[] = [];

    for (let index = 0; index < 144; index += 1) {
      const angle = (index / 144) * Math.PI * 2;
      points.push(
        new THREE.Vector3(Math.cos(angle) * ringRadius, y, Math.sin(angle) * ringRadius),
      );
    }

    lines.push(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  for (let degrees = 0; degrees < 180; degrees += 15) {
    const longitude = THREE.MathUtils.degToRad(degrees);
    const points: THREE.Vector3[] = [];

    for (let index = 0; index < 144; index += 1) {
      const polar = (index / 144) * Math.PI * 2;
      const x = Math.cos(polar) * Math.cos(longitude) * radius;
      const y = Math.sin(polar) * radius;
      const z = Math.cos(polar) * Math.sin(longitude) * radius;
      points.push(new THREE.Vector3(x, y, z));
    }

    lines.push(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  return lines;
}

function createProjectionBase(material: THREE.LineBasicMaterial) {
  const lines: (THREE.Line | THREE.LineLoop)[] = [];
  const origin = new THREE.Vector3(0, BASE_Y, 0);

  for (let index = 0; index < 15; index += 1) {
    const angle = (index / 15) * Math.PI * 2;
    const target = new THREE.Vector3(
      Math.cos(angle) * 1.08,
      GLOBE_Y - GLOBE_RADIUS * 0.79,
      Math.sin(angle) * 1.08,
    );
    lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints([origin, target]), material));
  }

  for (const radius of [0.34, 0.52, 0.72]) {
    const points: THREE.Vector3[] = [];

    for (let index = 0; index < 128; index += 1) {
      const angle = (index / 128) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, BASE_Y, Math.sin(angle) * radius));
    }

    lines.push(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  lines.push(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, BASE_Y, 0),
        new THREE.Vector3(0, GLOBE_Y - GLOBE_RADIUS * 0.68, 0),
      ]),
      material,
    ),
  );

  return lines;
}

function createRadialTexture(stops: [number, string][]) {
  const canvas = document.createElement("canvas");
  canvas.height = 256;
  canvas.width = 256;
  const context = canvas.getContext("2d");

  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
  stops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function getSignalVector(index: number, total: number, radius: number) {
  if (total === 1) {
    return new THREE.Vector3(0.34, 0.36, 0.88).normalize().multiplyScalar(radius);
  }

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - ((index + 0.5) / total) * 2;
  const latitude = clamp(y, -0.82, 0.82);
  const ring = Math.sqrt(1 - latitude * latitude);
  const theta = index * goldenAngle + 0.85;

  return new THREE.Vector3(
    Math.cos(theta) * ring,
    latitude,
    Math.sin(theta) * ring,
  )
    .normalize()
    .multiplyScalar(radius);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
