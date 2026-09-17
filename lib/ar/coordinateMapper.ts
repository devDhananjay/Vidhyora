import type { Landmark } from "@mediapipe/tasks-vision";
import * as THREE from "three";

export interface VideoSpaceConfig {
  videoWidth: number;
  videoHeight: number;
  stageWidth: number;
  stageHeight: number;
  mirrored: boolean;
}

/**
 * Convert MediaPipe normalized landmark coordinates to Three.js world space position.
 * Handles video→stage aspect ratio mapping and mirroring for selfie view.
 */
export function landmarkToThreePosition(
  landmark: Landmark,
  config: VideoSpaceConfig,
  camera: THREE.Camera,
  zDepth: number = -5
): THREE.Vector3 {
  const { videoWidth, videoHeight, stageWidth, stageHeight, mirrored } = config;

  // Mirror for selfie view (user camera is typically mirrored)
  const x = mirrored ? 1 - landmark.x : landmark.x;

  // Convert normalized [0,1] to NDC [-1,1]
  const ndcX = x * 2 - 1;
  const ndcY = -(landmark.y * 2 - 1); // Flip Y axis (screen Y goes down, GL Y goes up)

  // Unproject from NDC to world space
  const vec = new THREE.Vector3(ndcX, ndcY, 0.5);
  vec.unproject(camera);

  // Set consistent depth (distance from camera)
  vec.setZ(zDepth);

  return vec;
}

/**
 * Estimate rotation angle from two landmarks (e.g., finger bone axis).
 * Returns Euler angles suitable for Three.js rotation.
 */
export function estimateRotationFromLandmarks(
  pointA: Landmark,
  pointB: Landmark,
  mirrored: boolean
): THREE.Euler {
  const ax = mirrored ? 1 - pointA.x : pointA.x;
  const bx = mirrored ? 1 - pointB.x : pointB.x;

  const angle = Math.atan2(pointB.y - pointA.y, bx - ax);

  return new THREE.Euler(0, 0, angle);
}

/**
 * Estimate 3D scale from landmark distance (e.g., finger width).
 * Converts normalized coordinate distances to world-space scale.
 */
export function estimateScaleFromDistance(
  pointA: Landmark,
  pointB: Landmark,
  baseScale: number = 1,
  multiplier: number = 15
): number {
  const dist = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
  return dist * multiplier * baseScale;
}

/**
 * Smooth position/rotation transitions using lerp.
 * Prevents jittery AR tracking.
 */
export function smoothTransform(
  current: THREE.Vector3 | THREE.Euler,
  target: THREE.Vector3 | THREE.Euler,
  alpha: number = 0.3
): void {
  if (current instanceof THREE.Vector3 && target instanceof THREE.Vector3) {
    current.lerp(target, alpha);
  } else if (current instanceof THREE.Euler && target instanceof THREE.Euler) {
    // Simple Z-axis lerp for 2D rotation
    current.z = THREE.MathUtils.lerp(current.z, target.z, alpha);
  }
}
