# 3D Models Setup - Quick Start ⚡

**Status:** 🟡 Folders created, models need to be downloaded

---

## 🚀 3-Step Setup (5 Minutes!)

### Step 1: Run Download Helper

```bash
./scripts/download-models.sh
```

This will show you all the download links and instructions.

---

### Step 2: Download Models (Browser)

**RINGS** - Pick ANY ONE:
- ✅ [Rose Gold Ring](https://www.renderhub.com/ilham45/rose-gold-ring) ⭐ Recommended
- ✅ [Golden Ring](https://www.renderhub.com/ilham45/golden-ring)
- ✅ [Ornate Ring](https://getglb.com/fashion/ornate-golden-ring/)

**BANGLES** - Pick ONE:
- ✅ [Golden Bangles](https://www.renderhub.com/nickreations/basic-golden-bangles) ⭐ Recommended

**EARRINGS + NECKLACE** - One download for both!
- ✅ [Complete Jewelry Set](https://getglb.com/fashion/golden-jewelry-set/) ⭐ Best deal!

---

### Step 3: Copy to Project

**After download, run these commands:**

```bash
# If downloaded to ~/Downloads/

# Ring (use whichever you downloaded)
cp ~/Downloads/rose-gold-ring.glb public/models/rings/sample-ring.glb

# Bangle
cp ~/Downloads/golden-bangle.glb public/models/bangles/sample-bangle.glb

# Earrings (from jewelry set)
cp ~/Downloads/golden-jewelry-set.glb public/models/earrings/sample-earring.glb

# Necklace (from jewelry set)
cp ~/Downloads/golden-jewelry-set.glb public/models/necklaces/sample-necklace.glb
```

---

### Step 4: Verify

```bash
./scripts/verify-models.sh
```

Should show: ✅ Success for all files!

---

### Step 5: Test!

```bash
npm run dev
```

1. Open any product page
2. Click "Try AR" button  
3. Enable "3D Mode (Beta)"
4. Show hand/face to camera
5. 🎉 See 3D jewelry in AR!

---

## 📁 File Structure

```
public/models/
├── rings/
│   └── sample-ring.glb          ← Your ring model
├── bangles/
│   └── sample-bangle.glb        ← Your bangle model
├── earrings/
│   └── sample-earring.glb       ← Your earring model
├── necklaces/
│   └── sample-necklace.glb      ← Your necklace model
└── nose-pins/
    └── sample-nose-pin.glb      ← (Optional - use small ring)
```

---

## 🐛 Troubleshooting

### "Download button not working"
- Some sites require free account signup
- Try alternative model from list
- Or use online converters for FBX/OBJ files

### "File too large"
- Use online converter to compress: https://products.aspose.app/3d/conversion
- Or use Blender Decimate modifier (see guide)

### "Model not showing in AR"
- Check browser console (F12) for errors
- Verify file path with: `ls public/models/rings/sample-ring.glb`
- Check file is not empty: `ls -lh public/models/rings/sample-ring.glb`

---

## 📚 Full Documentation

- **Complete Setup Guide:** `FREE_3D_MODELS_SETUP.md`
- **Testing Guide:** `TESTING.md`
- **AR Tuning:** `AR_TUNING.md`
- **Blender Guide:** `BLENDER_3D_MODELING_GUIDE.md`

---

## 💡 Tips

- **Start with jewelry set** - It's smallest (209 KB) and has multiple pieces!
- **Download all at once** - Takes only 2-3 minutes total
- **Keep originals** - Save downloads in a backup folder too
- **Try different models** - You can swap them anytime!

---

## ✅ Success Checklist

- [ ] Ran `./scripts/download-models.sh`
- [ ] Downloaded at least 1 ring model
- [ ] Downloaded at least 1 bangle model
- [ ] Downloaded jewelry set (for earrings/necklace)
- [ ] Copied files to correct folders
- [ ] Renamed to `sample-*.glb`
- [ ] Ran `./scripts/verify-models.sh` - all ✅
- [ ] Started `npm run dev`
- [ ] Tested AR with "3D Mode (Beta)"
- [ ] Model appears and tracks!

---

**Need help?** Error dikhe toh mujhe screenshot/console error bhejo! 🚀
