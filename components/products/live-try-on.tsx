"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  FlipHorizontal2,
  Hand,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

// Error Boundary for 3D models
class ErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("3D Model Error:", error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Render nothing, fallback to 2D
    }
    return this.props.children;
  }
}

// Lazy load 3D components for performance
const ThreeARCanvas = dynamic(
  () => import("@/components/ar/ThreeARCanvas").then((mod) => mod.ThreeARCanvas),
  { ssr: false }
) as any;
const Ring3DModel = dynamic(
  () => import("@/components/ar/Ring3DModel").then((mod) => mod.Ring3DModel),
  { ssr: false }
) as any;
const Bangle3DModel = dynamic(
  () => import("@/components/ar/Bangle3DModel").then((mod) => mod.Bangle3DModel),
  { ssr: false }
) as any;
const NosePin3DModel = dynamic(
  () => import("@/components/ar/NosePin3DModel").then((mod) => mod.NosePin3DModel),
  { ssr: false }
) as any;
const Earring3DModel = dynamic(
  () => import("@/components/ar/Earring3DModel").then((mod) => mod.Earring3DModel),
  { ssr: false }
) as any;
const Necklace3DModel = dynamic(
  () => import("@/components/ar/Necklace3DModel").then((mod) => mod.Necklace3DModel),
  { ssr: false }
) as any;

type JewelleryKind =
  | "ring"
  | "bangle"
  | "earring"
  | "necklace"
  | "nose"
  | "jewellery";

type LiveTryOnProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  imageUrl: string;
  jewelleryKind?: JewelleryKind;
};

type Landmark = { x: number; y: number; z?: number };

type Pose = {
  x: number;
  y: number;
  scalePx: number;
  rotation: number;
};

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm";
const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

function supportsHandAr(kind: JewelleryKind) {
  return kind === "ring" || kind === "bangle";
}

function supportsFaceAr(kind: JewelleryKind) {
  return kind === "nose" || kind === "earring" || kind === "necklace";
}

function supportsAr(kind: JewelleryKind) {
  return supportsHandAr(kind) || supportsFaceAr(kind);
}

function angleDeg(ax: number, ay: number, bx: number, by: number) {
  return (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPose(prev: Pose, next: Pose, t: number): Pose {
  let d = next.rotation - prev.rotation;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return {
    x: lerp(prev.x, next.x, t),
    y: lerp(prev.y, next.y, t),
    scalePx: lerp(prev.scalePx, next.scalePx, t),
    rotation: prev.rotation + d * t,
  };
}

function isBrightStudioBg(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = (r + g + b) / 3;
  if (lum > 248 && sat < 40) return true;
  if (lum > 235 && sat < 32) return true;
  if (lum > 220 && sat < 22) return true;
  if (lum > 200 && sat < 14) return true;
  if (lum > 188 && sat < 10) return true;
  // Cream / beige fabric product plates (common on necklace shots)
  if (lum > 175 && sat < 45 && r > 160 && g > 145 && b > 120 && r - b < 55) {
    return true;
  }
  if (lum > 155 && sat < 28 && Math.abs(r - g) < 18 && r > b) return true;
  return false;
}

function isSkinTone(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;
  const lum = (r + g + b) / 3;
  // Strong yellow gold is not skin
  if (r > 145 && g > 105 && b < 115 && r - b > 50 && g - b > 20 && sat > 35) {
    return false;
  }
  if (r < 50 || g < 25 || b < 10) return false;
  if (
    r > 70 &&
    g > 35 &&
    b > 18 &&
    r >= g - 5 &&
    g >= b - 12 &&
    r - b > 18 &&
    sat > 15 &&
    sat < 110 &&
    lum > 55 &&
    lum < 230
  ) {
    return true;
  }
  return false;
}

function isWarmMetal(r: number, g: number, b: number) {
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  // Only bright/mid gold & rose — never dark shadows (those caused black blobs)
  if (lum < 95) return false;
  if (r > 130 && g > 85 && r >= g && g >= b - 8 && r - b > 40 && sat > 32) {
    return true;
  }
  if (r > 170 && g > 125 && b > 70 && r >= g && sat > 22 && r - b > 28) {
    return true;
  }
  // Silver / white metal highlights
  if (lum > 175 && sat < 32 && Math.max(r, g, b) > 190 && !isSkinTone(r, g, b)) {
    return true;
  }
  return false;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    const absolute =
      src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:")
        ? src
        : `${window.location.origin}${src.startsWith("/") ? "" : "/"}${src}`;
    if (
      /^https?:\/\//i.test(absolute) &&
      !absolute.startsWith(window.location.origin)
    ) {
      el.crossOrigin = "anonymous";
    }
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Failed to load try-on image"));
    el.src = absolute;
  });
}

