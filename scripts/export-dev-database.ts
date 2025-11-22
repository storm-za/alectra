import { db } from "../server/db";
import { products, categories, blogPosts } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

async function exportDevDatabase() {
  console.log("Exporting development database...");

  const allProducts = await db.select().from(products);
  const allCategories = await db.select().from(categories);
  const allBlogs = await db.select().from(blogPosts);

  const exportData = {
    products: allProducts.map(p => ({
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      brand: p.brand,
      sku: p.sku,
      categoryId: p.categoryId,
      imageUrl: p.imageUrl,
      images: p.images,
      stock: p.stock,
      featured: p.featured,
    })),
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

  console.log(`✅ Exported ${allProducts.length} products`);
  console.log(`✅ Exported ${allCategories.length} categories`);
  console.log(`✅ Exported ${allBlogs.length} blog posts`);
  console.log(`📁 Saved to: ${outputPath}`);
}

exportDevDatabase().catch(console.error);
