import * as THREE from "three";

/**
 * Create realistic gold material with high metalness and reflectivity.
 * Suitable for yellow gold, rose gold variants.
 */
export function createGoldMaterial(color: number = 0xffd700): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.95,
    roughness: 0.05,
    envMapIntensity: 2,
  });
}

/**
 * Rose gold variant (warmer pink tone).
 */
export function createRoseGoldMaterial(): THREE.MeshStandardMaterial {
  return createGoldMaterial(0xb76e79);
}

/**
 * White gold variant (cooler silver-ish tone).
 */
export function createWhiteGoldMaterial(): THREE.MeshStandardMaterial {
  return createGoldMaterial(0xe5e4e2);
}

/**
 * Create silver/platinum material with higher reflectivity.
 */
export function createSilverMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.98,
    roughness: 0.02,
    envMapIntensity: 1.8,
  });
}

/**
 * Create diamond material with transparency and refraction.
 * Uses MeshPhysicalMaterial for realistic gem look.
 */
export function createDiamondMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 0.95,
    thickness: 0.5,
    ior: 2.4, // Diamond index of refraction
    envMapIntensity: 3,
  });
}

/**
 * Create colored gemstone material (ruby, emerald, sapphire).
 */
export function createGemMaterial(color: number): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.1,
    transmission: 0.7,
    thickness: 0.3,
    ior: 1.77, // Typical gemstone IOR
    envMapIntensity: 2.5,
  });
}

/**
 * Apply material to all meshes in a scene/group.
 * Useful for applying gold to entire ring model.
 */
export function applyMaterialToModel(
  object: THREE.Object3D,
  material: THREE.Material
): void {
  object.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.material = material;
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
}

/**
 * Material presets for quick access.
 */
export const MaterialPresets = {
  GOLD: createGoldMaterial(),
  ROSE_GOLD: createRoseGoldMaterial(),
  WHITE_GOLD: createWhiteGoldMaterial(),
  SILVER: createSilverMaterial(),
  DIAMOND: createDiamondMaterial(),
  RUBY: createGemMaterial(0xe0115f),
  EMERALD: createGemMaterial(0x50c878),
  SAPPHIRE: createGemMaterial(0x0f52ba),
} as const;
