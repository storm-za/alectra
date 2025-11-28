import { db } from "../server/db";
import { products, categories, blogPosts } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

async function exportDevDatabase() {
  console.log("Exporting development database with original image URLs...");

  const allProducts = await db.select().from(products);
  const allCategories = await db.select().from(categories);
  const allBlogs = await db.select().from(blogPosts);

  // Load original scraped data to get remote image URLs
  const scrapedDataPath = path.join(process.cwd(), "scripts", "product-data.json");
  let scrapedData: any[] = [];
  try {
    const rawData = fs.readFileSync(scrapedDataPath, "utf-8");
    scrapedData = JSON.parse(rawData);
    console.log(`Loaded ${scrapedData.length} products from scraper with original URLs`);
  } catch (e) {
    console.warn("Could not load product-data.json, will use database URLs");
  }

  // Create a map of slug -> original imageUrl
  const slugToImageUrl = new Map<string, string>();
  const slugToImageGallery = new Map<string, string[]>();
  scrapedData.forEach((p: any) => {
    slugToImageUrl.set(p.slug, p.imageUrl);
    if (p.imageGallery && p.imageGallery.length > 0) {
      slugToImageGallery.set(p.slug, p.imageGallery);
    }
  });

  const exportData = {
    products: allProducts.map(p => {
      // Prefer local images over remote Shopify URLs for independence
      // Local images are bundled with the app, no dependency on external CDN
      return {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        brand: p.brand,
        sku: p.sku,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl, // Use database URL (local paths from migration)
        images: p.images || [], // Use database gallery
        stock: p.stock,
        featured: p.featured,
        discontinued: (p as any).discontinued || false,
      };
    }),
    categories: allCategories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
    })),
    blogs: allBlogs.map(b => ({
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt,
      content: b.content,
      author: b.author,
      imageUrl: b.imageUrl,
      tags: b.tags,
      metaDescription: b.metaDescription,
    })),
  };

  const outputPath = path.join(process.cwd(), "scripts", "dev-database-export.json");
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  const remoteImages = exportData.products.filter(p => p.imageUrl.startsWith('http')).length;
  const localImages = exportData.products.filter(p => !p.imageUrl.startsWith('http')).length;

  console.log(`✅ Exported ${allProducts.length} products`);
  console.log(`   - ${remoteImages} with remote URLs (Shopify CDN)`);
  console.log(`   - ${localImages} with local paths (will fallback to DB)`);
  console.log(`✅ Exported ${allCategories.length} categories`);
  console.log(`✅ Exported ${allBlogs.length} blog posts`);
  console.log(`📁 Saved to: ${outputPath}`);
}

exportDevDatabase().catch(console.error);
