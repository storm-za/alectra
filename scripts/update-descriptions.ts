import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

// Full product descriptions from old alectra.co.za website
const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  "4k-solar-powered-security-camera": "Experience next-level home and business security with the 4K Solar Powered Security Camera with WiFi and Night Vision. Designed for effortless protection, this camera combines crystal-clear 4K ultra high-definition video with the convenience of solar power, ensuring continuous operation without the need for constant charging or complicated wiring. Equipped with advanced night vision technology, this camera captures sharp, detailed footage even in complete darkness, giving you peace of mind 24 hours a day. Its built-in WiFi allows for real-time monitoring from your smartphone, tablet, or computer, no matter where you are.",
  
  "12v-1-4ah-battery": "Reliable 12V 1.4Ah sealed lead-acid battery perfect for backup power supplies, alarm systems, gate motors, UPS devices, and more. This maintenance-free battery ensures consistent performance and long service life. Ideal for security systems and small backup applications.",
  
  "12v-7ah": "The 12V 7Ah battery is the go-to power source for reliable and consistent performance in critical systems. Built with sealed lead-acid (SLA) technology, this maintenance-free battery is perfect for backup power supplies, alarm systems, gate motors, UPS devices, emergency lighting, and more. With a long service life and excellent discharge characteristics, it provides dependable energy storage for both residential and commercial applications.",
  
  "12v-7ah-lithium-battery": "Advanced 12V 8Ah lithium battery offering superior performance and longer lifespan compared to traditional lead-acid batteries. Lightweight, maintenance-free design with faster charging times and deeper discharge cycles. Perfect for gate motors, solar systems, and security applications. Lithium technology provides reliable power with minimal voltage drop and extended cycle life.",
  
  "centurion-d3-smart-gate-motor": "Centurion D3 Smart Gate Motor with advanced features and smart home integration capabilities. This sliding gate motor offers reliable automation for gates up to 400kg. Features include adjustable opening and closing speeds, obstacle detection for safety, battery backup support, and compatibility with the Centurion app for remote control. Note: Remote controls sold separately.",
  
  "centurion-d5-evo-smart-gate-motor": "Advanced Centurion D5 Evo Smart Gate Motor designed for gates up to 500kg. This premium sliding gate motor features enhanced power and reliability for larger residential and light commercial applications. Includes smart technology integration, adjustable speed control, obstacle detection, soft start/stop functionality, and battery backup capability. Compatible with the Centurion ecosystem for seamless smart home integration.",
  
  "centurion-d10-smart-turbo-gate-motor": "High-performance Centurion D10 Smart Turbo Gate Motor engineered for heavy-duty applications and gates up to 1000kg. This industrial-grade sliding gate motor delivers exceptional power and reliability for demanding commercial installations. Features turbo speed operation, advanced obstruction detection, programmable logic control, battery backup system, and comprehensive safety features. Designed for high-frequency use with extended duty cycle.",
  
  "hilook-2mp-bullet-camera": "Full HD 1080p bullet camera with advanced night vision capabilities up to 20 meters. Features a weatherproof IP67-rated housing suitable for outdoor installation in South African conditions. 2MP CMOS sensor delivers clear, detailed video footage day and night. Compatible with Hilook and Hikvision DVRs and NVRs. Wide viewing angle and adjustable mounting bracket for flexible installation.",
  
  "centurion-nova-4-button-remote": "4-button Nova remote control with multiple channel capability for controlling gate motors, garage doors, and other automated systems. Uses advanced code-hopping technology for enhanced security. Ergonomic design with tactile buttons for easy operation. Compatible with Centurion gate motors and receivers. Long battery life with low battery indicator.",
  
  "gemini-slider-12v-7ah-full-kit": "Complete Gemini Slider 12V full kit with all accessories needed for professional gate automation installation. Includes Gemini sliding gate motor, steel rack, battery, two remote controls, safety beams, and all mounting hardware. Suitable for residential gates up to 400kg. Features adjustable speed control, obstacle detection, and auto-close functionality for enhanced convenience and security.",
};

async function updateDescriptions() {
  console.log('🔄 Updating product descriptions...\n');
  
  let updated = 0;
  const total = Object.keys(PRODUCT_DESCRIPTIONS).length;
  
  for (const [slug, description] of Object.entries(PRODUCT_DESCRIPTIONS)) {
    try {
      await db
        .update(products)
        .set({ description })
        .where(eq(products.slug, slug));
      
      updated++;
      console.log(`✓ Updated: ${slug}`);
    } catch (error) {
      console.error(`✗ Failed: ${slug} -`, error);
    }
  }
  
  console.log(`\n✅ Updated ${updated}/${total} product descriptions`);
  process.exit(0);
}

updateDescriptions().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
