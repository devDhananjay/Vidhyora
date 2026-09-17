"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import {
  getAdaptivePixelRatio,
  getDevicePerformanceTier,
} from "@/lib/ar/performance";

interface ThreeARCanvasProps {
  children: React.ReactNode;
  stageWidth: number;
  stageHeight: number;
}

/**
 * Main 3D AR canvas overlay for jewelry try-on.
 * Positioned absolutely over webcam video with transparent background.
 * Includes realistic lighting and environment for photorealistic jewelry rendering.
 * Optimized for mobile with adaptive quality.
 */
export function ThreeARCanvas({
  children,
  stageWidth,
  stageHeight,
}: ThreeARCanvasProps) {
  const [performanceTier] = useState(() => getDevicePerformanceTier());
  const [pixelRatio] = useState(() => getAdaptivePixelRatio());

  return (
    <Canvas
      gl={{
        alpha: true,
        antialias: performanceTier !== "low",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        powerPreference: "high-performance",
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      dpr={pixelRatio}
      frameloop="demand" // Only render when needed
    >
      {/* Orthographic-like camera for 2D overlay feel */}
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />

      {/* Lighting setup for jewelry: ambient + directional + rim lights */}
      <ambientLight intensity={0.6} />

      {/* Key light (main) */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.2}
        castShadow={performanceTier === "high"}
      />

      {/* Fill light (softer opposite side) */}
      <directionalLight position={[-5, -5, -5]} intensity={0.4} />

      {/* Top light for highlights */}
      <pointLight position={[0, 5, 0]} intensity={0.8} />

      {/* Rim light for edge definition (disabled on low-end) */}
      {performanceTier !== "low" && (
        <pointLight position={[3, 0, -3]} intensity={0.5} />
      )}

      {/* HDRI environment for realistic reflections on metal/gems */}
      <Environment preset="studio" />

      {/* Suspense for lazy-loaded models */}
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
