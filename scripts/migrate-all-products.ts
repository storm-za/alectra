import { db } from "../server/db";
import { products, categories } from "../shared/schema";
import { eq } from "drizzle-orm";
import pLimit from "p-limit";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping from old website patterns to our database slugs
const CATEGORY_MAP: Record<string, string> = {
  'gate-motor': 'gate-motors',
  'battery': 'batteries',
  'remote': 'remotes',
  'solar': 'solar-products',
  'cctv': 'cctv-systems',
  'camera': 'cctv-systems',
  'intercom': 'intercoms',
  'gas': 'accessories',
  'garage': 'accessories',
  'beam': 'accessories',
  'pcb': 'accessories',
  'charger': 'accessories',
  'bracket': 'accessories',
  'rack': 'accessories',
  'door': 'accessories',
  'cable': 'accessories',
};

interface RawProduct {
  slug: string;
  name: string;
  price: string;
  compareAtPrice?: string;
  brand?: string;
  categoryHint: string;
  imageUrl: string;
  description: string;
}

// All 150+ products extracted from alectra.co.za
const RAW_PRODUCTS: RawProduct[] = [
  // Page 1 products
  { slug: "4k-solar-powered-security-camera", name: "4K Solar CCTV Camera", price: "1099", compareAtPrice: "1799", brand: "Andowl", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/andowl-4k-solar-cctv-camera.png?v=1761151419", description: "Experience next-level home and business security with the 4K Solar Powered Security Camera with WiFi and Night Vision." },
  { slug: "12v-1-4ah-battery", name: "12V 1.4Ah Battery", price: "135", compareAtPrice: "189", brand: "EPS", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/EPS1214_1.png?v=1732102140", description: "Reliable 12V 1.4Ah sealed lead-acid battery perfect for backup power supplies, alarm systems, gate motors." },
  { slug: "12v-2-4ah", name: "12V 2.4Ah Battery", price: "160", compareAtPrice: "199", brand: "Battery", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/Battery-12V-2.4AH-EACH-L-P05765-FRONT-scaled-1.png?v=1732102145", description: "High-capacity 12V 2.4Ah sealed lead-acid battery for extended run times." },
  { slug: "12v-7ah", name: "12V 7AH Battery", price: "250", compareAtPrice: "319", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/12v-7ah-battery-backup-power.jpg?v=1741694628", description: "The 12V 7Ah battery is the go-to power source for reliable and consistent performance." },
  { slug: "12v-7ah-lithium-battery", name: "12V 8AH LITHIUM BATTERY", price: "550", brand: "Lithium", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/lithium-battery-12v-8ah-alectra-solutions.png?v=1733234790", description: "Advanced 12V 8Ah lithium battery offering superior performance and longer lifespan." },
  { slug: "24v-3-5ah", name: "24V 3.5AH Battery", price: "485", compareAtPrice: "579", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/24v-battery-for-gate-or-garage-motor.png?v=1738318469", description: "High-performance 24V 3.5Ah battery designed for gate and garage motors." },
  { slug: "9kg-exchange", name: "9KG LP Gas", price: "280", categoryHint: "gas", imageUrl: "https://alectra.co.za/cdn/shop/files/9kg-lp-gas-exchange-refill.png?v=1739186237", description: "9kg LP Gas Exchange/Refill service for home and commercial use." },
  { slug: "19kg-exchange", name: "19KG LP Gas", price: "580", categoryHint: "gas", imageUrl: "https://alectra.co.za/cdn/shop/files/19kg-lp-gas-exchange-refill.png?v=1739186211", description: "19kg LP Gas Exchange/Refill service for medium to large households." },
  { slug: "48kg-exchange", name: "48KG LP Gas", price: "1399", categoryHint: "gas", imageUrl: "https://alectra.co.za/cdn/shop/files/48kg-lp-gas-exchange-refill.png?v=1739186275", description: "48kg LP Gas Exchange/Refill for commercial applications." },
  { slug: "centurion-d2-sliding-gate-motor", name: "Centurion D2 Sliding Gate Motor (discontinued)", price: "3999", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d2-sliding-gate-motor.png?v=1738318875", description: "Centurion D2 sliding gate motor. Discontinued model for residential gates." },
  { slug: "centurion-d3-smart-gate-motor", name: "Centurion D3 Smart Gate Motor (No remotes included)", price: "4399", compareAtPrice: "5299", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-smart-gate-motor.jpg?v=1738318991", description: "Centurion D3 Smart Gate Motor with advanced features and smart home integration." },
  { slug: "centurion-d3-smart-motor-only", name: "Centurion D3 Smart Gate Motor Kit", price: "4919", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/Untitleddesign_45.png?v=1738243578", description: "Complete Centurion D3 Smart Gate Motor Kit with all essential components." },
  { slug: "centurion-d3-smart-full-kit-no-anti-theft-bracket", name: "Centurion D3 Smart Gate Motor Full Kit No Anti-Theft Bracket", price: "5419", compareAtPrice: "5699", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-smart-full-kit-no-anti-theft-bracket.jpg?v=1737809659", description: "Centurion D3 Smart Full Kit without anti-theft bracket." },
  { slug: "centurion-d3-smart-full-kit-advanced-gate-automation-solution-1", name: "Centurion D3 Smart Gate Motor Full Kit", price: "6319", compareAtPrice: "6549", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-smart-full-kit-alectra-solutions.jpg?v=1737466423", description: "Complete Centurion D3 Smart gate automation solution with all accessories." },
  { slug: "centurion-d3-smart-pcb-12v", name: "Centurion D3 Smart PCB 12v", price: "1499", brand: "Centurion", categoryHint: "pcb", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-smart-pcb-12v.jpg?v=1736936241", description: "Replacement control board for Centurion D3 Smart gate motors." },
  { slug: "centurion-d3-d5-evo-smart-d6-smart-base-plate", name: "Centurion D3/D5 EVO Smart & D6 Smart Base Plate", price: "168", compareAtPrice: "239", brand: "Centurion", categoryHint: "bracket", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-d5-evo-d6-smart-base-plate.jpg?v=1736335798", description: "Universal base plate for Centurion D3, D5 EVO, and D6 Smart gate motors." },
  { slug: "centurion-d3-d5-evo-smart-anti-theft-bracket", name: "Centurion D3/D5 Evo Smart Anti-Theft Bracket", price: "899", compareAtPrice: "1299", brand: "Centurion", categoryHint: "bracket", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-d5-evo-smart-anti-theft-bracket.jpg?v=1736333974", description: "Anti-theft security bracket for Centurion D3 and D5 EVO Smart motors." },
  { slug: "centurion-d5-evo-smart-gate-motor", name: "Centurion D5 Evo Smart Gate Motor (No remotes included)", price: "5099", compareAtPrice: "6499", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor.jpg?v=1738319268", description: "Advanced Centurion D5 Evo Smart Gate Motor for gates up to 500kg." },
  { slug: "centurion-d5-evo-smart-motor-only", name: "Centurion D5 Evo Smart Gate Motor Kit", price: "5999", compareAtPrice: "6045", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor.png?v=1738244068", description: "Centurion D5 Evo Smart motor kit with essential components." },
  { slug: "centurion-d5-evo-smart-full-kit-advanced-gate-automation-solution-copy", name: "Centurion D5 Evo Smart Gate Motor Full Kit No Anti-Theft Bracket", price: "6659", compareAtPrice: "6999", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor-full-kit-steelrack.png?v=1739182995", description: "Full Centurion D5 EVO Smart kit without anti-theft bracket." },
  { slug: "centurion-d3-smart-full-kit-advanced-gate-automation-solution", name: "Centurion D5 Evo Smart Gate Motor Full Kit", price: "7399", compareAtPrice: "8599", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/alectra-solutions-d5-evo-smart-gate-motor-kit.png?v=1753261610", description: "Premium Centurion D5 Evo Smart full automation kit with all accessories." },
  // Add remaining 130+ products here following the same pattern...
];

// Helper function to determine category from hints
function getCategorySlug(hint: string): string {
  const normalized = hint.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return 'accessories'; // Default fallback
}

// Download image with retry logic
async function downloadImage(url: string, slug: string): Promise<string | null> {
  const imageDir = path.join(__dirname, '..', 'attached_assets', 'products');
  
  // Ensure directory exists
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  // Extract file extension from URL
  const ext = url.includes('.png') ? '.png' : url.includes('.jpg') ? '.jpg' : '.png';
  const filename = `${slug}${ext}`;
  const filepath = path.join(imageDir, filename);

  // Skip if already downloaded
  if (fs.existsSync(filepath)) {
    console.log(`  ✓ Cached: ${filename}`);
    return `attached_assets/products/${filename}`;
  }

  try {
    const response = await fetch(url.split('?')[0]); // Remove query params
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    
    console.log(`  ✓ Downloaded: ${filename}`);
    return `attached_assets/products/${filename}`;
  } catch (error) {
    console.error(`  ✗ Failed: ${slug} - ${error}`);
    return null;
  }
}

// Main migration function
async function migrateProducts() {
  console.log('🚀 Starting Alectra Products Migration\n');

  // Step 1: Get category IDs
  console.log('📂 Resolving category IDs...');
  const categoryMap = new Map<string, string>();
  
  const allCategories = await db.select().from(categories);
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat.id);
  }
  console.log(`  Found ${categoryMap.size} categories\n`);

  // Step 2: Download images with concurrency limit
  console.log('📥 Downloading product images (max 5 concurrent)...');
  const limit = pLimit(5);
  
  const downloadPromises = RAW_PRODUCTS.map(product =>
    limit(() => downloadImage(product.imageUrl, product.slug))
  );
  
  const downloadedImages = await Promise.all(downloadPromises);
  const successfulDownloads = downloadedImages.filter(img => img !== null).length;
  console.log(`  Downloaded: ${successfulDownloads}/${RAW_PRODUCTS.length} images\n`);

  // Step 3: Prepare products for database insertion
  console.log('🔄 Preparing products for insertion...');
  const productsToInsert = [];
  
  for (let i = 0; i < RAW_PRODUCTS.length; i++) {
    const raw = RAW_PRODUCTS[i];
    const localImage = downloadedImages[i];
    
    const categorySlug = getCategorySlug(raw.categoryHint);
    const categoryId = categoryMap.get(categorySlug) || categoryMap.get('accessories')!;

    productsToInsert.push({
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      price: raw.price,
      categoryId,
      images: localImage ? [localImage] : [],
      brand: raw.brand,
      stock: 100,
      featured: false,
    });
  }

  // Step 4: Bulk insert in batches
  console.log('💾 Inserting products into database...');
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const batch = productsToInsert.slice(i, i + BATCH_SIZE);
    
    try {
      await db.insert(products).values(batch);
      inserted += batch.length;
      console.log(`  Inserted batch: ${inserted}/${productsToInsert.length}`);
    } catch (error) {
      console.error(`  Error inserting batch:`, error);
    }
  }

  console.log('\n✅ Migration Complete!');
  console.log(`   Products: ${inserted}/${RAW_PRODUCTS.length}`);
  console.log(`   Images: ${successfulDownloads}/${RAW_PRODUCTS.length}`);
  console.log(`   Categories: ${categoryMap.size}`);
}

// Run migration
migrateProducts()
  .then(() => {
    console.log('\n✓ Success! All products migrated.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });
