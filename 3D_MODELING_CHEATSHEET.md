# 3D Jewelry Modeling - Quick Cheat Sheet

## ⚡ Quick Start (30 minutes)

### 1. Download & Install
```
Download: https://www.blender.org/download/
Install: Just run installer
```

### 2. First Ring Model
```
1. Delete cube (X key)
2. Add Torus (Shift+A → Mesh → Torus)
3. Scale (S → 0.5 → Enter)
4. Shade Smooth (Right-click → Shade Smooth)
```

### 3. Gold Material
```
Material Properties → New
Base Color: #FFD700 (yellow gold)
Metallic: 1.0
Roughness: 0.1
```

### 4. Export
```
File → Export → glTF Binary (.glb)
Settings:
  ✅ Format: glTF Binary
  ✅ Apply Modifiers
  ✅ Compression
Save as: sample-ring.glb
```

### 5. Add to Project
```
Copy to: /public/models/rings/sample-ring.glb
Refresh browser
Click "3D Mode (Beta)"
Done! 🎉
```

---

## 🎨 Material Colors

```
Yellow Gold:  RGB(255, 215, 0)   #FFD700
Rose Gold:    RGB(183, 110, 121) #B76E79
White Gold:   RGB(229, 228, 226) #E5E4E2
Silver:       RGB(192, 192, 192) #C0C0C0
Diamond:      RGB(255, 255, 255) #FFFFFF (Transmission: 0.95)
```

---

## 📏 Correct Sizes

```
Ring:     Diameter 18mm  (0.018m in Blender)
Bangle:   Diameter 65mm  (0.065m in Blender)
Earring:  Height 25mm    (0.025m in Blender)
Necklace: Width 150mm    (0.15m in Blender)
```

---

## ⌨️ Essential Shortcuts

```
NAVIGATION:
  1, 3, 7     = Front, Side, Top view
  MMB drag    = Rotate view
  Shift+MMB   = Pan view
  Scroll      = Zoom

EDITING:
  Tab         = Edit/Object mode toggle
  G           = Move (Grab)
  S           = Scale
  R           = Rotate
  X           = Delete
  Shift+A     = Add object
  Ctrl+Z      = Undo
  
SELECTION:
  A           = Select all
  Alt+A       = Deselect all
  B           = Box select
```

---

## 🐛 Common Fixes

### Model too small in AR?
```
Blender: Select → S → 2 → Enter (double size)
Re-export
```

### Model appears black?
```
Check: Metallic = 1.0
Check: Materials exported
```

### Model won't load?
```
File size > 2MB? → Add Decimate modifier
Wrong format? → Must be .glb not .gltf
```

### Wrong position in AR?
```
Object → Set Origin → Origin to Geometry
Alt+G (move to center)
Re-export
```

---

## 📦 File Paths

```
/public/models/rings/sample-ring.glb
/public/models/bangles/sample-bangle.glb
/public/models/earrings/sample-earring.glb
/public/models/necklaces/sample-necklace.glb
/public/models/nose-pins/sample-nose-pin.glb
```

---

## 🎓 Learning Path

```
Day 1: Simple ring (30 min practice)
Day 2: Add gold material (15 min)
Day 3: Ring with stone (1 hour)
Day 4: Your first real product (2 hours)
Day 5: Optimize & perfect (1 hour)

After 5 days: You're ready for production! 🚀
```

---

## 💰 Time vs Quality

```
Quick (30 min):    Basic shape, single material     → 6/10 quality
Good (2 hours):    Detailed model, good materials   → 8/10 quality  
Perfect (4 hours): Exact replica, all details       → 10/10 quality
```

---

## 🔗 Quick Resources

```
Blender Download:  https://www.blender.org/download/
Free HDRI:        https://polyhaven.com/hdris
Tutorials:        YouTube → "Blender jewelry ring tutorial"
Help:             Blender Manual → https://docs.blender.org/
```

---

**Pro Tip:** First model takes 2-3 hours. By 5th model, you'll do it in 30 minutes! 💪

**Full detailed guide:** See `BLENDER_3D_MODELING_GUIDE.md` in project root.
