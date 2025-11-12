/**
 * Product Migration Script
 * Fetches products from old alectra.co.za website and imports them into the new database
 */

import { db } from "../server/db";
import { products, categories } from "../shared/schema";
import { eq } from "drizzle-orm";

interface ProductData {
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  brand?: string;
  categorySlug: string;
  inStock: boolean;
}

// Category mapping from old website to new database
const CATEGORY_MAPPING: Record<string, string> = {
  'gate-motor': 'gate-motors',
  'battery': 'batteries',
  'remote': 'remotes',
  'solar': 'solar-products',
  'cctv': 'cctv-systems',
  'intercom': 'intercoms',
  'access': 'access-control',
  'accessory': 'accessories',
};

async function migrateProducts() {
  console.log('Starting product migration from alectra.co.za...');
  
  // List of all product URLs to migrate
  const productUrls = [
    '4k-solar-powered-security-camera',
    '12v-1-4ah-battery',
    '12v-2-4ah',
    '12v-7ah',
    '12v-7ah-lithium-battery',
    '24v-3-5ah',
    '9kg-exchange',
    '19kg-exchange',
    '48kg-exchange',
    'centurion-d2-sliding-gate-motor',
    'centurion-d3-smart-gate-motor',
    'centurion-d3-smart-motor-only',
    'centurion-d3-smart-full-kit-no-anti-theft-bracket',
    'centurion-d3-smart-full-kit-advanced-gate-automation-solution-1',
    'centurion-d3-smart-pcb-12v',
    'centurion-d3-d5-evo-smart-d6-smart-base-plate',
    'centurion-d3-d5-evo-smart-anti-theft-bracket',
    'centurion-d5-evo-smart-gate-motor',
    'centurion-d5-evo-smart-motor-only',
    'centurion-d5-evo-smart-full-kit-advanced-gate-automation-solution-copy',
    'centurion-d3-smart-full-kit-advanced-gate-automation-solution',
    'centurion-d5-evo-sliding-gate-motor',
    'centurion-d5-evo-full-kit',
    'centurion-d5-evo-main-cover',
    'centurion-d5-d6-smart-anti-theft',
    'centurion-d5-cp80-pcb',
    // Add more product URLs as we discover them
  ];

  let migrated = 0;
  let errors = 0;

  for (const productSlug of productUrls) {
    try {
      console.log(`\nProcessing: ${productSlug}`);
      
      // Here we would fetch the product data from the old website
      // For now, this is a placeholder structure
      const productData: ProductData = {
        title: productSlug.replace(/-/g, ' ').toUpperCase(),
        slug: productSlug,
        description: `Product description for ${productSlug}`,
        price: 0,
        images: [],
        categorySlug: 'gate-motors', // Default category
        inStock: true,
      };

      // Insert product into database
      await db.insert(products).values({
        name: productData.title,
        slug: productData.slug,
        description: productData.description,
        price: productData.price.toString(),
        images: productData.images,
        brand: productData.brand,
        stock: 100,
        featured: false,
        categoryId: '', // Will be populated after category lookup
      });

      migrated++;
      console.log(`✓ Migrated: ${productData.title}`);
    } catch (error) {
      console.error(`✗ Error migrating ${productSlug}:`, error);
      errors++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Migration complete!`);
  console.log(`Successfully migrated: ${migrated}`);
  console.log(`Errors: ${errors}`);
  console.log(`========================================`);
}

// Run migration
migrateProducts().catch(console.error);
