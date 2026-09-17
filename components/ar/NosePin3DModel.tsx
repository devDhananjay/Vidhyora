"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { landmarkToThreePosition } from "@/lib/ar/coordinateMapper";
import { applyMaterialToModel, MaterialPresets } from "@/lib/ar/materials";
import { optimizeModelForMobile } from "@/lib/ar/performance";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

interface NosePin3DModelProps {
  modelPath: string;
  faceLandmarks: FaceLandmarkerResult | null;
  videoWidth: number;
  videoHeight: number;
  stageWidth: number;
  stageHeight: number;
  mirrored: boolean;
  side?: "left" | "right";
  metalType?: "gold" | "rose_gold" | "white_gold" | "silver";
}

/**
 * Nose pin 3D model component with real-time face tracking.
 * Positions nose pin on user's nostril using MediaPipe face landmarks.
 */
export function NosePin3DModel({
  modelPath,
  faceLandmarks,
  videoWidth,
  videoHeight,
  stageWidth,
  stageHeight,
  mirrored,
  side = "left",
  metalType = "gold",
}: NosePin3DModelProps) {
  const { scene } = useGLTF(modelPath);
  const nosePinRef = useRef<THREE.Group>(null);
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
    if (!nosePinRef.current || !faceLandmarks?.faceLandmarks?.[0]) return;

    const landmarks = faceLandmarks.faceLandmarks[0];
    if (landmarks.length < 468) return;

    // MediaPipe face landmarks: Left nostril ≈ 98, Right nostril ≈ 327
    const nostrilLandmarkIndex = side === "left" ? 98 : 327;
    const nostril = landmarks[nostrilLandmarkIndex];

    const config = {
      videoWidth,
      videoHeight,
      stageWidth,
      stageHeight,
      mirrored,
    };

    // Position at nostril
    const nostrilPos = landmarkToThreePosition(nostril, config, camera, -5);

    // Smooth transition
    nosePinRef.current.position.lerp(nostrilPos, 0.35);

    // Keep nose pin upright
    nosePinRef.current.rotation.set(0, 0, 0);

    // Small fixed scale
    nosePinRef.current.scale.setScalar(0.08);
  });

  return <primitive ref={nosePinRef} object={scene.clone()} />;
}

// Preload default nose pin model
useGLTF.preload("/models/nose-pins/sample-nose-pin.glb");
