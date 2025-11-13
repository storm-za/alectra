import { db } from "../server/db";
import { products, categories } from "@shared/schema";
import { eq } from "drizzle-orm";

async function mergeGateMotorCategories() {
  console.log("Starting category merge...");
  
  // Find both categories
  const gateMotorKitsCategory = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, "gate-motor-kits"))
    .limit(1);
  
  const gateMotorsCategory = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, "gate-motors"))
    .limit(1);
  
  if (!gateMotorKitsCategory.length) {
    console.log("Gate Motor Kits category not found");
    return;
  }
  
  if (!gateMotorsCategory.length) {
    console.log("Gate Motors category not found");
    return;
  }
  
  const kitsId = gateMotorKitsCategory[0].id;
  const motorsId = gateMotorsCategory[0].id;
  
  console.log(`Gate Motor Kits ID: ${kitsId}`);
  console.log(`Gate Motors ID: ${motorsId}`);
  
  // Count products in each category
  const kitsProducts = await db
    .select()
    .from(products)
    .where(eq(products.categoryId, kitsId));
  
  const motorsProducts = await db
    .select()
    .from(products)
    .where(eq(products.categoryId, motorsId));
  
  console.log(`Products in Gate Motor Kits: ${kitsProducts.length}`);
  console.log(`Products in Gate Motors: ${motorsProducts.length}`);
  console.log(`Total after merge: ${kitsProducts.length + motorsProducts.length}`);
  
  // Move all products from Gate Motor Kits to Gate Motors
  const updateResult = await db
    .update(products)
    .set({ categoryId: motorsId })
    .where(eq(products.categoryId, kitsId));
  
  console.log("Updated products to Gate Motors category");
  
  // Delete the Gate Motor Kits category
  await db.delete(categories).where(eq(categories.id, kitsId));
  
  console.log("Deleted Gate Motor Kits category");
  console.log("Category merge completed successfully!");
  
  // Verify the final count
  const finalCount = await db
    .select()
    .from(products)
    .where(eq(products.categoryId, motorsId));
  
  console.log(`Final product count in Gate Motors: ${finalCount.length}`);
}

mergeGateMotorCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error merging categories:", error);
    process.exit(1);
  });
