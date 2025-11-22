import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { categories, products, blogPosts } from "../shared/schema";
import pLimit from "p-limit";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { eq, sql } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: This script seeds the PRODUCTION database
// Make sure you have PROD_DATABASE_URL environment variable set

const databaseUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ No database URL found! Set PROD_DATABASE_URL or DATABASE_URL");
  process.exit(1);
}

console.log("🚀 Seeding PRODUCTION database...\n");
console.log(`📊 Database: ${databaseUrl.includes('neon.tech') ? 'Neon (Production)' : 'Local'}\n`);

const sql_client = neon(databaseUrl);
const db = drizzle(sql_client);

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  'gate-motors': 'gate-motors',
  'garage-motors': 'gate-motors',
  'electric-fencing': 'electric-fencing',
  'cctv-cameras': 'cctv',
  'intercoms': 'intercoms',
  'remotes': 'remotes',
  'batteries': 'batteries',
  'lp-gas': 'lp-gas',
  'all': 'gate-motors',
  'gate-motor': 'gate-motors',
  'battery': 'batteries',
  'remote': 'remotes',
  'solar': 'batteries',
  'cctv': 'cctv',
  'camera': 'cctv',
  'intercom': 'intercoms',
  'gas': 'lp-gas',
  'garage': 'gate-motors',
  'beam': 'electric-fencing',
  'pcb': 'gate-motors',
  'charger': 'gate-motors',
  'bracket': 'gate-motors',
  'rack': 'gate-motors',
  'door': 'gate-motors',
  'cable': 'gate-motors',
  'accessories': 'gate-motors',
};

// Define categories
const CATEGORIES_DATA = [
  {
    slug: "electric-fencing",
    name: "Electric Fencing",
    description: "Comprehensive electric fence security systems including energizers, beams, and accessories for perimeter protection.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/energizer-10km-electric-fence-online-sales-alectra-solutions.png",
  },
  {
    slug: "gate-motors",
    name: "Gate Motors",
    description: "Premium sliding and swing gate motors from Centurion, ET Nice, and Gemini with smart features and load-shedding protection.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor.jpg",
  },
  {
    slug: "cctv",
    name: "CCTV Systems",
    description: "HD and 4K CCTV cameras, DVRs, and complete surveillance kits for home and business security.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/4-channel-cctv-camera-kit.jpg",
  },
  {
    slug: "garage-door-parts",
    name: "Garage Door Parts",
    description: "Quality garage door components including Glosteel doors, hinges, springs, cables, and hardware.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/glosteel-garage-door-2134-x-2032.jpg",
  },
  {
    slug: "remotes",
    name: "Remotes",
    description: "Gate and garage remote controls compatible with Centurion, Gemini, Sentry, and other major brands.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/nova-4-button-remote-alectra-solutions.png",
  },
  {
    slug: "intercoms",
    name: "Intercoms",
    description: "Gate intercoms including Centurion G-Speak SmartGuard, ET Nice, and Kocom systems with maglocks.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/g-speak-ultra-intercom.jpg",
  },
  {
    slug: "batteries",
    name: "Batteries",
    description: "Backup batteries for gate motors, alarms, and electric fences - 12V, 24V, lithium, and gel batteries.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/12v-7ah-battery-backup-power.jpg",
  },
  {
    slug: "garage-motors",
    name: "Garage Motors",
    description: "Garage door motors for sectional, roll-up, and tilt-up doors with remote control.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-sectional-garage-door-motor-kit.jpg",
  },
  {
    slug: "lp-gas",
    name: "LP Gas",
    description: "LP Gas cylinders in 9kg, 19kg, and 48kg sizes - exchange and refill service available.",
    imageUrl: "https://alectra.co.za/cdn/shop/files/48kg-lp-gas-exchange-refill.png",
  },
];

