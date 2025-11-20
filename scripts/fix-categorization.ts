import { db } from "../server/db";
import { products, categories } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping from scraped categoryHint to our database category slugs
const CATEGORY_MAP: Record<string, string> = {
  'gate-motors': 'gate-motors',
  'garage-motors': 'garage-motors',
  'electric-fencing': 'electric-fencing',
  'cctv-cameras': 'cctv',
  'intercoms': 'intercoms',
  'remotes': 'remotes',
  'batteries': 'batteries',
  'lp-gas': 'lp-gas',
  'electrical-components': 'electrical-components',
  'all': 'gate-motors', // Default for "all" collection products
};

interface ProductData {
  slug: string;
  name: string;
  price: string;
  categoryHint: string;
}

async function fixCategorization() {
  console.log('🔧 Starting Product Re-categorization\n');

  // Load scraped product data
  const productDataPath = path.join(__dirname, "product-data.json");
  const productDataRaw = fs.readFileSync(productDataPath, 'utf-8');
  const scrapedProducts: ProductData[] = JSON.parse(productDataRaw);
  
  console.log(`✓ Loaded ${scrapedProducts.length} products from scraped data\n`);

  // Get category IDs
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map<string, string>();
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat.id);
  }
  console.log(`✓ Found ${categoryMap.size} categories in database\n`);

  // Group products by target category
  const categorizations = new Map<string, string[]>();
  
  for (const product of scrapedProducts) {
    const targetCategorySlug = CATEGORY_MAP[product.categoryHint] || 'gate-motors';
    if (!categorizations.has(targetCategorySlug)) {
      categorizations.set(targetCategorySlug, []);
    }
    categorizations.get(targetCategorySlug)!.push(product.slug);
  }

  console.log('📊 Categorization Summary:');
  for (const [catSlug, slugs] of categorizations.entries()) {
    console.log(`  ${catSlug}: ${slugs.length} products`);
  }
  console.log();

  // Update products in database
  let totalUpdated = 0;
  
  for (const [targetCategorySlug, productSlugs] of categorizations.entries()) {
    const targetCategoryId = categoryMap.get(targetCategorySlug);
    if (!targetCategoryId) {
      console.log(`⚠️  Warning: Category ${targetCategorySlug} not found in database`);
      continue;
    }

    // Update products in batches
    for (const slug of productSlugs) {
      try {
        const result = await db
          .update(products)
          .set({ categoryId: targetCategoryId })
          .where(eq(products.slug, slug));
        totalUpdated++;
      } catch (error) {
        console.log(`  ✗ Failed to update ${slug}:`, error);
      }
    }
  }

  console.log(`\n✅ Re-categorization Complete!`);
  console.log(`   Total products updated: ${totalUpdated}`);

  // Show final category counts
  console.log('\n📈 Final Category Distribution:');
  const finalCounts = await db.execute(sql`
    SELECT c.name, COUNT(p.id) as count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY count DESC
  `);
  
  for (const row of finalCounts.rows) {
    console.log(`  ${row.name}: ${row.count} products`);
  }
}

fixCategorization()
  .then(() => {
    console.log('\n✓ Success!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Error:', error);
    process.exit(1);
  });
