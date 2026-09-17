#!/bin/bash

# Verify 3D Models Setup
# Checks if models are properly placed and valid

set -e

echo "🔍 VIDYORA - 3D Models Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

BASE_DIR="/Users/meondev/Desktop/VIDYORA/public/models"
ERRORS=0
WARNINGS=0
SUCCESS=0

check_file() {
    local file_path=$1
    local file_name=$(basename "$file_path")
    local dir_name=$(basename $(dirname "$file_path"))
    
    if [ -f "$file_path" ]; then
        # File exists, check size
        local size=$(du -h "$file_path" | cut -f1)
        local size_bytes=$(stat -f%z "$file_path" 2>/dev/null || stat -c%s "$file_path" 2>/dev/null)
        
        if [ "$size_bytes" -eq 0 ]; then
            echo -e "${RED}❌ $dir_name/$file_name - File is empty (0 bytes)${NC}"
            ((ERRORS++))
        elif [ "$size_bytes" -gt 10485760 ]; then
            # Greater than 10MB
            echo -e "${YELLOW}⚠️  $dir_name/$file_name - File is large ($size) - may affect performance${NC}"
            ((WARNINGS++))
        else
            echo -e "${GREEN}✅ $dir_name/$file_name - OK ($size)${NC}"
            ((SUCCESS++))
        fi
    else
        echo -e "${RED}❌ $dir_name/$file_name - File not found${NC}"
        ((ERRORS++))
    fi
}

echo "📦 Checking Model Files:"
echo "========================"
echo ""

echo "🔹 Rings:"
check_file "$BASE_DIR/rings/sample-ring.glb"
echo ""

echo "🔹 Bangles:"
check_file "$BASE_DIR/bangles/sample-bangle.glb"
echo ""

echo "🔹 Earrings:"
check_file "$BASE_DIR/earrings/sample-earring.glb"
echo ""

echo "🔹 Necklaces:"
check_file "$BASE_DIR/necklaces/sample-necklace.glb"
echo ""

echo "🔹 Nose Pins (Optional):"
check_file "$BASE_DIR/nose-pins/sample-nose-pin.glb"
echo ""

echo ""
echo "📊 Summary:"
echo "==========="
echo -e "${GREEN}✅ Success: $SUCCESS files${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS files${NC}"
echo -e "${RED}❌ Errors: $ERRORS files${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $SUCCESS -ge 2 ]; then
    echo -e "${GREEN}🎉 Great! You have enough models to start testing!${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Start dev server: npm run dev"
    echo "   2. Open any product page"
    echo "   3. Click 'Try AR' button"
    echo "   4. Enable '3D Mode (Beta)'"
    echo "   5. Show hand/face to camera"
    echo ""
elif [ $ERRORS -eq 0 ] && [ $SUCCESS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  You have some models, but not all jewelry types.${NC}"
    echo "   Download more from: FREE_3D_MODELS_SETUP.md"
    echo ""
elif [ $SUCCESS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some models are missing or have errors.${NC}"
    echo "   Check the errors above and re-download those files."
    echo "   Guide: FREE_3D_MODELS_SETUP.md"
    echo ""
else
    echo -e "${RED}❌ No valid models found!${NC}"
    echo ""
    echo "📥 Please download models first:"
    echo "   1. Run: ./scripts/download-models.sh"
    echo "   2. Follow the download links"
    echo "   3. Copy files to correct folders"
    echo "   4. Run this verification again"
    echo ""
fi

# List any extra files that might need renaming
echo "📂 Other GLB files found:"
echo "========================="
extra_files=$(find "$BASE_DIR" -name "*.glb" ! -name "sample-*.glb" 2>/dev/null || true)
if [ -z "$extra_files" ]; then
    echo "   (none)"
else
    echo "$extra_files" | while read -r file; do
        local size=$(du -h "$file" | cut -f1)
        echo "   - $(basename $file) ($size)"
    done
    echo ""
    echo "💡 Tip: You can rename these to 'sample-*.glb' to use them!"
fi

echo ""
