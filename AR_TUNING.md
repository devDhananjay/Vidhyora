# AR Try-On Fine-Tuning Configuration

This document contains tunable parameters for optimizing AR tracking, positioning, and visual quality. Adjust these values based on real-world testing feedback.

## Coordinate Mapping Parameters

Located in: `lib/ar/coordinateMapper.ts`

### Z-Depth (Distance from Camera)
```typescript
// Current default: -5
export function landmarkToThreePosition(
  landmark: Landmark,
  config: VideoSpaceConfig,
  camera: THREE.Camera,
  zDepth: number = -5  // <-- Adjust this
): THREE.Vector3
```

**Tuning:**
- **More negative** (-6, -7): Model appears farther from camera, smaller
- **Less negative** (-4, -3): Model appears closer to camera, larger
- Test on real devices to find sweet spot

### Smoothing (Lerp Alpha)

Located in each 3D model component's `useFrame` function.

**Current values:**
- Position lerp: `0.35`
- Rotation lerp: `0.35`
- Scale lerp: `0.25`

**Ring3DModel.tsx** (line ~314):
```typescript
ringRef.current.position.lerp(targetPos, 0.35);  // Position smoothing
ringRef.current.rotation.z = THREE.MathUtils.lerp(
  ringRef.current.rotation.z,
  rotation.z + Math.PI / 2,
  0.35  // Rotation smoothing
);
ringRef.current.scale.setScalar(
  THREE.MathUtils.lerp(ringRef.current.scale.x, fingerWidth, 0.25)  // Scale smoothing
);
```

**Tuning:**
- **Lower values** (0.1-0.2): Smoother but laggy
- **Higher values** (0.5-0.8): More responsive but jittery
- **Recommended range**: 0.25-0.45

## Jewelry-Specific Scaling

### Ring

Located in: `components/ar/Ring3DModel.tsx`

```typescript
const fingerWidth = estimateScaleFromDistance(mcp, middleMcp, 1, 18);
//                                                            ^^-- Scale multiplier
```

**Current multiplier**: `18`

**Tuning:**
- Increase if ring appears too small
- Decrease if ring appears too large
- Test with different hand sizes

### Bangle

Located in: `components/ar/Bangle3DModel.tsx`

```typescript
const wristWidth = estimateScaleFromDistance(indexMcp, pinkyMcp, 1, 12);
//                                                                 ^^-- Scale multiplier
```

**Current multiplier**: `12`

**Tuning:**
- Typical range: 10-15
- Adjust based on bangle style (thin vs thick)

### Nose Pin

Located in: `components/ar/NosePin3DModel.tsx`

```typescript
nosePinRef.current.scale.setScalar(0.08);
//                                 ^^^^-- Fixed scale
```

**Current scale**: `0.08`

**Tuning:**
- Typical range: 0.05-0.12
- Smaller values for delicate studs
- Larger values for statement pieces

### Earring

Located in: `components/ar/Earring3DModel.tsx`

```typescript
earringRef.current.scale.setScalar(0.15);
//                                 ^^^^-- Fixed scale
```

**Current scale**: `0.15`

**Tuning:**
- Typical range: 0.1-0.25
- Depends on earring style (stud vs drop)

### Necklace

Located in: `components/ar/Necklace3DModel.tsx`

```typescript
const scale = neckWidth * 8;
//                        ^-- Scale multiplier
```

**Current multiplier**: `8`

**Tuning:**
- Typical range: 6-12
- Chokers: lower values (6-8)
- Statement necklaces: higher values (10-12)

## Position Offsets

### Ring

Located in: `components/ar/Ring3DModel.tsx`

```typescript
const targetPos = new THREE.Vector3().lerpVectors(mcpPos, pipPos, 0.3);
//                                                                  ^^^-- Position along finger
```

**Current offset**: `0.3` (30% from MCP to PIP)

**Tuning:**
- `0.2`: Closer to knuckle
- `0.4`: Farther up finger
- Adjust based on ring style (band vs solitaire)

### Bangle

Located in: `components/ar/Bangle3DModel.tsx`

```typescript
const targetPos = wristPos.clone();
targetPos.y -= 0.15;  // Move down from wrist landmark
//             ^^^^^-- Y-offset
```

**Current offset**: `0.15`

**Tuning:**
- Increase to move bangle farther down wrist
- Decrease to move closer to hand

### Earring

Located in: `components/ar/Earring3DModel.tsx`

