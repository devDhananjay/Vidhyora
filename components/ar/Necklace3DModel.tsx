"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { landmarkToThreePosition } from "@/lib/ar/coordinateMapper";
import { applyMaterialToModel, MaterialPresets } from "@/lib/ar/materials";
import { optimizeModelForMobile } from "@/lib/ar/performance";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

interface Necklace3DModelProps {
  modelPath: string;
  faceLandmarks: FaceLandmarkerResult | null;
  videoWidth: number;
  videoHeight: number;
  stageWidth: number;
  stageHeight: number;
  mirrored: boolean;
  metalType?: "gold" | "rose_gold" | "white_gold" | "silver";
}

/**
 * Necklace 3D model component with real-time face/neck tracking.
 * Positions necklace at user's collarbone using MediaPipe face landmarks.
 */
export function Necklace3DModel({
  modelPath,
  faceLandmarks,
  videoWidth,
  videoHeight,
  stageWidth,
  stageHeight,
  mirrored,
  metalType = "gold",
}: Necklace3DModelProps) {
  const { scene } = useGLTF(modelPath);
  const necklaceRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    const material =
      metalType === "rose_gold"
        ? MaterialPresets.ROSE_GOLD
        : metalType === "white_gold"
          ? MaterialPresets.WHITE_GOLD
          : metalType === "silver"
            ? MaterialPresets.SILVER
            : MaterialPresets.GOLD;

    applyMaterialToModel(scene, material);
    optimizeModelForMobile(scene);
  }, [scene, metalType]);

  useFrame(() => {
    if (!necklaceRef.current || !faceLandmarks?.faceLandmarks?.[0]) return;

    const landmarks = faceLandmarks.faceLandmarks[0];
    if (landmarks.length < 468) return;

    // Chin landmark ≈ 152
    const chin = landmarks[152];
    // Left jaw ≈ 172, Right jaw ≈ 397 (for width estimation)
    const leftJaw = landmarks[172];
    const rightJaw = landmarks[397];

    const config = {
      videoWidth,
      videoHeight,
      stageWidth,
      stageHeight,
      mirrored,
    };

    // Position at neck (below chin)
    const chinPos = landmarkToThreePosition(chin, config, camera, -5);
    const targetPos = chinPos.clone();
    targetPos.y -= 0.3; // Move down to collarbone area

    // Scale based on neck/jaw width
    const neckWidth = Math.hypot(
      rightJaw.x - leftJaw.x,
      rightJaw.y - leftJaw.y
    );
    const scale = neckWidth * 8;

    // Smooth transitions
    necklaceRef.current.position.lerp(targetPos, 0.35);
    necklaceRef.current.rotation.set(0, 0, 0);
    necklaceRef.current.scale.setScalar(
      THREE.MathUtils.lerp(necklaceRef.current.scale.x, scale, 0.25)
    );
  });

  return <primitive ref={necklaceRef} object={scene.clone()} />;
}

// Preload default necklace model
useGLTF.preload("/models/necklaces/sample-necklace.glb");
