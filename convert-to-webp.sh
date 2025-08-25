#!/bin/bash

# WebP Conversion Script for Pixel Tavern Game Assets
# Converts all PNG images to WebP format for better performance

echo "🚀 Converting PNG assets to WebP for better performance..."

# Function to convert a single file
convert_to_webp() {
    local input_file="$1"
    local output_file="${input_file%.png}.webp"
    
    if [ -f "$input_file" ]; then
        echo "Converting: $input_file -> $output_file"
        cwebp -q 90 -m 6 "$input_file" -o "$output_file"
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully converted: $(basename "$output_file")"
        else
            echo "❌ Failed to convert: $(basename "$input_file")"
        fi
    fi
}

# Convert main images
cd public/assets/images

echo "📁 Converting main game assets..."
convert_to_webp "Frame.png"
convert_to_webp "background.png"
convert_to_webp "background1.png"
convert_to_webp "characters.png"
convert_to_webp "elements.png"
convert_to_webp "knight-sprite.png"
convert_to_webp "knignt.png"
convert_to_webp "slot-column-bg.png"

echo "📁 Converting beersprite assets..."
cd beersprite
convert_to_webp "spritesheet (1).png"
convert_to_webp "table.png"

echo "📁 Converting knight-sprite assets..."
cd ../knight-sprite
for file in *.png; do
    convert_to_webp "$file"
done

echo "📁 Converting mage-sprite assets..."
cd ../mage-sprite
convert_to_webp "death-sheet.png"

cd ../../..

echo "🎉 WebP conversion complete!"
echo "📊 Checking file sizes..."

# Show file size comparison
echo ""
echo "📈 File size comparison (PNG vs WebP):"
find public/assets/images -name "*.png" -exec ls -lh {} \; | head -5
echo "vs"
find public/assets/images -name "*.webp" -exec ls -lh {} \; | head -5