```typescript
earPos.y -= 0.08;  // Offset down for hanging earring
//          ^^^^-- Y-offset
```

**Current offset**: `0.08`

**Tuning:**
- Increase for longer drop earrings
- Decrease for studs or smaller styles

### Necklace

Located in: `components/ar/Necklace3DModel.tsx`

```typescript
targetPos.y -= 0.3;  // Move down to collarbone area
//             ^^^-- Y-offset
```

**Current offset**: `0.3`

**Tuning:**
- Increase for longer chains (0.4-0.5)
- Decrease for chokers (0.2-0.25)

## Rotation Adjustments

### Ring

Located in: `components/ar/Ring3DModel.tsx`

```typescript
rotation.z + Math.PI / 2
//           ^^^^^^^^^^^-- 90-degree rotation offset
```

**Current offset**: `Math.PI / 2` (90 degrees)

**Tuning:**
- Adjust if ring appears rotated incorrectly
- Add/subtract `Math.PI / 4` (45 degrees) increments

### Other Jewelry Types

Earrings, necklaces, and nose pins use zero rotation by default (always upright):

```typescript
jewelryRef.current.rotation.set(0, 0, 0);
```

**Tuning:**
- Only adjust if model's default orientation is wrong
- Fix at the model level (in Blender) rather than code

## MediaPipe Confidence Thresholds

Located in: `components/products/live-try-on.tsx`

```typescript
HandLandmarker.createFromOptions(fileset, {
  // ...
  minHandDetectionConfidence: 0.5,    // <-- Adjust these
  minHandPresenceConfidence: 0.5,     // <-- Adjust these
  minTrackingConfidence: 0.5,         // <-- Adjust these
})
```

**Current values**: `0.5` (50% confidence)

**Tuning:**
- **Lower values** (0.3-0.4): More detections, but more false positives
- **Higher values** (0.6-0.7): Fewer false positives, but may miss some hands
- **Recommended**: Start at 0.5, increase if tracking is too jittery

Same for FaceLandmarker.

## Performance Tuning

Located in: `lib/ar/performance.ts`

### Device Performance Tiers

```typescript
// Current thresholds
if (isMobile && (memory < 4 || cores < 4)) {
  return "low";
}
```

**Tuning:**
- Adjust memory/core thresholds based on real testing
- Add specific device checks (e.g., iPhone SE always "low")

### Pixel Ratio Limits

```typescript
case "low":
  return [1, 1];  // Fixed 1x
case "medium":
  return [1, Math.min(1.5, maxDPR)];  // Up to 1.5x
case "high":
  return [1, Math.min(2, maxDPR)];  // Up to 2x
```

**Tuning:**
- Increase limits for better quality (but lower FPS)
- Decrease limits for better performance

## Testing Workflow

1. **Identify issue** (e.g., "ring is too small on my hand")
2. **Find relevant parameter** (e.g., ring scale multiplier)
3. **Make adjustment** (e.g., change `18` to `22`)
4. **Test on multiple devices**
5. **Iterate** until optimal
6. **Document change** in git commit

## Common Adjustments

### "Ring is too small"
→ Increase scale multiplier in `Ring3DModel.tsx` (18 → 22)

### "Tracking is jittery"
→ Decrease lerp alpha values (0.35 → 0.25)

### "Ring appears behind finger"
→ Increase z-depth (make more negative: -5 → -6)

### "Nose pin is too big"
→ Decrease fixed scale in `NosePin3DModel.tsx` (0.08 → 0.06)

### "Necklace doesn't follow neck"
→ Increase smoothing lerp (0.35 → 0.45)

### "Bangle is offset from wrist"
→ Adjust Y-offset in `Bangle3DModel.tsx` (0.15 → 0.12)

## A/B Testing Parameters

If implementing A/B testing, consider testing:

- **Smoothing**: Low (0.25) vs High (0.45) lerp alpha
- **Scale**: Current multipliers ±20%
- **Z-depth**: -5 vs -6 vs -4
- **Confidence thresholds**: 0.5 vs 0.6

Track metrics:
- User engagement time
- Manual mode usage (fallback indicator)
- Completion rate (did they finish try-on?)
- Conversion rate (did they add to cart?)

## Version History

- **v1.0** (2026-09-17): Initial 3D AR implementation
  - Ring scale: 18
  - Bangle scale: 12
  - Default lerp: 0.35
  - Z-depth: -5

(Update this section after each tuning session)