// Blog posts
const BLOG_POSTS_DATA = [
  {
    slug: "best-gate-motors-load-shedding-south-africa-2025",
    title: "Best Gate Motors for Load-Shedding in South Africa 2025",
    excerpt: "Discover the top gate motors with built-in backup power solutions designed specifically for South Africa's load-shedding challenges.",
    content: `<h2>Navigating Load-Shedding with Smart Gate Automation</h2>
<p>Load-shedding has become a daily reality for South Africans, making it crucial to invest in gate motors that can continue operating during power outages. The right gate motor can be the difference between being locked out of your property or maintaining seamless access regardless of Eskom's schedule.</p>

<h3>Top Gate Motor Choices for 2025</h3>

<h4>1. Centurion D5 EVO Smart Gate Motor</h4>
<p>The <strong>Centurion D5 EVO Smart</strong> is our top recommendation for load-shedding resilience. This advanced motor features:</p>
<ul>
<li>Built-in battery backup system that can handle up to 50 cycles during power outages</li>
<li>Smart technology for remote monitoring and control via smartphone</li>
<li>Energy-efficient design that extends battery life</li>
<li>Solar panel compatibility for truly off-grid operation</li>
</ul>
<p>Perfect for gates up to 500kg, the D5 EVO combines power with intelligence. The built-in battery charger keeps your backup power ready, and the motor automatically switches to battery power the moment load-shedding hits.</p>

<h4>2. Centurion D3 Smart Gate Motor</h4>
<p>For lighter residential gates, the <strong>D3 Smart</strong> offers excellent value with smart features and reliable backup power. Key benefits include:</p>
<ul>
<li>Integrated battery backup for continued operation during outages</li>
<li>Smartphone integration for remote access</li>
<li>Suitable for gates up to 400kg</li>
<li>Cost-effective solution without compromising on quality</li>
</ul>

<h4>3. Centurion D10 Smart Turbo</h4>
<p>For heavy-duty commercial applications, the <strong>D10 Smart Turbo</strong> delivers unmatched performance:</p>
<ul>
<li>Handles gates up to 1000kg</li>
<li>Robust battery backup system</li>
<li>Turbo mode for faster operation</li>
<li>Commercial-grade durability</li>
</ul>

<h3>Essential Features for Load-Shedding</h3>
<p>When choosing a gate motor for South African conditions, look for:</p>
<ul>
<li><strong>Battery Backup:</strong> Ensure the motor can operate during extended power outages</li>
<li><strong>Solar Compatibility:</strong> Future-proof your installation with solar panel support</li>
<li><strong>Energy Efficiency:</strong> Lower power consumption means longer battery life</li>
<li><strong>Smart Monitoring:</strong> Real-time alerts for battery status and power consumption</li>
</ul>

<h3>Installation Tips</h3>
<p>Maximize your gate motor's load-shedding performance with proper installation:</p>
<ol>
<li>Use quality batteries (12V 7Ah minimum) for optimal backup duration</li>
<li>Consider adding solar panels to keep batteries charged during the day</li>
<li>Install in a well-ventilated area to prevent heat buildup</li>
<li>Regular maintenance ensures reliable operation when you need it most</li>
</ol>

<p>At Alectra Solutions, we stock the complete range of Centurion smart gate motors with expert installation services across Pretoria. Contact us for a free consultation and quote.</p>`,
    author: "Alectra Solutions",
    imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor.jpg",
    tags: ["gate motors", "load-shedding", "centurion", "smart home", "backup power"],
    metaDescription: "Compare the best gate motors for load-shedding in South Africa. Centurion D5 EVO, D3 Smart, and D10 Turbo reviews with battery backup features and installation tips.",
    publishedAt: new Date("2025-01-15"),
  },
  {
    slug: "cctv-buying-guide-south-african-homes",
    title: "CCTV Buying Guide for South African Homes",
    excerpt: "Everything you need to know about choosing, installing, and maintaining a CCTV system for your South African property.",
    content: `<h2>Protecting Your Home with the Right CCTV System</h2>
<p>With crime rates a concern for many South African homeowners, a quality CCTV system provides both deterrence and valuable evidence should an incident occur. This comprehensive guide will help you choose the right system for your property.</p>

<h3>Understanding CCTV Technology</h3>

<h4>Resolution Options</h4>
<ul>
<li><strong>4K Ultra HD (8MP):</strong> Crystal-clear footage, ideal for license plate and facial recognition</li>
<li><strong>Full HD 1080p (2MP):</strong> Excellent clarity for most residential applications</li>
<li><strong>HD 720p (1MP):</strong> Budget option, sufficient for basic monitoring</li>
</ul>

<h4>Camera Types</h4>
<p><strong>Bullet Cameras:</strong> Weather-resistant, long-range, perfect for perimeter monitoring</p>
<p><strong>Dome Cameras:</strong> Discreet, vandal-resistant, ideal for indoor and covered outdoor areas</p>
<p><strong>PTZ Cameras:</strong> Pan-tilt-zoom functionality for actively monitoring large areas</p>

<h3>Essential Features for South African Conditions</h3>

<h4>Night Vision</h4>
<p>Quality infrared (IR) night vision is non-negotiable. Look for:</p>
<ul>
<li>IR range of at least 20-30 meters for perimeter cameras</li>
<li>Automatic IR cut filter for accurate daytime colors</li>
<li>Smart IR to prevent white-out at close range</li>
</ul>

<h4>Weather Resistance</h4>
<p>South African weather varies dramatically. Ensure outdoor cameras have:</p>
<ul>
<li>IP66 or IP67 rating for dust and water resistance</li>
<li>Operating temperature range suitable for your climate</li>
<li>UV-resistant housing to prevent sun damage</li>
</ul>

<h4>Storage Solutions</h4>
<p><strong>DVR (Digital Video Recorder):</strong> Records and stores footage from analogue cameras</p>
<p><strong>NVR (Network Video Recorder):</strong> Handles IP cameras over your network</p>
<p><strong>Cloud Storage:</strong> Off-site backup for added security</p>

<h3>Recommended Systems by Property Size</h3>

<h4>Small Properties (1-3 cameras)</h4>
<p>A 4-channel kit with 2-3 bullet cameras provides adequate coverage for:</p>
<ul>
<li>Front entrance and driveway</li>
<li>Back yard</li>
<li>Side access points</li>
</ul>

<h4>Medium Properties (4-8 cameras)</h4>
<p>An 8-channel system allows comprehensive coverage:</p>
<ul>
<li>All entry points</li>
<li>Perimeter monitoring</li>
<li>Garage and outbuildings</li>
<li>Pool area</li>
</ul>

<h4>Large Properties (8+ cameras)</h4>
<p>16-channel systems with mix of camera types for:</p>
<ul>
<li>Complete perimeter coverage</li>
<li>Multiple buildings</li>
<li>Long driveways</li>
<li>Commercial applications</li>
</ul>

<h3>Installation Best Practices</h3>
<ol>
<li><strong>Height:</strong> Mount cameras 2.5-3 meters high to prevent tampering while maintaining good viewing angles</li>
<li><strong>Coverage:</strong> Overlap camera views to eliminate blind spots</li>
<li><strong>Lighting:</strong> Supplement with motion-activated lights for better night footage</li>
<li><strong>Cabling:</strong> Use quality cables and proper conduit for protection</li>
<li><strong>Power:</strong> Consider a UPS backup for continuous recording during load-shedding</li>
</ol>

<h3>Maintenance Tips</h3>
<p>Keep your CCTV system performing optimally:</p>
<ul>
<li>Clean camera lenses monthly</li>
<li>Check cable connections quarterly</li>
<li>Review and back up important footage regularly</li>
<li>Update DVR/NVR firmware for security patches</li>
<li>Test night vision and motion detection quarterly</li>
</ul>

<h3>Budget Considerations</h3>
<p><strong>Entry Level:</strong> R3,000-R5,000 for a basic 4-channel HD system</p>
<p><strong>Mid Range:</strong> R6,000-R12,000 for Full HD with better night vision</p>
<p><strong>Premium:</strong> R15,000+ for 4K systems with advanced features</p>

<p>At Alectra Solutions, we offer professional CCTV installation services across Pretoria with expert advice tailored to your property's specific security needs. Visit our showroom or contact us for a free security assessment.</p>`,
    author: "Alectra Solutions",
    imageUrl: "https://alectra.co.za/cdn/shop/files/4-channel-cctv-camera-kit.jpg",
    tags: ["cctv", "security cameras", "home security", "surveillance", "buying guide"],
    metaDescription: "Complete CCTV buying guide for South African homeowners. Learn about camera types, resolution, features, installation, and choose the right system for your property.",
    publishedAt: new Date("2025-01-20"),
  },
  {
    slug: "electric-fence-installation-tips",
    title: "Electric Fence Installation Tips for South African Properties",
    excerpt: "Professional tips for planning, installing, and maintaining electric fence systems to maximize security and comply with South African regulations.",
    content: `<h2>Essential Guide to Electric Fence Installation</h2>
<p>Electric fencing is one of the most effective perimeter security solutions for South African properties. When properly installed and maintained, it provides a powerful deterrent while remaining safe and legal. This guide covers everything you need to know.</p>

<h3>Planning Your Electric Fence</h3>

<h4>Legal Requirements</h4>
<p>South African law requires electric fences to comply with SABS 1390 standards:</p>
<ul>
<li>Maximum voltage output: 10,000 volts</li>
<li>Warning signs every 10 meters</li>
<li>Fence must not cause permanent harm</li>
<li>Certificate of Compliance (CoC) required after installation</li>
</ul>

<h4>Property Assessment</h4>
<p>Before installation, evaluate:</p>
<ul>
<li><strong>Perimeter length:</strong> Determines energizer size needed</li>
<li><strong>Wall height:</strong> Standard brackets vs. extended brackets</li>
<li><strong>Vegetation:</strong> Plan for regular trimming to prevent earthing</li>
<li><strong>Access points:</strong> Gates require special consideration</li>
</ul>

<h3>Choosing the Right Components</h3>

<h4>Energizers</h4>
<p>Select energizer based on fence length:</p>
<ul>
<li><strong>5-10km range:</strong> Suitable for properties up to 800m perimeter</li>
<li><strong>15-20km range:</strong> For larger properties or multiple zones</li>
<li><strong>Solar option:</strong> Ideal for remote areas or load-shedding backup</li>
</ul>

<h4>Wire Specifications</h4>
<p><strong>High tensile wire (2.5mm):</strong> Most common, good conductivity and strength</p>
<p><strong>Aluminium wire:</strong> Lighter, rust-free, easier installation</p>
<p><strong>Number of strands:</strong> Typically 6-8 strands for optimal security</p>

<h4>Mounting Hardware</h4>
<ul>
<li>Brackets: 450mm, 650mm, or custom heights</li>
<li>Insulators: High-quality to prevent power loss</li>
<li>Springs: Shock absorbers for wire tension</li>
<li>Earth stakes: Minimum 3 for proper grounding</li>
</ul>

<h3>Installation Process</h3>

<h4>Step 1: Bracket Installation</h4>
<ol>
<li>Mark bracket positions every 2.5-3 meters</li>
<li>Use chemical anchors or suitable wall plugs</li>
<li>Ensure brackets are level and secure</li>
<li>Typical spacing: every 2-2.5 meters on straight runs, closer on corners</li>
</ol>

<h4>Step 2: Wire Stringing</h4>
<ol>
<li>Start from energizer position</li>
<li>Thread wire through insulators</li>
<li>Maintain consistent spacing between wires (100-120mm)</li>
<li>Use springs every 50-70 meters and at corners</li>
<li>Keep wire taut but not over-tensioned</li>
</ol>

<h4>Step 3: Grounding System</h4>
<p>Critical for effective fence operation:</p>
<ol>
<li>Install minimum 3 x 1.2m earth stakes</li>
<li>Space stakes 2 meters apart in moist soil</li>
<li>Connect with heavy-duty earth cable</li>
<li>Keep earth system separate from household earth</li>
</ol>

<h4>Step 4: Energizer Connection</h4>
<ol>
<li>Mount energizer in weatherproof box</li>
<li>Position close to power source</li>
<li>Install surge arrester for lightning protection</li>
<li>Connect fence and earth terminals correctly</li>
<li>Add backup battery if desired</li>
</ol>

<h3>Integration with Other Systems</h3>

<h4>Alarm Integration</h4>
<p>Connect electric fence to alarm system via:</p>
<ul>
<li>Fence alarm monitors for voltage drop detection</li>
<li>Armed response integration</li>
<li>SMS alerts for fence faults</li>
</ul>

<h4>Beams and Sensors</h4>
<p>Combine electric fence with:</p>
<ul>
<li>Wireless beams for advanced warning</li>
<li>PIR sensors in vulnerable areas</li>
<li>CCTV cameras at key points</li>
</ul>

<h3>Maintenance Schedule</h3>

<h4>Weekly Checks</h4>
<ul>
<li>Visual inspection for damage</li>
<li>Clear vegetation touching fence</li>
<li>Check voltage reading on energizer</li>
</ul>

<h4>Monthly Maintenance</h4>
<ul>
<li>Test voltage at furthest point (should be above 5,000V)</li>
<li>Inspect all connections for corrosion</li>
<li>Tighten loose wires</li>
<li>Clean insulators</li>
</ul>

<h4>Annual Service</h4>
<ul>
<li>Professional inspection</li>
<li>Test earth resistance (should be below 500 ohms)</li>
<li>Replace worn components</li>
<li>Lightning arrester check</li>
</ul>

<h3>Common Issues and Solutions</h3>

<h4>Low Voltage</h4>
<p><strong>Causes:</strong> Vegetation earthing, poor connections, faulty energizer</p>
<p><strong>Solution:</strong> Clear vegetation, check all connections, test energizer output</p>

<h4>False Alarms</h4>
<p><strong>Causes:</strong> Animals, wind-blown debris, loose wires</p>
<p><strong>Solution:</strong> Adjust alarm sensitivity, secure all wires, trim nearby trees</p>

<h4>Energizer Failures</h4>
<p><strong>Causes:</strong> Lightning strike, power surge, component failure</p>
<p><strong>Solution:</strong> Install surge protection, use quality energizers, regular testing</p>

<h3>Safety Considerations</h3>
<ul>
<li>Install prominent warning signs</li>
<li>Keep children and pets away from fence</li>
<li>Turn off power before maintenance</li>
<li>Use insulated tools when working on fence</li>
<li>Avoid touching fence and earth simultaneously</li>
</ul>

<p>Professional installation ensures compliance, optimal performance, and warranty coverage. Alectra Solutions offers complete electric fence installation services throughout Pretoria with SABS-compliant certification and ongoing maintenance support.</p>`,
    author: "Alectra Solutions",
    imageUrl: "https://alectra.co.za/cdn/shop/files/energizer-10km-electric-fence-online-sales-alectra-solutions.png",
    tags: ["electric fencing", "perimeter security", "installation guide", "home security", "SABS compliance"],
    metaDescription: "Professional electric fence installation guide for South Africa. Learn about legal requirements, components, step-by-step installation, maintenance, and safety tips.",
    publishedAt: new Date("2025-01-25"),
  },
];