function cropOpaque(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  data: Uint8ClampedArray,
): string | null {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let opaque = 0;
  let lumSum = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] > 28) {
        opaque++;
        lumSum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (opaque < 80 || maxX <= minX || maxY <= minY) return null;
  const avgLum = lumSum / opaque;
  // Reject black/inky cutouts
  if (avgLum < 70) return null;
  const cover = opaque / (w * h);
  if (cover < 0.003 || cover > 0.92) return null;

  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const cropped = document.createElement("canvas");
  cropped.width = cw;
  cropped.height = ch;
  const cctx = cropped.getContext("2d", { willReadFrequently: true });
  if (!cctx) return null;
  cctx.drawImage(ctx.canvas, minX, minY, cw, ch, 0, 0, cw, ch);

  // Soft edge feather
  const out = cctx.getImageData(0, 0, cw, ch);
  const cd = out.data;
  const feather = Math.max(2, Math.round(Math.min(cw, ch) * 0.035));
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      if (cd[i + 3] === 0) continue;
      const edge = Math.min(x, y, cw - 1 - x, ch - 1 - y);
      if (edge < feather) {
        cd[i + 3] = Math.round(cd[i + 3] * (edge / feather));
      }
    }
  }
  cctx.putImageData(out, 0, 0);
  return cropped.toDataURL("image/png");
}

/**
 * Safe cutout: studio plate first; optional metal keep for on-model.
 * Quality-gated — never returns black blotch artifacts.
 */
async function prepareTryOnCutout(
  src: string,
  kind: JewelleryKind,
): Promise<string> {
  const img = await loadImage(src);
  const maxSide = 640;
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return src;

  const runPass = (mode: "studio" | "metal") => {
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    let skinCount = 0;
    let metalCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (isBrightStudioBg(r, g, b)) {
        data[i + 3] = 0;
        continue;
      }
      if (mode === "metal") {
        if (isSkinTone(r, g, b) && !isWarmMetal(r, g, b)) {
          data[i + 3] = 0;
          skinCount++;
          continue;
        }
        if (isWarmMetal(r, g, b)) {
          data[i + 3] = 255;
          metalCount++;
          continue;
        }
        // Drop ambiguous mid-tones (shadows / fabric) — prevents ink blobs
        const lum = (r + g + b) / 3;
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        if (lum < 100 || (sat < 18 && lum < 160)) {
          data[i + 3] = 0;
        } else {
          data[i + 3] = 0;
        }
      }
    }

    // Flood clear residual plate from edges (studio mode)
    if (mode === "studio") {
      const queue: number[] = [];
      const seen = new Uint8Array(w * h);
      const enqueue = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const idx = y * w + x;
        if (seen[idx]) return;
        seen[idx] = 1;
        const i = idx * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        const lum = (r + g + b) / 3;
        const sat = Math.max(r, g, b) - Math.min(r, g, b);
        if (a > 0 && !(isBrightStudioBg(r, g, b) || (lum > 205 && sat < 28))) {
          return;
        }
        data[i + 3] = 0;
        queue.push(idx);
      };
      for (let x = 0; x < w; x++) {
        enqueue(x, 0);
        enqueue(x, h - 1);
      }
      for (let y = 0; y < h; y++) {
        enqueue(0, y);
        enqueue(w - 1, y);
      }
      while (queue.length) {
        const idx = queue.pop()!;
        const x = idx % w;
        const y = (idx / w) | 0;
        enqueue(x + 1, y);
        enqueue(x - 1, y);
        enqueue(x, y + 1);
        enqueue(x, y - 1);
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return { data, skinCount, metalCount };
  };

  // Pass 1 — studio / fabric background only (safe default)
  const studio = runPass("studio");
  const studioUrl = cropOpaque(ctx, w, h, studio.data);

  // Pass 2 — metal-only when on-model / fabric plate still dominates
  const wantsMetal =
    kind === "ring" ||
    kind === "bangle" ||
    kind === "nose" ||
    kind === "earring" ||
    kind === "necklace";
  let metalUrl: string | null = null;
  if (wantsMetal) {
    const metal = runPass("metal");
    const skinRatio = metal.skinCount / (w * h);
    const metalRatio = metal.metalCount / (w * h);
    if (
      (skinRatio > 0.06 || kind === "necklace") &&
      metalRatio > 0.006 &&
      metalRatio < 0.55
    ) {
      metalUrl = cropOpaque(ctx, w, h, metal.data);
    }
  }

  const base = metalUrl || studioUrl || src;
  return polishWearableAsset(base, kind);
}

/**
 * Make cutout look worn: punch finger/wrist hole, punch up gold contrast,
 * soft contact shadow baked in — so it reads as jewellery, not a sticker.
 */
