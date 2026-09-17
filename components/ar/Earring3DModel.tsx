"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { landmarkToThreePosition } from "@/lib/ar/coordinateMapper";
import { applyMaterialToModel, MaterialPresets } from "@/lib/ar/materials";
import { optimizeModelForMobile } from "@/lib/ar/performance";
import type { FaceLandmarkerResult } from "@mediapipe/tasks-vision";

interface Earring3DModelProps {
  modelPath: string;
  faceLandmarks: FaceLandmarkerResult | null;
  videoWidth: number;
  videoHeight: number;
  stageWidth: number;
  stageHeight: number;
  mirrored: boolean;
  side: "left" | "right";
  metalType?: "gold" | "rose_gold" | "white_gold" | "silver";
}

/**
 * Earring 3D model component with real-time face tracking.
 * Positions earring at user's ear using MediaPipe face landmarks.
 */
export function Earring3DModel({
  modelPath,
  faceLandmarks,
  videoWidth,
  videoHeight,
  stageWidth,
  stageHeight,
  mirrored,
  side,
  metalType = "gold",
}: Earring3DModelProps) {
  const { scene } = useGLTF(modelPath);
  const earringRef = useRef<THREE.Group>(null);
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
    if (!earringRef.current || !faceLandmarks?.faceLandmarks?.[0]) return;

    const landmarks = faceLandmarks.faceLandmarks[0];
    if (landmarks.length < 468) return;

    // MediaPipe face landmarks: Left ear tragus ≈ 234, Right ear tragus ≈ 454
    const earLandmarkIndex = side === "left" ? 234 : 454;
    const ear = landmarks[earLandmarkIndex];

    const config = {
      videoWidth,
      videoHeight,
      stageWidth,
      stageHeight,
      mirrored,
    };

    // Position at ear, slightly below earlobe
    const earPos = landmarkToThreePosition(ear, config, camera, -5);
    earPos.y -= 0.08; // Offset down for hanging earring

    // Smooth transition
    earringRef.current.position.lerp(earPos, 0.35);

    // Keep earring upright (no rotation)
    earringRef.current.rotation.set(0, 0, 0);

    // Fixed scale (earrings don't scale with head size much)
    earringRef.current.scale.setScalar(0.15);
  });

  return <primitive ref={earringRef} object={scene.clone()} />;
}

// Preload default earring model
useGLTF.preload("/models/earrings/sample-earring.glb");
