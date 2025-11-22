import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { products, categories } from "../shared/schema";
import { sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ No DATABASE_URL found!");
  process.exit(1);
}

console.log("🔍 Checking database...\n");

const sql_client = neon(databaseUrl);
const db = drizzle(sql_client);

async function checkDatabase() {
  try {
    // Count categories
    const categoryCount = await db.select({ count: sql<number>`count(*)` }).from(categories);
    console.log(`📦 Categories: ${categoryCount[0].count}`);

    // Count products
    const productCount = await db.select({ count: sql<number>`count(*)` }).from(products);
    console.log(`🛒 Products: ${productCount[0].count}`);

    // Sample products
    const sampleProducts = await db.select().from(products).limit(5);
    console.log(`\n📋 Sample products:`);
    sampleProducts.forEach(p => {
      console.log(`  • ${p.name} (${p.slug})`);
    });

    // Sample categories
    const sampleCategories = await db.select().from(categories).limit(5);
    console.log(`\n📂 Sample categories:`);
    sampleCategories.forEach(c => {
      console.log(`  • ${c.name} (${c.slug})`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkDatabase().then(() => {
  console.log("\n✅ Done!");
  process.exit(0);
});