async function polishWearableAsset(
  src: string,
  kind: JewelleryKind,
): Promise<string> {
  try {
    const img = await loadImage(src);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return src;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return src;

    ctx.drawImage(img, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Pop metal / gem contrast so gold reads clearly on skin
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 20) continue;
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      const lum = (r + g + b) / 3;
      // Contrast around mid
      r = Math.min(255, Math.max(0, (r - lum) * 1.28 + lum * 1.04));
      g = Math.min(255, Math.max(0, (g - lum) * 1.28 + lum * 1.04));
      b = Math.min(255, Math.max(0, (b - lum) * 1.22 + lum * 1.02));
      // Warm gold lift
      if (r > g && g > b - 5) {
        r = Math.min(255, r * 1.06);
        g = Math.min(255, g * 1.03);
        b = Math.max(0, b * 0.96);
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    const cx = (w - 1) / 2;
    const cy = (h - 1) / 2;
    const rx = w * 0.48;
    const ry = h * 0.48;

    // Finger / wrist through-hole (occlusion) for rings & bangles
    if (kind === "ring" || kind === "bangle") {
      const hole = kind === "ring" ? 0.38 : 0.52;
      const holeRx = rx * hole;
      const holeRy = ry * hole * (kind === "ring" ? 0.92 : 0.78);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (data[i + 3] === 0) continue;
          const nx = (x - cx) / Math.max(1, holeRx);
          const ny = (y - cy) / Math.max(1, holeRy);
          const d = Math.sqrt(nx * nx + ny * ny);
          if (d < 0.82) {
            data[i + 3] = 0;
          } else if (d < 1) {
            data[i + 3] = Math.round(data[i + 3] * ((d - 0.82) / 0.18));
          }
          // Soft outer rim so plate corners vanish
          const ox = (x - cx) / rx;
          const oy = (y - cy) / ry;
          const od = Math.sqrt(ox * ox + oy * oy);
          if (od > 1.02) data[i + 3] = 0;
          else if (od > 0.9) {
            data[i + 3] = Math.round(data[i + 3] * (1 - (od - 0.9) / 0.12));
          }
        }
      }
    } else if (kind === "necklace" || kind === "earring" || kind === "nose") {
      // Soft oval crop — kills leftover square photo cards
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (data[i + 3] === 0) continue;
          const ox = (x - cx) / (rx * (kind === "necklace" ? 0.95 : 0.72));
          const oy = (y - cy) / (ry * (kind === "necklace" ? 1.05 : 0.72));
          const od = Math.sqrt(ox * ox + oy * oy);
          if (od > 1.05) data[i + 3] = 0;
          else if (od > 0.88) {
            data[i + 3] = Math.round(data[i + 3] * (1 - (od - 0.88) / 0.17));
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Bake a soft contact shadow underneath (separate layer, then composite)
    const out = document.createElement("canvas");
    out.width = w + 16;
    out.height = h + 20;
    const octx = out.getContext("2d");
    if (!octx) return canvas.toDataURL("image/png");

    octx.save();
    octx.translate(8, 10);
    octx.fillStyle = "rgba(0,0,0,0.28)";
    octx.beginPath();
    octx.ellipse(w / 2, h * 0.62, w * 0.34, h * 0.12, 0, 0, Math.PI * 2);
    octx.fill();
    octx.filter = "blur(3px)";
    octx.fillStyle = "rgba(0,0,0,0.18)";
    octx.beginPath();
    octx.ellipse(w / 2, h * 0.58, w * 0.4, h * 0.16, 0, 0, Math.PI * 2);
    octx.fill();
    octx.filter = "none";
    octx.drawImage(canvas, 0, 0);
    octx.restore();

    return out.toDataURL("image/png");
  } catch {
    return src;
  }
}

function landmarkToStage(
  landmark: Landmark,
  video: HTMLVideoElement,
  stage: HTMLElement,
  mirrored: boolean,
) {
  const cw = stage.clientWidth;
  const ch = stage.clientHeight;
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh || !cw || !ch) return { x: cw / 2, y: ch / 2 };

  const videoAspect = vw / vh;
  const stageAspect = cw / ch;
  let renderW: number;
  let renderH: number;
  let offsetX: number;
  let offsetY: number;

  if (stageAspect > videoAspect) {
    renderW = cw;
    renderH = cw / videoAspect;
    offsetX = 0;
    offsetY = (ch - renderH) / 2;
  } else {
    renderH = ch;
    renderW = ch * videoAspect;
    offsetX = (cw - renderW) / 2;
    offsetY = 0;
  }

  const lx = mirrored ? 1 - landmark.x : landmark.x;
  return {
    x: offsetX + lx * renderW,
    y: offsetY + landmark.y * renderH,
  };
}

function poseFromHand(
  landmarks: Landmark[],
  kind: "ring" | "bangle",
  video: HTMLVideoElement,
  stage: HTMLElement,
  mirrored: boolean,
  scaleBoost: number,
): Pose | null {
  if (landmarks.length < 21) return null;
  const toPx = (lm: Landmark) => landmarkToStage(lm, video, stage, mirrored);

  if (kind === "bangle") {
    const wrist = toPx(landmarks[0]);
    const indexMcp = toPx(landmarks[5]);
    const pinkyMcp = toPx(landmarks[17]);
    const middleMcp = toPx(landmarks[9]);
    const palmW = Math.hypot(indexMcp.x - pinkyMcp.x, indexMcp.y - pinkyMcp.y);
    const scalePx = Math.max(120, Math.min(320, palmW * 1.65 * scaleBoost));
    const t = 0.05;
    return {
      x: wrist.x + (middleMcp.x - wrist.x) * t,
      y: wrist.y + (middleMcp.y - wrist.y) * t,
      scalePx,
      rotation: angleDeg(indexMcp.x, indexMcp.y, pinkyMcp.x, pinkyMcp.y),
    };
  }

  const mcp = toPx(landmarks[13]);
  const pip = toPx(landmarks[14]);
  const dip = toPx(landmarks[15]);
  const midMcp = toPx(landmarks[9]);
  const pinkyMcp = toPx(landmarks[17]);
  const spanMid = Math.hypot(mcp.x - midMcp.x, mcp.y - midMcp.y);
  const spanPinky = Math.hypot(mcp.x - pinkyMcp.x, mcp.y - pinkyMcp.y);
  const boneLen = Math.hypot(pip.x - mcp.x, pip.y - mcp.y);
  const fingerWidth = Math.max(
    24,
    Math.min(spanMid * 0.82, spanPinky * 0.5, boneLen * 0.65),
  );

  const t = 0.3;
  return {
    x: mcp.x + (pip.x - mcp.x) * t,
    y: mcp.y + (pip.y - mcp.y) * t,
    scalePx: Math.max(48, Math.min(170, fingerWidth * 3.05 * scaleBoost)),
    rotation: angleDeg(mcp.x, mcp.y, dip.x, dip.y) + 90,
  };
}

function poseFromFace(
  landmarks: Landmark[],
  kind: "nose" | "earring" | "necklace",
  video: HTMLVideoElement,
  stage: HTMLElement,
  mirrored: boolean,
  scaleBoost: number,
): Pose | null {
  if (landmarks.length < 200) return null;
  const toPx = (lm: Landmark) => landmarkToStage(lm, video, stage, mirrored);

  const nose = toPx(landmarks[1] || landmarks[4]);
  const chin = toPx(landmarks[152]);
  const forehead = toPx(landmarks[10]);
  const leftCheek = toPx(landmarks[234]);
  const rightCheek = toPx(landmarks[454]);
  const faceH = Math.max(40, Math.hypot(chin.x - forehead.x, chin.y - forehead.y));
  const faceW = Math.max(40, Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y));

  if (kind === "nose") {
    return {
      x: nose.x,
      y: nose.y + faceH * 0.02,
      scalePx: Math.max(18, Math.min(72, faceW * 0.12 * scaleBoost)),
      rotation: 0,
    };
  }

  if (kind === "earring") {
    // Prefer the ear closer to camera on selfie (user's left = screen right when mirrored)
    const ear = mirrored ? leftCheek : rightCheek;
    return {
      x: ear.x + (mirrored ? -faceW * 0.02 : faceW * 0.02),
      y: ear.y + faceH * 0.08,
      scalePx: Math.max(28, Math.min(100, faceW * 0.18 * scaleBoost)),
      rotation: 0,
    };
  }

  // Necklace / pendant — just under chin on neckline
  return {
    x: chin.x,
    y: chin.y + faceH * 0.12,
    scalePx: Math.max(64, Math.min(240, faceW * 0.55 * scaleBoost)),
    rotation: 0,
  };
}

function defaultManualScale(kind: JewelleryKind) {
  if (kind === "ring" || kind === "nose") return 0.14;
  if (kind === "earring") return 0.16;
  if (kind === "bangle") return 0.32;
  if (kind === "necklace") return 0.38;
  return 0.28;
}

