#!/bin/bash

# 3D Models Download & Setup Script
# This script helps you download and organize FREE 3D jewelry models

set -e

echo "🎨 VIDYORA - 3D Jewelry Models Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base directory
BASE_DIR="/Users/meondev/Desktop/VIDYORA/public/models"

echo "📁 Checking folder structure..."
if [ -d "$BASE_DIR/rings" ] && [ -d "$BASE_DIR/bangles" ] && [ -d "$BASE_DIR/earrings" ] && [ -d "$BASE_DIR/necklaces" ]; then
    echo -e "${GREEN}✅ Folder structure exists!${NC}"
else
    echo -e "${RED}❌ Creating folders...${NC}"
    mkdir -p "$BASE_DIR"/{rings,bangles,earrings,necklaces,nose-pins}
    echo -e "${GREEN}✅ Folders created!${NC}"
fi

echo ""
echo "📥 Download Links (Open these in browser):"
echo "=========================================="
echo ""

echo "🔹 RINGS:"
echo "   1. Rose Gold Ring (Recommended):"
echo "      https://www.renderhub.com/ilham45/rose-gold-ring"
echo "      → Download GLB → Save as: rose-gold-ring.glb"
echo ""
echo "   2. Golden Ring:"
echo "      https://www.renderhub.com/ilham45/golden-ring"
echo "      → Download GLB → Save as: golden-ring.glb"
echo ""
echo "   3. Ornate Gold Ring:"
echo "      https://getglb.com/fashion/ornate-golden-ring/"
echo "      → Direct download → Save as: ornate-ring.glb"
echo ""

echo "🔹 BANGLES:"
echo "   1. Basic Golden Bangles:"
echo "      https://www.renderhub.com/nickreations/basic-golden-bangles"
echo "      → Download GLB → Save as: golden-bangle.glb"
echo ""

echo "🔹 EARRINGS & NECKLACE (Complete Set!):"
echo "   1. Golden Jewelry Set (includes both!):"
echo "      https://getglb.com/fashion/golden-jewelry-set/"
echo "      → Direct download → Save as: golden-jewelry-set.glb"
echo "      → This file contains earrings + necklace + rings"
echo ""

echo ""
echo "📋 After Downloading:"
echo "===================="
echo "1. Move/copy downloaded GLB files to these folders:"
echo "   - Rings    → $BASE_DIR/rings/"
echo "   - Bangles  → $BASE_DIR/bangles/"
echo "   - Earrings → $BASE_DIR/earrings/"
echo "   - Necklace → $BASE_DIR/necklaces/"
echo ""
echo "2. Rename files to:"
echo "   - sample-ring.glb (any ring model you like best)"
echo "   - sample-bangle.glb"
echo "   - sample-earring.glb"
echo "   - sample-necklace.glb"
echo ""
echo "3. Run verification: ./scripts/verify-models.sh"
echo ""

echo "🔄 Quick Copy Commands (after download):"
echo "========================================"
echo "# Example: If you downloaded to ~/Downloads/"
echo ""
echo "# Copy ring model"
echo "cp ~/Downloads/rose-gold-ring.glb $BASE_DIR/rings/sample-ring.glb"
echo ""
echo "# Copy bangle model"
echo "cp ~/Downloads/golden-bangle.glb $BASE_DIR/bangles/sample-bangle.glb"
echo ""
echo "# Copy jewelry set (then we'll extract parts)"
echo "cp ~/Downloads/golden-jewelry-set.glb $BASE_DIR/earrings/sample-earring.glb"
echo "cp ~/Downloads/golden-jewelry-set.glb $BASE_DIR/necklaces/sample-necklace.glb"
echo ""

echo ""
echo -e "${YELLOW}⚠️  Note: Downloads must be done manually from browser${NC}"
echo -e "${YELLOW}    (These sites require clicking download buttons)${NC}"
echo ""

echo "❓ Need help? Check: FREE_3D_MODELS_SETUP.md"
echo ""
