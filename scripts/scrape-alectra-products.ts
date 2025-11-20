import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string;
  }>;
  images: Array<{
    src: string;
    alt: string | null;
  }>;
}

interface ShopifyCollection {
  handle: string;
  title: string;
}

interface ProductData {
  slug: string;
  name: string;
  price: string;
  compareAtPrice?: string;
  brand?: string;
  categoryHint: string;
  imageUrl: string;
  description: string;
}

const BASE_URL = "https://alectra.co.za";
const OUTPUT_FILE = path.join(__dirname, "product-data.json");

// Known categories from the website navigation
const COLLECTIONS = [
  "gate-motors",
  "garage-motors", 
  "garage-doors",
  "electric-fencing",
  "cctv-cameras",
  "intercoms",
  "remotes",
  "batteries",
  "lp-gas",
  "electrical-components",
  "manuals",
];

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`  Retry ${i + 1}/${retries} for ${url}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function scrapeCollection(collectionHandle: string): Promise<ProductData[]> {
  console.log(`\n📦 Scraping collection: ${collectionHandle}`);
  const products: ProductData[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `${BASE_URL}/collections/${collectionHandle}/products.json?limit=250&page=${page}`;
      console.log(`  Fetching page ${page}...`);
      
      const data = await fetchWithRetry(url);
      
      if (!data.products || data.products.length === 0) {
        hasMore = false;
        break;
      }

      for (const product of data.products as ShopifyProduct[]) {
        // Extract product data
        const variant = product.variants[0]; // Use first variant
        const price = variant.price;
        const compareAtPrice = variant.compare_at_price;
        
        // Clean HTML description
        const description = product.body_html
          ? product.body_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
          : product.title;

        // Determine brand from vendor or product title
        const brand = product.vendor || extractBrand(product.title);

        // Get main image
        const imageUrl = product.images[0]?.src || '';

        products.push({
          slug: product.handle,
          name: product.title,
          price: price,
          compareAtPrice: compareAtPrice || undefined,
          brand: brand || undefined,
          categoryHint: collectionHandle,
          imageUrl: imageUrl,
          description: description.substring(0, 500), // Limit description length
        });
      }

      console.log(`  ✓ Found ${data.products.length} products on page ${page}`);
      
      // Check if there are more pages
      if (data.products.length < 250) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (error) {
      console.error(`  ✗ Error scraping page ${page}:`, error);
      hasMore = false;
    }
  }

  console.log(`  Total: ${products.length} products`);
  return products;
}

function extractBrand(title: string): string {
  // Extract brand from product title
  const brands = [
    'Centurion', 'Gemini', 'ET Nice', 'E.T Nice', 'Digidoor', 'DTS', 
    'Hansa', 'Nemtek', 'IDS', 'Sentry', 'Hilook', 'Hikvision', 
    'Andowl', 'JVA', 'Kocom', 'Zartek', 'EPS', 'Battery', 'Lithium',
    'Absolute', 'Garador', 'Elev8tor', 'Eazylift', 'Dace', 'DC Blue',
    'Glosteel', 'Vector Vantage'
  ];

  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  return 'Alectra';
}

async function scrapeAllProducts() {
  console.log('🚀 Starting Alectra Products Scraper\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Collections to scrape: ${COLLECTIONS.length}\n`);

  const allProducts: ProductData[] = [];
  const productSlugs = new Set<string>();

  // Scrape each collection
  for (const collection of COLLECTIONS) {
    try {
      const products = await scrapeCollection(collection);
      
      // Add products, deduplicating by slug
      for (const product of products) {
        if (!productSlugs.has(product.slug)) {
          allProducts.push(product);
          productSlugs.add(product.slug);
        }
      }
    } catch (error) {
      console.error(`\n✗ Failed to scrape collection ${collection}:`, error);
    }
  }

  // Also try the main "all products" collection
  console.log('\n📦 Scraping all-products collection...');
  try {
    const allProductsCollection = await scrapeCollection('all');
    for (const product of allProductsCollection) {
      if (!productSlugs.has(product.slug)) {
        allProducts.push(product);
        productSlugs.add(product.slug);
      }
    }
  } catch (error) {
    console.log('  (all-products collection not available)');
  }

  // Save to JSON file
  console.log('\n💾 Saving product data...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allProducts, null, 2));
  console.log(`  ✓ Saved ${allProducts.length} products to ${OUTPUT_FILE}`);

  // Display summary
  console.log('\n✅ Scraping Complete!');
  console.log(`   Total products: ${allProducts.length}`);
  console.log(`   Unique slugs: ${productSlugs.size}`);
  
  // Group by category
  const byCategory = new Map<string, number>();
  for (const product of allProducts) {
    const count = byCategory.get(product.categoryHint) || 0;
    byCategory.set(product.categoryHint, count + 1);
  }
  
  console.log('\n📊 Products by collection:');
  for (const [category, count] of Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${category}: ${count}`);
  }
}

// Run scraper
scrapeAllProducts()
  .then(() => {
    console.log('\n✓ Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Scraper failed:', error);
    process.exit(1);
  });
