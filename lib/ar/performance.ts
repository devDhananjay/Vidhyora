/**
 * Performance optimization utilities for 3D AR try-on
 * Handles LOD, lazy loading, FPS monitoring, and adaptive quality
 */

import * as THREE from "three";

/**
 * Detect device performance tier
 */
export function getDevicePerformanceTier(): "low" | "medium" | "high" {
  if (typeof window === "undefined") return "medium";

  // Check for low-end signals
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const memory = (navigator as any).deviceMemory; // GB
  const cores = navigator.hardwareConcurrency || 4;

  // Low-end: mobile with <4GB RAM or <4 cores
  if (isMobile && (memory < 4 || cores < 4)) {
    return "low";
  }

  // High-end: desktop with >8GB RAM or >8 cores
  if (!isMobile && (memory > 8 || cores > 8)) {
    return "high";
  }

  return "medium";
}

/**
 * Get recommended pixel ratio for device
 */
export function getAdaptivePixelRatio(): [number, number] {
  const tier = getDevicePerformanceTier();
  const maxDPR = window.devicePixelRatio || 1;

  switch (tier) {
    case "low":
      return [1, 1]; // Fixed 1x for low-end
    case "medium":
      return [1, Math.min(1.5, maxDPR)]; // Up to 1.5x
    case "high":
      return [1, Math.min(2, maxDPR)]; // Up to 2x
  }
}

/**
 * FPS monitor for performance tracking (dev only)
 */
export class FPSMonitor {
  private frames = 0;
  private lastTime = performance.now();
  private fps = 60;
  private callback?: (fps: number) => void;

  constructor(callback?: (fps: number) => void) {
    this.callback = callback;
  }

  update() {
    this.frames++;
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frames * 1000) / delta);
      this.frames = 0;
      this.lastTime = now;
      this.callback?.(this.fps);
    }
  }

  getFPS(): number {
    return this.fps;
  }
}

/**
 * Adaptive quality manager - reduces quality when FPS drops
 */
export class AdaptiveQualityManager {
  private fpsMonitor = new FPSMonitor();
  private pixelRatio = window.devicePixelRatio || 1;
  private targetFPS = 30;
  private lowFPSFrames = 0;
  private canvas: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement, targetFPS: number = 30) {
    this.canvas = canvas;
    this.targetFPS = targetFPS;
  }

  update() {
    this.fpsMonitor.update();
    const fps = this.fpsMonitor.getFPS();

    // If FPS is consistently low, reduce quality
    if (fps < this.targetFPS * 0.8) {
      this.lowFPSFrames++;
      if (this.lowFPSFrames > 30 && this.pixelRatio > 1) {
        // Reduce pixel ratio
        this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
        this.lowFPSFrames = 0;
        console.log(`[Performance] Reduced pixel ratio to ${this.pixelRatio}`);
      }
    } else {
      this.lowFPSFrames = 0;
    }
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  getFPS(): number {
    return this.fpsMonitor.getFPS();
  }
}

/**
 * Model LOD (Level of Detail) manager
 * Loads different model complexity based on distance/performance
 */
export interface LODConfig {
  high: string; // Path to high-poly model
  medium?: string; // Path to medium-poly model
  low?: string; // Path to low-poly model
}

export function getLODModelPath(config: LODConfig): string {
  const tier = getDevicePerformanceTier();

  switch (tier) {
    case "low":
      return config.low || config.medium || config.high;
    case "medium":
      return config.medium || config.high;
    case "high":
      return config.high;
  }
}

/**
 * Preload 3D models for faster AR startup
 */
export async function preloadModels(paths: string[]): Promise<void> {
  const { useGLTF } = await import("@react-three/drei");

  // Preload in parallel
  await Promise.all(
    paths.map((path) => {
      return new Promise<void>((resolve) => {
        try {
          useGLTF.preload(path);
          resolve();
        } catch {
          console.warn(`[Performance] Failed to preload model: ${path}`);
          resolve();
        }
      });
    })
  );
}

/**
 * Optimize model geometry for mobile
 */
export function optimizeModelForMobile(object: THREE.Object3D): void {
  const tier = getDevicePerformanceTier();

  if (tier === "low") {
    // Disable shadows on low-end devices
    object.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = false;
        node.receiveShadow = false;
      }
    });
  }
}

/**
 * Dispose of Three.js resources to prevent memory leaks
 */
export function disposeObject(object: THREE.Object3D): void {
  object.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.geometry?.dispose();

      if (Array.isArray(node.material)) {
        node.material.forEach((material) => {
          disposeMaterial(material);
        });
      } else if (node.material) {
        disposeMaterial(node.material);
      }
    }
  });
}

function disposeMaterial(material: THREE.Material): void {
  Object.keys(material).forEach((key) => {
    const value = (material as any)[key];
    if (value && typeof value === "object" && "minFilter" in value) {
      // It's a texture
      value.dispose();
    }
  });
  material.dispose();
}

/**
 * Check WebGL support and capabilities
 */
export function checkWebGLSupport(): {
  supported: boolean;
  version: 1 | 2 | null;
  maxTextureSize: number;
  maxRenderbufferSize: number;
} {
  if (typeof window === "undefined") {
    return {
      supported: false,
      version: null,
      maxTextureSize: 0,
      maxRenderbufferSize: 0,
    };
  }

  const canvas = document.createElement("canvas");
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let version: 1 | 2 | null = null;

  try {
    gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
    if (gl) {
      version = 2;
    } else {
      gl = canvas.getContext("webgl") as WebGLRenderingContext;
      if (gl) version = 1;
    }
  } catch {
    return {
      supported: false,
      version: null,
      maxTextureSize: 0,
      maxRenderbufferSize: 0,
    };
  }

  if (!gl) {
    return {
      supported: false,
      version: null,
      maxTextureSize: 0,
      maxRenderbufferSize: 0,
    };
  }

  return {
    supported: true,
    version,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
  };
}

/**
 * Debounce resize events for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