export function LiveTryOnDialog({
  open,
  onOpenChange,
  productName,
  imageUrl,
  jewelleryKind = "jewellery",
}: LiveTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handRef = useRef<
    import("@mediapipe/tasks-vision").HandLandmarker | null
  >(null);
  const faceRef = useRef<
    import("@mediapipe/tasks-vision").FaceLandmarker | null
  >(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectRef = useRef(0);
  const manualOverrideRef = useRef(false);
  const poseRef = useRef<Pose>({ x: 0, y: 0, scalePx: 56, rotation: 0 });

  const arEnabled = supportsAr(jewelleryKind);
  const handMode = supportsHandAr(jewelleryKind);
  const faceMode = supportsFaceAr(jewelleryKind);

  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [tracking, setTracking] = useState(arEnabled);
  const [targetSeen, setTargetSeen] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [cutoutBusy, setCutoutBusy] = useState(false);
  const [scaleBoost, setScaleBoost] = useState(1);
  const [manualRotation, setManualRotation] = useState(0);
  const [pose, setPose] = useState<Pose>({
    x: 0,
    y: 0,
    scalePx: 56,
    rotation: 0,
  });
  const [manualPos, setManualPos] = useState({ x: 0, y: 40 });
  const [manualScale, setManualScale] = useState(0.28);
  
  // 3D mode state
  const [use3D, setUse3D] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(false);
  const [model3DFailed, setModel3DFailed] = useState(false);
  const [handLandmarksFor3D, setHandLandmarksFor3D] = useState<any>(null);
  const [faceLandmarksFor3D, setFaceLandmarksFor3D] = useState<any>(null);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check WebGL support for 3D rendering
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      const supported = !!gl;
      setWebGLSupported(supported);
      // Disable 3D by default since models don't exist yet - user can enable manually
      setUse3D(false);
    } catch {
      setWebGLSupported(false);
      setUse3D(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setTracking(arEnabled);
    manualOverrideRef.current = !arEnabled;
    setTargetSeen(false);
    setScaleBoost(
      jewelleryKind === "ring" ? 1.15 : jewelleryKind === "bangle" ? 1.25 : 1,
    );
    setManualRotation(0);
    setManualScale(defaultManualScale(jewelleryKind));
    setManualPos(
      jewelleryKind === "necklace"
        ? { x: 0, y: 80 }
        : jewelleryKind === "nose"
          ? { x: 0, y: -20 }
          : { x: 0, y: 40 },
    );
    setCutoutUrl(null);
    setCutoutBusy(true);
    let cancelled = false;
    prepareTryOnCutout(imageUrl, jewelleryKind)
      .then((url) => {
        if (!cancelled) setCutoutUrl(url);
      })
      .catch(() => {
        if (!cancelled) setCutoutUrl(imageUrl);
      })
      .finally(() => {
        if (!cancelled) setCutoutBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, arEnabled, jewelleryKind, imageUrl]);

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const loadModels = useCallback(async () => {
    if (!arEnabled) return;
    const needHand = handMode && !handRef.current;
    const needFace = faceMode && !faceRef.current;
    if (!needHand && !needFace) return;
    setModelLoading(true);
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_CDN);
      const tryDelegate = async (delegate: "GPU" | "CPU") => {
        if (needHand) {
          handRef.current = await vision.HandLandmarker.createFromOptions(
            fileset,
            {
              baseOptions: { modelAssetPath: HAND_MODEL, delegate },
              runningMode: "VIDEO",
              numHands: 1,
              minHandDetectionConfidence: 0.5,
              minHandPresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            },
          );
        }
        if (needFace) {
          faceRef.current = await vision.FaceLandmarker.createFromOptions(
            fileset,
            {
              baseOptions: { modelAssetPath: FACE_MODEL, delegate },
              runningMode: "VIDEO",
              numFaces: 1,
              minFaceDetectionConfidence: 0.5,
              minFacePresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            },
          );
        }
      };
      try {
        await tryDelegate("GPU");
      } catch {
        handRef.current = null;
        faceRef.current = null;
        await tryDelegate("CPU");
      }
    } catch (err) {
      console.error("AR model load failed", err);
      setError(
        "AR tracking could not load. You can still place the piece manually.",
      );
      setTracking(false);
      manualOverrideRef.current = true;
    } finally {
      setModelLoading(false);
    }
  }, [arEnabled, faceMode, handMode]);

  const startDetectLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const video = videoRef.current;
      const stage = stageRef.current;
      const mirrored = facing === "user";

      if (
        video &&
        stage &&
        tracking &&
        !manualOverrideRef.current &&
        video.readyState >= 2 &&
        video.videoWidth > 0
      ) {
        const now = performance.now();
        if (now - lastDetectRef.current > 33) {
          lastDetectRef.current = now;
          try {
            let next: Pose | null = null;

            if (handMode && handRef.current && (jewelleryKind === "ring" || jewelleryKind === "bangle")) {
              const result = handRef.current.detectForVideo(video, now);
              setHandLandmarksFor3D(result); // Store for 3D rendering
              const hand = result.landmarks?.[0];
              if (hand) {
                next = poseFromHand(
                  hand,
                  jewelleryKind,
                  video,
                  stage,
                  mirrored,
                  scaleBoost,
                );
              }
            } else if (
              faceMode &&
              faceRef.current &&
              (jewelleryKind === "nose" ||
                jewelleryKind === "earring" ||
                jewelleryKind === "necklace")
            ) {
              const result = faceRef.current.detectForVideo(video, now);
              setFaceLandmarksFor3D(result); // Store for 3D rendering
              const face = result.faceLandmarks?.[0];
              if (face) {
                next = poseFromFace(
                  face,
                  jewelleryKind,
                  video,
                  stage,
                  mirrored,
                  scaleBoost,
                );
              }
            }

            if (next) {
              const smoothed = lerpPose(poseRef.current, next, 0.38);
              poseRef.current = smoothed;
              setPose(smoothed);
              setTargetSeen(true);
            } else {
              setTargetSeen(false);
            }
          } catch {
            /* frame skip */
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [facing, faceMode, handMode, jewelleryKind, scaleBoost, tracking]);

  const startCamera = useCallback(async () => {
    setError("");
    stopCamera();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      if (arEnabled) {
        await loadModels();
        startDetectLoop();
      }
    } catch {
      setError("Camera permission denied. Allow camera access and try again.");
    }
  }, [arEnabled, facing, loadModels, startDetectLoop, stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    document.body.style.overflow = "hidden";
    void startCamera();
    return () => {
      document.body.style.overflow = "";
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  useEffect(() => {
    if (!open || !arEnabled) return;
    startDetectLoop();
  }, [open, arEnabled, startDetectLoop, tracking, scaleBoost, facing]);

  function close() {
    onOpenChange(false);
  }

  function enableManual() {
    manualOverrideRef.current = true;
    setTracking(false);
  }

  function resumeAr() {
    manualOverrideRef.current = false;
    setTracking(true);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (tracking && !manualOverrideRef.current) {
      enableManual();
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: tracking ? pose.x : manualPos.x,
      originY: tracking ? pose.y : manualPos.y,
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next = {
      x: drag.originX + (e.clientX - drag.startX),
      y: drag.originY + (e.clientY - drag.startY),
    };
    if (manualOverrideRef.current || !tracking) {
      setManualPos(next);
    } else {
      setPose((p) => {
        const updated = { ...p, ...next };
        poseRef.current = updated;
        return updated;
      });
    }
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  if (!open || !mounted) return null;

  const displayUrl = cutoutUrl || imageUrl;
  const useArPose = arEnabled && tracking && !manualOverrideRef.current;

  const overlayStyle = useArPose
    ? {
        left: pose.x,
        top: pose.y,
        width: pose.scalePx,
        height:
          jewelleryKind === "bangle"
            ? pose.scalePx * 0.48
            : jewelleryKind === "necklace"
              ? pose.scalePx * 1.05
              : jewelleryKind === "ring"
                ? pose.scalePx * 0.72
                : pose.scalePx,
        transform: `translate(-50%, -50%) rotate(${pose.rotation + manualRotation}deg)`,
      }
    : {
        left: "50%",
        top: "50%",
        width: `${Math.round(manualScale * 100)}%`,
        maxWidth:
          jewelleryKind === "ring" || jewelleryKind === "nose"
            ? 140
            : jewelleryKind === "necklace"
              ? 360
              : 280,
        transform: `translate(calc(-50% + ${manualPos.x}px), calc(-50% + ${manualPos.y}px)) rotate(${manualRotation}deg)`,
      };

  const statusLabel = (() => {
    if (modelLoading || cutoutBusy) return "Preparing…";
    if (!tracking) return "Manual";
    if (!targetSeen) {
      if (handMode) return "Show your hand…";
      if (faceMode) return "Face the camera…";
      return "Looking…";
    }
    if (jewelleryKind === "ring") return "On ring finger";
    if (jewelleryKind === "bangle") return "On wrist";
    if (jewelleryKind === "nose") return "On nose";
    if (jewelleryKind === "earring") return "On ear";
    if (jewelleryKind === "necklace") return "On neck";
    return "Tracking";
  })();

  const hint = !arEnabled
    ? "Drag to place · use +/− to resize. Tip: rings & bangles get hand AR; nose, earrings & necklaces get face AR."
    : modelLoading || cutoutBusy
      ? "Preparing a clean jewellery cutout and AR tracking…"
      : !targetSeen && tracking
        ? jewelleryKind === "ring"
          ? "Hold your hand up, fingers spread — ring locks on the ring finger knuckle."
          : jewelleryKind === "bangle"
            ? "Show your wrist to the camera — open palm works best."
            : jewelleryKind === "nose"
              ? "Look straight at the camera — pin locks on your nose."
              : jewelleryKind === "earring"
                ? "Turn slightly so one ear is visible."
                : "Face the camera — pendant sits on your neckline."
        : tracking
          ? "Looking good — move slowly. Use +/− to fine-tune size."
          : "Manual mode — drag to place. Tap Resume AR to track again.";

  return createPortal(
    <div
      className="fixed inset-0 z-[420] flex flex-col bg-[#1a100e]"
      role="dialog"
      aria-modal="true"
      aria-label="Live try-on"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            Try on live
            {arEnabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#8b2e2e]/90 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">
                <Sparkles className="size-2.5" />
                AR
              </span>
            ) : null}
          </p>
          <p className="truncate text-xs text-white/60">{productName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setFacing((f) => (f === "user" ? "environment" : "user"))
            }
            className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white"
            aria-label="Flip camera"
          >
            <FlipHorizontal2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={close}
            className="flex size-10 items-center justify-center rounded-full bg-white text-[#8b2e2e]"
            aria-label="Close try-on"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="relative mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-hidden bg-black"
      >
        {error && !streamRef.current ? (
          <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <Camera className="size-10 text-white/70" />
            <p className="text-sm text-white/80">{error}</p>
            <button
              type="button"
              onClick={() => void startCamera()}
              className="rounded-full bg-[#8b2e2e] px-5 py-2 text-sm font-medium"
            >
              Retry camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={cn(
                "absolute inset-0 size-full object-cover",
                facing === "user" && "scale-x-[-1]",
              )}
            />

            {/* Soft target guide while locking */}
            {useArPose && !targetSeen ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className={cn(
                    "rounded-full border-2 border-dashed border-white/45",
                    handMode ? "size-40" : "size-52",
                  )}
                />
              </div>
            ) : null}

            <div
              className="absolute inset-0 touch-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* 3D AR Canvas when WebGL is supported and 3D mode is enabled */}
              {use3D && webGLSupported && useArPose && stageRef.current && !model3DFailed ? (
                <ErrorBoundary
                  onError={() => {
                    console.warn("3D model failed to load, falling back to 2D");
                    setModel3DFailed(true);
                    setUse3D(false);
                  }}
                >
                  <ThreeARCanvas
                    stageWidth={stageRef.current.clientWidth}
                    stageHeight={stageRef.current.clientHeight}
                  >
                    {jewelleryKind === "ring" && videoRef.current && handLandmarksFor3D && (
                      <Ring3DModel
                        modelPath="/models/rings/sample-ring.glb"
                        handLandmarks={handLandmarksFor3D}
                        videoWidth={videoRef.current.videoWidth}
                        videoHeight={videoRef.current.videoHeight}
                        stageWidth={stageRef.current.clientWidth}
                        stageHeight={stageRef.current.clientHeight}
                        mirrored={facing === "user"}
                      />
                    )}
                    {jewelleryKind === "bangle" && videoRef.current && handLandmarksFor3D && (
                      <Bangle3DModel
                        modelPath="/models/bangles/sample-bangle.glb"
                        handLandmarks={handLandmarksFor3D}
                        videoWidth={videoRef.current.videoWidth}
                        videoHeight={videoRef.current.videoHeight}
                        stageWidth={stageRef.current.clientWidth}
                        stageHeight={stageRef.current.clientHeight}
                        mirrored={facing === "user"}
                      />
                    )}
                    {jewelleryKind === "nose" && videoRef.current && faceLandmarksFor3D && (
                      <NosePin3DModel
                        modelPath="/models/nose-pins/sample-nose-pin.glb"
                        faceLandmarks={faceLandmarksFor3D}
                        videoWidth={videoRef.current.videoWidth}
                        videoHeight={videoRef.current.videoHeight}
                        stageWidth={stageRef.current.clientWidth}
                        stageHeight={stageRef.current.clientHeight}
                        mirrored={facing === "user"}
                      />
                    )}
                    {jewelleryKind === "earring" && videoRef.current && faceLandmarksFor3D && (
                      <Earring3DModel
                        modelPath="/models/earrings/sample-earring.glb"
                        faceLandmarks={faceLandmarksFor3D}
                        videoWidth={videoRef.current.videoWidth}
                        videoHeight={videoRef.current.videoHeight}
                        stageWidth={stageRef.current.clientWidth}
                        stageHeight={stageRef.current.clientHeight}
                        mirrored={facing === "user"}
                        side="left"
                      />
                    )}
                    {jewelleryKind === "necklace" && videoRef.current && faceLandmarksFor3D && (
                      <Necklace3DModel
                        modelPath="/models/necklaces/sample-necklace.glb"
                        faceLandmarks={faceLandmarksFor3D}
                        videoWidth={videoRef.current.videoWidth}
                        videoHeight={videoRef.current.videoHeight}
                        stageWidth={stageRef.current.clientWidth}
                        stageHeight={stageRef.current.clientHeight}
                        mirrored={facing === "user"}
                      />
                    )}
                  </ThreeARCanvas>
                </ErrorBoundary>
              ) : null}
              
              {/* Fallback to 2D overlay when 3D is disabled or in manual mode */}
              {(!use3D || !webGLSupported || !useArPose) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayUrl}
                  alt=""
                  draggable={false}
                  className={cn(
                    "pointer-events-none absolute select-none object-contain transition-opacity duration-200",
                    targetSeen || !useArPose ? "opacity-100" : "opacity-25",
                  )}
                  style={{
                    ...overlayStyle,
                    // Pop jewellery against skin — looks worn, not like a flat sticker
                    filter:
                      jewelleryKind === "ring" || jewelleryKind === "bangle"
                        ? "contrast(1.18) saturate(1.22) brightness(1.06) drop-shadow(0 2px 3px rgba(0,0,0,0.45))"
                        : jewelleryKind === "necklace"
                          ? "contrast(1.12) saturate(1.15) brightness(1.04) drop-shadow(0 6px 10px rgba(0,0,0,0.4))"
                          : "contrast(1.14) saturate(1.18) brightness(1.05) drop-shadow(0 3px 6px rgba(0,0,0,0.4))",
                  }}
                />
              )}
            </div>

            <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
              {arEnabled ? (
                <span
                  className={cn(
                    "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm",
                    targetSeen && tracking
                      ? "bg-[#2f6b4f]/90 text-white"
                      : "bg-black/55 text-white/90",
                  )}
                >
                  <Hand className="size-3.5" />
                  {statusLabel}
                </span>
              ) : null}
            </div>

            <p className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-black/55 px-4 py-3 text-center text-xs leading-relaxed text-white/90 backdrop-blur-sm">
              {hint}
            </p>
          </>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-2 px-4 py-4 text-white">
        {webGLSupported && arEnabled && !model3DFailed && (
          <button
            type="button"
            onClick={() => setUse3D((v) => !v)}
            className="rounded-full bg-white/15 px-4 py-2 text-xs font-medium"
            title={!use3D ? "Enable 3D mode (requires 3D model files)" : "Switch to 2D mode"}
          >
            {use3D ? "2D Mode" : "3D Mode (Beta)"}
          </button>
        )}
        
        {arEnabled ? (
          tracking ? (
            <button
              type="button"
              onClick={enableManual}
              className="rounded-full bg-white/15 px-4 py-2 text-xs font-medium"
            >
              Manual place
            </button>
          ) : (
            <button
              type="button"
              onClick={resumeAr}
              className="rounded-full bg-[#8b2e2e] px-4 py-2 text-xs font-medium"
            >
              Resume AR
            </button>
          )
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (useArPose) {
              setScaleBoost((s) =>
                Math.max(0.5, Math.round((s - 0.1) * 100) / 100),
              );
            } else {
              setManualScale((s) =>
                Math.max(0.08, Math.round((s - 0.04) * 100) / 100),
              );
            }
          }}
          className="flex size-11 items-center justify-center rounded-full bg-white/15"
          aria-label="Smaller"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => setManualRotation((r) => r - 15)}
          className="flex size-11 items-center justify-center rounded-full bg-white/15"
          aria-label="Rotate"
        >
          <RotateCcw className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (useArPose) {
              setScaleBoost((s) =>
                Math.min(2.2, Math.round((s + 0.1) * 100) / 100),
              );
            } else {
              setManualScale((s) =>
                Math.min(1.2, Math.round((s + 0.04) * 100) / 100),
              );
            }
          }}
          className="flex size-11 items-center justify-center rounded-full bg-white/15"
          aria-label="Larger"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>,
    document.body,
  );
}

type LiveTryOnButtonProps = {
  productName: string;
  imageUrl: string | null | undefined;
  jewelleryKind?: JewelleryKind;
  className?: string;
  label?: string;
};

export function LiveTryOnButton({
  productName,
  imageUrl,
  jewelleryKind,
  className,
  label = "Try on with camera",
}: LiveTryOnButtonProps) {
  const [open, setOpen] = useState(false);
  if (!imageUrl) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#8b2e2e]/30 bg-[#faf4f0] px-4 text-sm font-medium text-[#8b2e2e] transition hover:bg-[#f3ebe4]",
          className,
        )}
      >
        <Camera className="size-4" strokeWidth={1.7} />
        {label}
      </button>
      <LiveTryOnDialog
        open={open}
        onOpenChange={setOpen}
        productName={productName}
        imageUrl={imageUrl}
        jewelleryKind={jewelleryKind}
      />
    </>
  );
}
