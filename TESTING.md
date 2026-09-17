# 3D AR Try-On Testing Guide

## Cross-Device Testing Checklist

### iOS Safari
- [ ] iPhone SE (3rd gen) - Low-end mobile
- [ ] iPhone 13/14 - Medium-tier
- [ ] iPhone 15 Pro - High-end
- [ ] iPad Air - Tablet
- [ ] Test selfie camera (front-facing)
- [ ] Test rear camera
- [ ] Check WebGL support detection
- [ ] Verify 3D model loading
- [ ] Test hand tracking (ring/bangle)
- [ ] Test face tracking (nose/earring/necklace)
- [ ] Check FPS (target: 30+ fps)
- [ ] Test 2D/3D mode toggle
- [ ] Verify manual placement fallback
- [ ] Check camera permission handling
- [ ] Test background/foreground transitions (WebGL context loss)

### Android Chrome
- [ ] Budget Android (2-4GB RAM) - Low-end
- [ ] Mid-range Android (6-8GB RAM)
- [ ] Flagship Android (12GB+ RAM)
- [ ] Test selfie camera
- [ ] Test rear camera
- [ ] Check WebGL support detection
- [ ] Verify 3D model loading
- [ ] Test hand tracking performance
- [ ] Test face tracking performance
- [ ] Check FPS on different tiers
- [ ] Test adaptive quality reduction
- [ ] Verify rotation lock behavior
- [ ] Check battery usage

### Desktop Browsers
- [ ] Chrome (Windows/Mac/Linux)
- [ ] Safari (Mac)
- [ ] Firefox (Windows/Mac/Linux)
- [ ] Edge (Windows)
- [ ] Test webcam access
- [ ] Verify 3D rendering quality
- [ ] Check high-resolution support
- [ ] Test multiple jewelry types
- [ ] Verify manual controls

## Jewelry Type Testing

### Ring
- [ ] Hand detection accuracy
- [ ] Ring finger tracking stability
- [ ] Scale appropriateness
- [ ] Rotation alignment with finger
- [ ] Smoothing (no jitter)
- [ ] Different hand angles
- [ ] Multiple hands in frame
- [ ] Different skin tones

### Bangle
- [ ] Wrist detection accuracy
- [ ] Positioning at wrist center
- [ ] Scale matches wrist width
- [ ] Rotation alignment
- [ ] Different wrist angles
- [ ] Hand movement tracking

### Nose Pin
- [ ] Nose detection accuracy
- [ ] Positioning on nostril
- [ ] Scale appropriateness
- [ ] Stable tracking while turning head
- [ ] Different face angles
- [ ] Different facial features

### Earring
- [ ] Ear detection accuracy
- [ ] Positioning at earlobe
- [ ] Scale matches ear size
- [ ] Tracking when turning head
- [ ] Left/right side detection
- [ ] Different head angles

### Necklace
- [ ] Neck/collarbone detection
- [ ] Positioning below chin
- [ ] Scale matches neck width
- [ ] Tracking when moving head
- [ ] Different necklines (clothing)

## Performance Metrics

### Target Metrics
- **FPS**: 30+ on mobile, 60 on desktop
- **Model load time**: < 2 seconds
- **Camera startup**: < 3 seconds
- **Memory usage**: < 150MB on mobile
- **3D model size**: < 2MB per model

### How to Monitor
1. Open browser DevTools
2. Performance tab → Record
3. Start AR try-on session
4. Interact for 30 seconds
5. Stop recording
6. Check:
   - Frame rate graph (should stay above 30fps)
   - Memory usage (should not grow unbounded)
   - Long tasks (should be minimal)

### Common Issues

#### Low FPS
- **Cause**: Model too complex, lighting too heavy, or low-end device
- **Fix**: 
  - Reduce model poly count
  - Disable shadows on low-end
  - Use adaptive quality manager
  - Reduce pixel ratio

#### Jittery tracking
- **Cause**: Insufficient smoothing, hand detection noise
- **Fix**:
  - Increase lerp alpha in `useFrame`
  - Add temporal filtering
  - Increase MediaPipe confidence thresholds

#### WebGL context loss
- **Cause**: iOS backgrounding, memory pressure
- **Fix**:
  - Listen for `webglcontextlost` event
  - Reload models on context restore
  - Reduce VRAM usage

#### Model not appearing
- **Cause**: Missing .glb file, wrong path, or loading error
- **Fix**:
  - Check browser console for errors
  - Verify model file exists at path
  - Test with simple geometric placeholder
  - Check CORS headers for external models

## Testing Procedure

### 1. Smoke Test (5 minutes)
1. Open app on device
2. Navigate to product with AR
3. Click "Try on with camera"
4. Allow camera permission
5. Verify video feed appears
6. Check if 3D model loads (or 2D fallback)
7. Test hand/face detection
8. Try manual placement
9. Toggle 2D/3D mode
10. Close AR view

### 2. Stability Test (15 minutes)
1. Keep AR session open
2. Move hand/face around
3. Occlude hand/face temporarily
4. Bring back into view
5. Test different angles
6. Test different distances
7. Rotate device orientation (if supported)
8. Monitor FPS and memory
9. Check for memory leaks

### 3. Edge Cases (10 minutes)
- Multiple hands in frame
- No hand/face detected
- Very bright lighting
- Very dim lighting
- Fast hand movements
- Background app switch (mobile)
- Network interruption (if models are external)

## Bug Reporting Template

```markdown
**Device**: iPhone 14, iOS 17.2, Safari 17.2
**Jewelry Type**: Ring
**Mode**: 3D AR
**Issue**: Ring appears offset from finger

**Steps to Reproduce**:
1. Open AR try-on for ring product
2. Show hand to camera
3. Ring appears 2cm to the left of ring finger

**Expected**: Ring should center on ring finger knuckle
**Actual**: Ring is offset to the left

**Screenshot**: [attach]
**Console Errors**: [paste]
**FPS**: 28-32 fps
```

## Next Steps After Testing

1. **Collect data** from test sessions
2. **Identify patterns** in issues (device-specific, jewelry-specific, etc.)
3. **Prioritize fixes** based on impact and frequency
4. **Tune parameters**:
   - Scale multipliers per jewelry type
   - Lerp smoothing values
   - Position offsets
   - Rotation adjustments
5. **Update models** if geometric issues found
6. **Retest** after fixes

## Production Readiness Checklist

- [ ] All jewelry types tested on iOS Safari
- [ ] All jewelry types tested on Android Chrome
- [ ] Desktop browsers tested
- [ ] Performance metrics met on low-end devices
- [ ] 2D fallback works when 3D fails
- [ ] Error handling covers all edge cases
- [ ] User instructions are clear
- [ ] Camera permissions handled gracefully
- [ ] Models optimized and compressed
- [ ] Analytics instrumented (optional)
- [ ] A/B testing configured (optional)
