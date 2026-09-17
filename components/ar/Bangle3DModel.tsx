"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import {
  landmarkToThreePosition,
  estimateRotationFromLandmarks,
  estimateScaleFromDistance,
} from "@/lib/ar/coordinateMapper";
import { applyMaterialToModel, MaterialPresets } from "@/lib/ar/materials";
import { optimizeModelForMobile } from "@/lib/ar/performance";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

interface Bangle3DModelProps {
  modelPath: string;
  handLandmarks: HandLandmarkerResult | null;
  videoWidth: number;
  videoHeight: number;
  stageWidth: number;
  stageHeight: number;
  mirrored: boolean;
  metalType?: "gold" | "rose_gold" | "white_gold" | "silver";
}

/**
 * Bangle 3D model component with real-time wrist tracking.
 * Positions and rotates bangle around user's wrist using MediaPipe landmarks.
 */
export function Bangle3DModel({
  modelPath,
  handLandmarks,
  videoWidth,
  videoHeight,
  stageWidth,
  stageHeight,
  mirrored,
  metalType = "gold",
}: Bangle3DModelProps) {
  const { scene } = useGLTF(modelPath);
  const bangleRef = useRef<THREE.Group>(null);
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
    if (!bangleRef.current || !handLandmarks?.landmarks?.[0]) return;

    const landmarks = handLandmarks.landmarks[0];
    if (landmarks.length < 21) return;

    // Wrist center = landmark 0
    const wrist = landmarks[0];
    // Index MCP = 5, Pinky MCP = 17 (for width estimation)
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    const config = {
      videoWidth,
      videoHeight,
      stageWidth,
      stageHeight,
      mirrored,
    };

    // Position at wrist center, slightly below hand
    const wristPos = landmarkToThreePosition(wrist, config, camera, -5);
    const indexPos = landmarkToThreePosition(indexMcp, config, camera, -5);
    
    // Offset down from wrist landmark
    const targetPos = wristPos.clone();
    targetPos.y -= 0.15; // Move down slightly

    // Rotation based on hand orientation
    const rotation = estimateRotationFromLandmarks(wrist, indexMcp, mirrored);

    // Scale based on wrist width
    const wristWidth = estimateScaleFromDistance(indexMcp, pinkyMcp, 1, 12);

    // Smooth transitions
    bangleRef.current.position.lerp(targetPos, 0.35);
    bangleRef.current.rotation.z = THREE.MathUtils.lerp(
      bangleRef.current.rotation.z,
      rotation.z,
      0.35
    );
    bangleRef.current.scale.setScalar(
      THREE.MathUtils.lerp(bangleRef.current.scale.x, wristWidth, 0.25)
    );
  });

  return <primitive ref={bangleRef} object={scene.clone()} />;
}

// Preload default bangle model
useGLTF.preload("/models/bangles/sample-bangle.glb");
