import { db } from "../server/db";
import { products, categories } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function recategorizeProducts() {
  console.log("Starting product recategorization based on alectra.co.za...");

  // Get all category IDs
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));

  // Category mappings based on exact alectra.co.za product names
  const categoryMappings: { [key: string]: string[] } = {
    'gate-motors': [
      // Gate motor products from alectra.co.za/collections/gate-motors
      'Centurion D10 Smart Sliding Gate Motor',
      'Centurion D10 Smart Turbo Gate Motor',
      'Centurion D2 Sliding Gate Motor',
      'Centurion D3 Smart Gate Motor',
      'Centurion D3/D5 EVO Smart & D6 Smart Base Plate',
      'Centurion D3/D5 Evo Smart Anti-Theft Bracket',
      'Centurion D5 Evo Anti-Theft Bracket',
      'Centurion D5 Evo Sliding Gate Motor',
      'Centurion D5 Sliding Gate Motor',
      'Centurion D6 Smart Gate Motor',
      'Centurion Octo Plus Receiver',
      'D10 Gear Box',
      'D10 Motor Only',
      'D5 Evo Charger for Gate Motors',
      'D5 Gear Box Centurion D5',
      'D5/D10 Motor 24V Only',
      // Gate motor kits from gate-motor-kits-specials
      'Centurion D3 Smart Gate Motor Kit',
      'Centurion D3 Smart Gate Motor Full Kit No Anti-Theft Bracket',
      'Centurion D3 Smart Gate Motor Full Kit',
      'Centurion D5 Evo Smart Full Kit',
      'Centurion D5 Evo Full Kit with 6m Nylon Rack',
      // All nylon racks, steel racks, PCBs, and gate motor accessories
      '2m Nylon Rack',
      '3m Nylon Rack',
      '4m Nylon Rack',
      '5m Nylon Rack',
      '6m Nylon Rack',
      '1m Steel Rack',
      '2m Steel Rack',
      '3m Steel Rack',
      'Aluminium Bracket',
      'Anti-Theft Bracket',
      'PCB',
      'Receiver',
      'Charger',
      'Gear Box',
      'Base Plate',
      'Cable Drum',
      'Vector / Vantage Cable',
    ],
    'garage-motors': [
      // Garage motor products from alectra.co.za/collections/garage-motors
      'CENTURION RDO II ROLL-UP Complete Kit',
      'CENTURION SDO4 T10 Smart Kit',
      'CENTURION SDO4 T12 Smart Kit',
      'DC Blue Advance Sectional Garage Motor Kit + Extrusion',
      'DC Blue Advance Sectional Garage Motor Only',
      'Centurion SDO4 Motor',
      'Centurion Replacement Battery 24V',
      'E.T Advance Pico Garage Motor',
    ],
    'garage-doors': [
      // Garage door parts from garage-door-parts collection
      'Top Roller Bracket Large',
      'Nylon Roller Heavy Duty',
      'Lifting Cables Torsion',
      'Lifting Cables Tension',
      'Garage Door Spring',
      'Bottom Seal',
      'Weather Seal',
    ],
    'electric-fencing': [
      // Electric fencing from electric-fencing collection
      '8 Line – 30 Meter Advanced Electric Fence Kit',
      '6 Line – 20 Meter Advanced Electric Fence Kit',
      // All electric fence energizers, beams, brackets, etc.
      'Nemtek',
      'JVA',
      'Wizord',
      'Energizer',
      'Druid',
      'Beam',
      'Spring',
      'Bracket',
      'Isolator',
      'Earth Spike',
      'Lightning Diverter',
      'Warning Sign',
      'Alarm Module',
      'Fence Tester',
      'Cut-Out Switch',
    ],
    'cctv': [
      // CCTV from cctv-cameras collection
      '4K Solar CCTV Camera',
      'Hilook 2MP Bullet Camera',
      'Hilook 2MP Hybrid Dual Light Camera',
      'Hilook',
      'Hikvision',
      'DVR',
      'NVR',
      'Camera',
      'CCTV',
    ],
    'intercoms': [
      // Intercoms from intercoms collection
      'Centurion G-Speak Ultra 4-button Intercom',
      'Centurion G-Speak Ultra Upgrade Kit Intercom',
      'Centurion G-Ultra Gsm Smart Switch',
      'Centurion G-Speak Ultra Intercom',
      'G-Speak',
      'G-SPEAK',
      'Kocom',
      'E.T Nice',
      'Zartek',
      'Intercom',
    ],
    'remotes': [
      // Remotes from remotes collection
      'Absolute 4 Button Remote',
      'Centurion Nova 1 Button Remote',
      'Centurion Nova 2 Button Remote',
      'Centurion Nova 4 Button Remote',
      'DTS Octo 5 Button Remote',
      'E.T 1 Button Remote',
      'E.T 2 Button Remote',
      'E.T 4 Button Remote',
      'Gemini 2 Button Remote',
      'Gemini 4 Button Remote',
      'Sentry 2 Button Remote',
      'Sentry 4 Button Remote',
      'Nova',
      'Remote',
      'Transmitter',
    ],
    'batteries': [
      // Batteries from batteries collection
      '12V 1.4Ah Battery',
      '12V 2.4Ah Battery',
      '12V 7AH Battery',
      '12V 8AH LITHIUM BATTERY',
      '24V 3.5AH Battery',
      'Centurion Gate Motor Battery 12V 7AH',
      'Battery',
      '12V',
      '24V',
      'Lithium',
      'Gel',
    ],
    'lp-gas': [
      // LP Gas from lp-gas-exchance collection
      '9KG LP Gas',
      '19KG LP Gas',
      '48KG LP Gas',
      'LP Gas Regulator for 3kg, 5kg, and 7kg Cylinder',
      'LP Gas Regulator for 9kg, 19kg, 48kg Cylinder',
      'LP Gas',
      'Gas',
      'Regulator',
      'Cylinder',
    ],
    'electrical-components': [
      // Electrical components from electrical-component collection
      '4x4 Double Socket Weatherproof Box',
      '2x4 Weatherproof Electrical Box',
      '85X85X50 Universal Weather Proof PVC Box',
      'Maglock',
      'Strike',
      'Solenoid',
      'Transformer',
      'Siren',
      'Strobe',
      'Warning Light',
      'LED',
      'Power Supply',
      'Weatherproof Box',
    ],
  };

  // Get all products
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} total products`);

  let updated = 0;

  for (const product of allProducts) {
    let targetCategory: string | null = null;

    // Check each category's mappings
    for (const [categorySlug, keywords] of Object.entries(categoryMappings)) {
      for (const keyword of keywords) {
        if (product.name.toLowerCase().includes(keyword.toLowerCase())) {
          targetCategory = categorySlug;
          break;
        }
      }
      if (targetCategory) break;
    }

    // Update if category needs to change
    if (targetCategory && categoryMap.has(targetCategory)) {
      const newCategoryId = categoryMap.get(targetCategory);
      if (product.categoryId !== newCategoryId) {
        await db.update(products)
          .set({ categoryId: newCategoryId })
          .where(eq(products.id, product.id));
        
        console.log(`✓ ${product.name} → ${targetCategory}`);
        updated++;
      }
    }
  }

  console.log(`\n✓ Updated ${updated} products`);
  
  // Show final distribution
  const distribution = await db.select({
    category: categories.name,
    count: sql<number>`count(*)::int`
  })
  .from(products)
  .innerJoin(categories, eq(products.categoryId, categories.id))
  .groupBy(categories.id, categories.name)
  .orderBy(sql`count(*) DESC`);

  console.log('\nFinal Distribution:');
  distribution.forEach(d => {
    console.log(`  ${d.category}: ${d.count} products`);
  });
}

recategorizeProducts()
  .then(() => {
    console.log('\n✓ Recategorization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
