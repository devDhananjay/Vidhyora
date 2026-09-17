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

interface Ring3DModelProps {
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
 * Ring 3D model component with real-time hand tracking.
 * Positions and rotates ring on user's ring finger using MediaPipe landmarks.
 */
export function Ring3DModel({
  modelPath,
  handLandmarks,
  videoWidth,
  videoHeight,
  stageWidth,
  stageHeight,
  mirrored,
  metalType = "gold",
}: Ring3DModelProps) {
  const { scene } = useGLTF(modelPath);
  const ringRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useEffect(() => {
    // Apply material based on metal type
    const material =
      metalType === "rose_gold"
        ? MaterialPresets.ROSE_GOLD
        : metalType === "white_gold"
          ? MaterialPresets.WHITE_GOLD
          : metalType === "silver"
            ? MaterialPresets.SILVER
            : MaterialPresets.GOLD;

    applyMaterialToModel(scene, material);
    optimizeModelForMobile(scene); // Performance optimization
  }, [scene, metalType]);

  useFrame(() => {
    if (!ringRef.current || !handLandmarks?.landmarks?.[0]) return;

    const landmarks = handLandmarks.landmarks[0];
    if (landmarks.length < 21) return;

    // Ring finger landmarks: MCP (base) = 13, PIP (middle) = 14, DIP = 15
    const mcp = landmarks[13];
    const pip = landmarks[14];
    const dip = landmarks[15];

    // Neighboring landmarks for width estimation
    const middleMcp = landmarks[9];
    const pinkyMcp = landmarks[17];

    const config = {
      videoWidth,
      videoHeight,
      stageWidth,
      stageHeight,
      mirrored,
    };

    // Position at ring finger base (slightly above MCP knuckle)
    const mcpPos = landmarkToThreePosition(mcp, config, camera, -5);
    const pipPos = landmarkToThreePosition(pip, config, camera, -5);
    const targetPos = new THREE.Vector3().lerpVectors(mcpPos, pipPos, 0.3);

    // Rotation aligned with finger axis
    const rotation = estimateRotationFromLandmarks(mcp, dip, mirrored);

    // Scale based on finger width
    const fingerWidth = estimateScaleFromDistance(mcp, middleMcp, 1, 18);

    // Smooth transitions to prevent jitter
    ringRef.current.position.lerp(targetPos, 0.35);
    ringRef.current.rotation.z = THREE.MathUtils.lerp(
      ringRef.current.rotation.z,
      rotation.z + Math.PI / 2,
      0.35
    );
    ringRef.current.scale.setScalar(
      THREE.MathUtils.lerp(ringRef.current.scale.x, fingerWidth, 0.25)
    );
  });

  return <primitive ref={ringRef} object={scene.clone()} />;
}

// Preload default ring model
useGLTF.preload("/models/rings/sample-ring.glb");
