import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

// Manual price mapping from alectra.co.za (collected from website)
// Using sale prices where available, otherwise regular prices
const priceUpdates: Record<string, string> = {
  // Batteries
  "12v-1-4ah-battery": "135.00",
  "12v-2-4ah": "160.00",
  "12v-7ah": "250.00",
  "12v-7ah-lithium-battery": "550.00",
  "24v-3-5ah": "485.00",
  "gemini-12v-7-2ah-battery": "250.00",
  
  // LP Gas
  "19kg-exchange": "580.00",
  "9kg-lp-gas": "275.00",
  "48kg-exchange": "1399.00",
  
  // CCTV
  "hilook-2mp-full-colour-vu-bullet-camera-analog": "449.00",
  "10a-9-channel-cctv-power-supply-with-metal-casing": "349.00",
  "20a-18-channel-cctv-power-supply-with-metal-casing": "449.00",
  "4-channel-advanced-cctv-camera-kit": "3199.00",
  "16-channel-advanced-cctv-camera-kit": "7899.00",
  "4k-solar-powered-security-camera": "1099.00",
  "12v-10a-9-channel-cctv-battery-backup": "399.00",
  
  // Electric Fencing
  "8-wire-angle-square-tube-black": "95.00",
  "6-line-angle-square-tube-black": "75.00",
  "12v-15w-white-security-siren": "80.00",
  "12v-40w-white-security-siren": "238.00",
  "12v-red-strobe-light": "85.00",
  
  // Electrical Components
  "100-100-70-mm-waterproof-pvc-electrical-junction-box": "36.00",
  "pvc-side-entry-junction-box-1-way": "8.00",
  "2x4-weatherproof-electrical-box": "55.00",
  "3-point-plug-16a": "25.00",
  "305m-cat6-utp-copper-coated-ethernet-cable": "680.00",
  "4x2-30a-2p-white-isolator": "98.00",
  "4x4-double-socket-plug": "85.00",
  "4x4-double-socket-weatherproof-box": "85.00",
  "4x4-pvc-extension-box": "13.00",
  "4x4-single-socket-plug": "85.00",
  
  // Gate Motors
  "centurion-d10-sliding-gate-motor": "9999.00",
  "centurion-d10-smart-turbo-gate-motor": "9699.00",
  "centurion-d2-sliding-gate-motor": "3999.00",
  "centurion-d3-smart-gate-motor": "4399.00",
  "centurion-d3-d5-evo-smart-d6-smart-base-plate": "168.00",
  "centurion-d3-d5-evo-smart-anti-theft-bracket": "899.00",
  "centurion-d5-d6-smart-anti-theft": "1350.00",
  "centurion-d5-evo-main-cover": "383.00",
  "centurion-d5-evo-sliding-gate-motor": "5999.00",
  "centurion-d5-evo-smart-gate-motor": "5099.00",
  "centurion-d5-d6-smart-anti-theft-bracket": "1099.00",
  "centurion-d6-smart-gate-motor": "6599.00",
  "centurion-gate-motor-nylon-rack-2m": "250.00",
  "centurion-vantage-400-gate-motor": "5499.00",
  "centurion-vantage-500-gate-motor": "10799.00",
  "dace-sprint-500-gate-motor": "4199.00",
  
  // Remotes
  "absolute-4-button-remote": "270.00",
  "centurion-nova-1-button-remote": "159.00",
  "centurion-nova-1-button-remote-copy": "185.00", // Nova 2 Button
  "centurion-nova-4-button-remote": "259.00",
  "dts-octo-5-button-remote": "155.00",
  "e-t-1-button-remote-reliable-control-for-automated-systems": "165.00",
  "e-t-2-button-remote": "200.00",
  "e-t-4-button-remote": "215.00",
  "eazylift-garage-door-remote-4-button": "330.00",
  "elev8tor-4-button-garage-door-remote": "225.00",
  "gemini-1-button-remote": "149.00",
  "gemini-4-button-remote": "165.00", // Gemini 3 Button
  "sentry-1-button-c-hop-433-nova-remote": "145.00",
  "sentry-3-button-c-hop-433-nova-remote-copy": "160.00",
  "sentry-4-button-c-hop-433-nova-remote": "175.00",
  
  // Intercoms
  "centurion-g-speak-ultra-4-button": "951.00",
  "centurion-g-speak-ultra-upgrade-kit": "2999.00",
  "centurion-g-ultra-gsm-smart-switch": "2699.00",
  "centurion-g-speak-ultra": "3999.00",
  "centurion-polophone": "1327.49",
  "kocom-intercom-system": "747.50",
  "zartek-wireless-intercom-system": "2335.00",
  "centurion-smartguard-air-wireless-keypad": "999.00",
  "centurion-smartguard-wired-keypad": "899.00",
  "e-t-nice-7-monitor-only": "1860.00",
  "e-t-nice-colour-video-intercom-gate-station": "999.00",
  "e-t-nice-7-monitor-intercom-gate-station-full-kit": "3060.00",
};

async function updatePrices() {
  console.log("Starting price update from alectra.co.za...\n");
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  for (const [slug, newPrice] of Object.entries(priceUpdates)) {
    try {
      const result = await db
        .update(products)
        .set({ price: newPrice })
        .where(eq(products.slug, slug))
        .returning();
      
      if (result.length > 0) {
        console.log(`✓ Updated ${slug}: R ${newPrice}`);
        updatedCount++;
      } else {
        console.log(`✗ Product not found: ${slug}`);
        notFoundCount++;
      }
    } catch (error) {
      console.error(`✗ Error updating ${slug}:`, error);
    }
  }
  
  console.log(`\nUpdate complete:`);
  console.log(`- Updated: ${updatedCount} products`);
  console.log(`- Not found: ${notFoundCount} products`);
}

updatePrices()
  .then(() => {
    console.log("\n✓ Price update completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Price update failed:", error);
    process.exit(1);
  });
