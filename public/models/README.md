# 3D Models for AR Try-On

This directory contains 3D models (.glb format) for jewelry AR try-on.

## Required Models

### Rings (`/public/models/rings/`)
- `sample-ring.glb` - Default ring model

### Bangles (`/public/models/bangles/`)
- `sample-bangle.glb` - Default bangle model

### Earrings (`/public/models/earrings/`)
- `sample-earring.glb` - Default earring model

### Necklaces (`/public/models/necklaces/`)
- `sample-necklace.glb` - Default necklace model

### Nose Pins (`/public/models/nose-pins/`)
- `sample-nose-pin.glb` - Default nose pin model

## Model Requirements

- **Format**: GLB (binary glTF)
- **Size**: < 2MB each for mobile performance
- **Geometry**: < 50k triangles for optimal performance
- **Origin**: Centered at jewelry center point
- **Scale**: ~1 unit diameter for rings, proportional for other jewelry
- **Textures**: Embedded in GLB file

## Where to Get 3D Models

### Option 1: Free Placeholder Models (for testing)
- [Sketchfab](https://sketchfab.com/) - Search "ring jewelry", filter by downloadable + glTF
- [Poly Haven](https://polyhaven.com/) - Free 3D models
- [TurboSquid Free](https://www.turbosquid.com/Search/3D-Models/free/jewelry) - Free jewelry models

### Option 2: Commission Custom Models (production quality)
- Hire 3D artist on Fiverr/Upwork (~$50-200 per model)
- Provide product photos and measurements
- Request optimized .glb with <50k triangles

### Option 3: AI-Generated Models
- [Meshy.ai](https://www.meshy.ai/) - AI 3D model generation from images
- [Luma AI](https://lumalabs.ai/) - Generate 3D from photos
- Upload product photos → generate 3D (quality varies)

### Option 4: Convert Existing CAD Files
If you have CAD files from jewelry vendors:
1. Open in Blender (free)
2. File → Import → Choose format (.obj, .fbx, .step)
3. File → Export → glTF 2.0 (.glb)
4. Set geometry decimation to target <50k triangles

## Creating Simple Placeholder Models in Blender

For immediate testing, you can create simple geometric shapes:

### Ring
1. Open Blender
2. Delete default cube (X key)
3. Add → Mesh → Torus
4. Scale: S → 0.5
5. Edit Mode (Tab) → Extrude (E) for thickness
6. File → Export → glTF 2.0 (.glb)
7. Save as `sample-ring.glb`

### Bangle
1. Similar to ring but larger scale
2. Add → Mesh → Torus
3. Scale: S → 1.2
4. Thicker than ring
5. Export as `sample-bangle.glb`

### Earring
1. Add → Mesh → UV Sphere (for gem)
2. Add → Mesh → Cylinder (for hook)
3. Combine and scale appropriately
4. Export as `sample-earring.glb`

### Necklace
1. Add → Mesh → Curve → Bezier Circle
2. Adjust curve to necklace shape
3. Add modifier → Curve → Bevel for thickness
4. Export as `sample-necklace.glb`

### Nose Pin
1. Add → Mesh → UV Sphere (small gem)
2. Add → Mesh → Cylinder (tiny post)
3. Scale very small
4. Export as `sample-nose-pin.glb`

## Testing the Models

Once you have .glb files in the appropriate directories:

1. The app will automatically load them at the paths specified in the code
2. Test each jewelry type in the AR try-on
3. Adjust scale multipliers in the 3D model components if needed
4. Fine-tune positioning and rotation based on real hand/face tracking

## Current Status

⚠️ **Placeholder models not yet created** - The 3D AR system is implemented but requires actual .glb files to function. The system will show errors until these files are added.

For immediate testing, you can:
1. Use the 2D fallback mode (system auto-detects when 3D models are missing)
2. Create simple geometric placeholders in Blender (see above)
3. Download free models from Sketchfab or similar sites

## Next Steps

1. Create or source placeholder .glb files
2. Add them to the appropriate `/public/models/` subdirectories
3. Test AR tracking with each jewelry type
4. Replace placeholders with production-quality models from vendors
