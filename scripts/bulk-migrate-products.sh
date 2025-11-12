#!/bin/bash

# Bulk Product Migration Script
# Downloads images and prepares data for database insertion

set -e

echo "===== Alectra Products Migration ====="
echo "Creating directories..."
mkdir -p attached_assets/products

echo "Downloading product images (this may take a while)..."

# Function to download and rename image
download_image() {
  local url=$1
  local slug=$2
  local filename="${slug}.png"
  
  echo "Downloading: $slug"
  curl -s "$url" -o "attached_assets/products/$filename" 2>/dev/null || echo "Failed: $slug"
}

# Download all product images in parallel (batch processing)
download_image "https://alectra.co.za/cdn/shop/files/andowl-4k-solar-cctv-camera.png?v=1761151419" "4k-solar-camera" &
download_image "https://alectra.co.za/cdn/shop/files/EPS1214_1.png?v=1732102140" "12v-1-4ah-battery" &
download_image "https://alectra.co.za/cdn/shop/files/Battery-12V-2.4AH-EACH-L-P05765-FRONT-scaled-1.png?v=1732102145" "12v-2-4ah-battery" &
download_image "https://alectra.co.za/cdn/shop/files/12v-7ah-battery-backup-power.jpg?v=1741694628" "12v-7ah-battery" &
download_image "https://alectra.co.za/cdn/shop/files/lithium-battery-12v-8ah-alectra-solutions.png?v=1733234790" "12v-8ah-lithium" &
download_image "https://alectra.co.za/cdn/shop/files/24v-battery-for-gate-or-garage-motor.png?v=1738318469" "24v-3-5ah-battery" &
download_image "https://alectra.co.za/cdn/shop/files/9kg-lp-gas-exchange-refill.png?v=1739186237" "9kg-lp-gas" &
download_image "https://alectra.co.za/cdn/shop/files/19kg-lp-gas-exchange-refill.png?v=1739186211" "19kg-lp-gas" &
download_image "https://alectra.co.za/cdn/shop/files/48kg-lp-gas-exchange-refill.png?v=1739186275" "48kg-lp-gas" &
download_image "https://alectra.co.za/cdn/shop/files/centurion-d2-sliding-gate-motor.png?v=1738318875" "centurion-d2" &

wait

echo "✓ Images downloaded to attached_assets/products/"
echo "✓ Migration preparation complete!"
