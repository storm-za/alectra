import { db } from "../server/db";
import { products, categories } from "../shared/schema";
import { eq, ilike, or } from "drizzle-orm";

async function recategorizeProductsExact() {
  console.log("Starting EXACT product recategorization based on alectra.co.za...");

  // Get all category IDs
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map(c => [c.slug, c.id]));

  // Helper function to categorize a product
  function categorizeProduct(name: string): string {
    const lowerName = name.toLowerCase();

    // ELECTRICAL COMPONENTS (weatherproof boxes, maglocks, sirens, strobes, warning lights)
    if (
      lowerName.includes('weatherproof box') ||
      lowerName.includes('pvc box') ||
      lowerName.includes('electrical box') ||
      lowerName.includes('maglock') ||
      lowerName.includes('siren') && !lowerName.includes('kit') ||
      lowerName.includes('strobe') && !lowerName.includes('kit') ||
      (lowerName.includes('warning light') && (lowerName.includes('timed') || lowerName.includes('led')))
    ) {
      return 'electrical-components';
    }

    // GARAGE DOORS (rollers, brackets, cables specific to garage doors)
    if (
      lowerName.includes('nylon roller') ||
      lowerName.includes('top roller bracket') ||
      lowerName.includes('lifting cables')
    ) {
      return 'garage-doors';
    }

    // GARAGE MOTORS (sectional, roll-up motors)
    if (
      lowerName.includes('garage') && (lowerName.includes('motor') || lowerName.includes('sdo') || lowerName.includes('rdo')) ||
      lowerName.includes('sectional') && lowerName.includes('motor') ||
      lowerName.includes('roll-up')
    ) {
      return 'garage-motors';
    }

    // GATE MOTORS (D3, D5, D10, D6, sliding gate, racks, PCBs, chargers, gearboxes, brackets, base plates)
    if (
      lowerName.includes('d3') || lowerName.includes('d5') || lowerName.includes('d10') || lowerName.includes('d6') ||
      lowerName.includes('sliding gate') || lowerName.includes('d2 sliding') ||
      lowerName.includes('nylon rack') || lowerName.includes('steel rack') ||
      lowerName.includes('cable drum') && !lowerName.includes('lp gas') ||
      (lowerName.includes('base plate') && lowerName.includes('centurion')) ||
      (lowerName.includes('anti-theft bracket') && (lowerName.includes('d3') || lowerName.includes('d5') || lowerName.includes('d6'))) ||
      (lowerName.includes('pcb') && lowerName.includes('centurion')) ||
      (lowerName.includes('charger') && (lowerName.includes('d5') || lowerName.includes('gate'))) ||
      (lowerName.includes('gear box') && (lowerName.includes('d5') || lowerName.includes('d10'))) ||
      (lowerName.includes('motor only') && lowerName.includes('24v')) ||
      lowerName.includes('gate motor') && !lowerName.includes('battery')
    ) {
      return 'gate-motors';
    }

    // ELECTRIC FENCING (energizers, beams, HT cable, springs, earth spikes, brackets, testers, isolators)
    if (
      lowerName.includes('electric fence') || lowerName.includes('electric fencing') ||
      lowerName.includes('energizer') || lowerName.includes('wizord') || lowerName.includes('druid') ||
      lowerName.includes('beam') && !lowerName.includes('camera') ||
      lowerName.includes('ht cable') || lowerName.includes('nemtek cable') ||
      lowerName.includes('compression spring') || lowerName.includes('spring hook') ||
      lowerName.includes('tension spring') && !lowerName.includes('garage') ||
      lowerName.includes('earth spike') || lowerName.includes('earth loop') ||
      lowerName.includes('lightning diverter') ||
      lowerName.includes('fence tester') ||
      lowerName.includes('cut-out switch') ||
      lowerName.includes('alarm module') && lowerName.includes('fence') ||
      (lowerName.includes('isolator') && lowerName.includes('30a')) ||
      (lowerName.includes('bracket') && (lowerName.includes('tt') || lowerName.includes('bottom') || lowerName.includes('gate contact') || lowerName.includes('sliding gate contact'))) ||
      lowerName.includes('pulley spring mount') ||
      lowerName.includes('cable tie') && lowerName.includes('nemtek') ||
      lowerName.includes('bobbin') ||
      lowerName.includes('aluminium wire') || lowerName.includes('aluminium alloy wire') ||
      lowerName.includes('braided stainless steel wire') ||
      lowerName.includes('ferrule') && lowerName.includes('aluminium') ||
      lowerName.includes('s-hook') ||
      lowerName.includes('angle square tube') || lowerName.includes('round bar black') || lowerName.includes('straight square tube') ||
      lowerName.includes('wire top angle') || lowerName.includes('top angle') && lowerName.includes('black') ||
      lowerName.includes('stay') && lowerName.includes('750mm') ||
      lowerName.includes('tek screw') || lowerName.includes('nail in anchor') || lowerName.includes('coach screw') ||
      lowerName.includes('wall mount loop') ||
      lowerName.includes('gate contact') && !lowerName.includes('keypad')
    ) {
      return 'electric-fencing';
    }

    // CCTV (cameras, DVRs, NVRs, power supplies for CCTV, CCTV cables)
    if (
      lowerName.includes('camera') || lowerName.includes('cctv') ||
      lowerName.includes('dvr') || lowerName.includes('nvr') ||
      lowerName.includes('hilook') || lowerName.includes('hikvision') ||
      (lowerName.includes('power supply') && lowerName.includes('cctv')) ||
      lowerName.includes('rg59') || (lowerName.includes('network cable') && lowerName.includes('cat6'))
    ) {
      return 'cctv';
    }

    // INTERCOMS (G-Speak, GSM, intercom systems)
    if (
      lowerName.includes('g-speak') || lowerName.includes('gspeak') ||
      lowerName.includes('g-ultra') || lowerName.includes('gsm smart switch') ||
      lowerName.includes('intercom') || lowerName.includes('kocom') ||
      lowerName.includes('e.t nice') && lowerName.includes('audio') ||
      lowerName.includes('zartek')
    ) {
      return 'intercoms';
    }

    // REMOTES (Nova, Absolute, DTS, Gemini, Sentry, E.T remotes)
    if (
      lowerName.includes('remote') && !lowerName.includes('motor') && !lowerName.includes('kit') ||
      lowerName.includes('nova') && lowerName.includes('button') ||
      lowerName.includes('absolute') && lowerName.includes('button') ||
      lowerName.includes('dts octo') ||
      (lowerName.includes('e.t') || lowerName.includes('et ')) && lowerName.includes('button') ||
      lowerName.includes('gemini') && lowerName.includes('button') ||
      lowerName.includes('sentry') && lowerName.includes('button')
    ) {
      return 'remotes';
    }

    // BATTERIES (12V, 24V batteries, lithium, gel)
    if (
      lowerName.includes('battery') && !lowerName.includes('motor') ||
      lowerName.includes('12v') && (lowerName.includes('ah') || lowerName.includes('battery')) ||
      lowerName.includes('24v') && (lowerName.includes('ah') || lowerName.includes('battery')) ||
      lowerName.includes('lithium') && lowerName.includes('battery')
    ) {
      return 'batteries';
    }

    // LP GAS (gas cylinders, regulators)
    if (
      lowerName.includes('lp gas') ||
      lowerName.includes('kg') && (lowerName.includes('gas') || lowerName.includes('cylinder')) ||
      lowerName.includes('gas regulator')
    ) {
      return 'lp-gas';
    }

    // Default to gate-motors if uncertain
    return 'gate-motors';
  }

  // Get all products
  const allProducts = await db.select().from(products);
  console.log(`Found ${allProducts.length} total products`);

  let updated = 0;

  for (const product of allProducts) {
    const targetCategory = categorizeProduct(product.name);
    const newCategoryId = categoryMap.get(targetCategory);

    if (newCategoryId && product.categoryId !== newCategoryId) {
      await db.update(products)
        .set({ categoryId: newCategoryId })
        .where(eq(products.id, product.id));
      
      console.log(`✓ ${product.name} → ${targetCategory}`);
      updated++;
    }
  }

  console.log(`\n✓ Updated ${updated} products`);
  
  // Show final distribution
  const { sql } = await import("drizzle-orm");
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

recategorizeProductsExact()
  .then(() => {
    console.log('\n✓ Recategorization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