// Load products from scraped data
const productDataPath = path.join(__dirname, "product-data.json");
let productsData: any[] = [];

try {
  const productDataRaw = fs.readFileSync(productDataPath, "utf-8");
  productsData = JSON.parse(productDataRaw);
  console.log(`✓ Loaded ${productsData.length} products from product-data.json\n`);
} catch (error) {
  console.error("❌ Failed to load product-data.json");
  process.exit(1);
}

async function seedProduction() {
  try {
    // 1. Seed Categories
    console.log("📦 Seeding categories...");
    for (const cat of CATEGORIES_DATA) {
      try {
        await db.insert(categories).values(cat).onConflictDoNothing();
        console.log(`  ✓ ${cat.name}`);
      } catch (error: any) {
        if (error.message?.includes("duplicate key")) {
          console.log(`  → ${cat.name} (already exists)`);
        } else {
          console.error(`  ✗ Failed to insert ${cat.name}:`, error.message);
        }
      }
    }

    // Get category IDs
    const categoriesData = await db.select().from(categories);
    const categoryMap = new Map(categoriesData.map((c) => [c.slug, c.id]));

    // 2. Seed Products
    console.log(`\n📦 Seeding ${productsData.length} products...`);
    const limit = pLimit(5);
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    const productPromises = productsData.map((rawProduct: any, index: number) =>
      limit(async () => {
        try {
          // Determine category
          const categoryHint = rawProduct.categoryHint?.toLowerCase() || "";
          const categorySlug = CATEGORY_MAP[categoryHint] || null;
          const categoryId = categorySlug ? categoryMap.get(categorySlug) : null;

          // Generate SKU
          const skuSuffix = rawProduct.slug.toUpperCase().replace(/-/g, "-").substring(0, 20);
          const sku = `ALEC-${String(index + 1).padStart(4, "0")}-${skuSuffix}`;

          // Check if product already exists
          const existing = await db
            .select()
            .from(products)
            .where(eq(products.slug, rawProduct.slug))
            .limit(1);

          if (existing.length > 0) {
            skipCount++;
            if (skipCount % 50 === 0) {
              console.log(`  → Skipped ${skipCount} existing products...`);
            }
            return;
          }

          // Insert product
          await db.insert(products).values({
            name: rawProduct.name,
            slug: rawProduct.slug,
            description: rawProduct.description?.substring(0, 500) || "",
            price: rawProduct.price,
            brand: rawProduct.brand || "Alectra Solutions",
            categoryId: categoryId,
            sku: sku,
            imageUrl: rawProduct.imageUrl,
            images: rawProduct.imageGallery || [],
            stock: 100,
            featured: false,
          });

          successCount++;
          if (successCount % 50 === 0) {
            console.log(`  ✓ Inserted ${successCount} products...`);
          }
        } catch (error: any) {
          errorCount++;
          console.error(`  ✗ Error inserting ${rawProduct.name}:`, error.message);
        }
      })
    );

    await Promise.all(productPromises);

    console.log(`\n✅ Products seeded: ${successCount} inserted, ${skipCount} skipped, ${errorCount} errors`);

    // 3. Seed Blog Posts
    console.log("\n📝 Seeding blog posts...");
    for (const post of BLOG_POSTS_DATA) {
      try {
        await db.insert(blogPosts).values(post).onConflictDoNothing();
        console.log(`  ✓ ${post.title}`);
      } catch (error: any) {
        if (error.message?.includes("duplicate key")) {
          console.log(`  → ${post.title} (already exists)`);
        } else {
          console.error(`  ✗ Failed to insert ${post.title}:`, error.message);
        }
      }
    }

    console.log("\n🎉 Production database seeding complete!");
    console.log(`\n📊 Summary:`);
    console.log(`  • Categories: ${CATEGORIES_DATA.length}`);
    console.log(`  • Products: ${successCount} new (${skipCount} already existed)`);
    console.log(`  • Blog Posts: ${BLOG_POSTS_DATA.length}`);

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding
seedProduction()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
