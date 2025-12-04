import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

interface ProductDescription {
  slug: string;
  description: string;
}

const electricFencingDescriptions: ProductDescription[] = [
  {
    slug: "nemtek-electric-fence-high-voltage-timed-warning-light-blue",
    description: `Enhance your electric fence visibility with the Nemtek High Voltage Timed Warning Light in blue. This LED warning beacon provides a bright, intermittent flash to alert people to the presence of an energized electric fence.

Key Features:
- High-visibility blue LED for clear fence status indication
- Timed flashing pattern conserves power while maintaining visibility
- Weather-resistant construction for outdoor installation
- Easy connection to electric fence energizers
- Low power consumption for extended operation

Perfect for residential, commercial, and agricultural electric fence installations across South Africa. Compliant with SANS regulations requiring visible warning indicators on electric fences.

Installation: Mounts directly to fence posts or brackets. Connects to energizer output for automatic operation when fence is armed.`
  },
  {
    slug: "jva-high-voltage-fence-warning-light-blue-led",
    description: `The JVA High Voltage Warning Light in blue is an essential safety accessory for electric fence systems. This bright LED beacon provides clear visual indication that your fence is energized, helping prevent accidental contact.

Key Features:
- Brilliant blue LED visible day and night
- Automatic activation when fence is energized
- Durable UV-stabilized housing
- IP65 weather-resistant rating
- Low energy consumption

Designed for South African conditions, this warning light is ideal for perimeter security fences, farm boundaries, and game reserves. JVA products are trusted by professionals for their reliability and durability.

Installation: Simple two-wire connection to your energizer. Mount at regular intervals along fence line for maximum visibility.`
  },
  {
    slug: "jva-high-voltage-electric-fence-warning-light-red-led",
    description: `Protect visitors and property with the JVA High Voltage Warning Light featuring a red LED indicator. This safety beacon clearly signals that your electric fence is live, meeting South African safety regulations.

Key Features:
- High-intensity red LED for immediate recognition
- Flashing pattern increases visibility
- Robust outdoor-rated enclosure
- Simple connection to any energizer
- Long-lasting LED technology

Red warning lights are particularly effective for high-traffic areas where maximum visibility is essential. The JVA brand is synonymous with quality electric fence components in the South African security industry.

Recommended placement: Gate entrances, pedestrian areas, and any location where people might approach the fence.`
  },
  {
    slug: "nemtek-spring-hook-large-tail-2mm-50-pack",
    description: `Professional-grade Nemtek Spring Hooks with large tail design for secure electric fence wire attachment. This 50-pack provides the essential connectors needed for reliable fence wire installation.

Key Features:
- 2mm wire diameter compatibility
- Large tail for easy handling and installation
- Galvanized steel construction resists corrosion
- Secure grip prevents wire slippage
- Professional-grade quality

These spring hooks are essential for attaching fence wires to insulators and tensioning systems. The large tail design makes installation faster and provides a more secure connection than standard hooks.

Applications: Perimeter security fences, agricultural boundaries, game farm enclosures, and any electric fence installation requiring reliable wire connections.

Quantity: 50 hooks per pack - enough for typical residential fence installations.`
  },
  {
    slug: "nemtek-compression-spring-1-silver-5kg-black-50-box",
    description: `Maintain optimal fence wire tension with Nemtek 5kg Compression Springs. This box of 50 springs provides consistent tensioning for your electric fence system, ensuring maximum security and longevity.

Key Features:
- 5kg tension rating for residential and light commercial use
- Galvanized steel construction for corrosion resistance
- Maintains constant tension despite temperature changes
- Easy installation on standard fence posts
- Black coating for discreet appearance

Compression springs are essential for keeping electric fence wires taut and effective. They automatically compensate for wire expansion in heat and contraction in cold, maintaining proper tension year-round.

Applications: Residential security fences, small farms, and perimeter protection. Use one spring per wire run for optimal performance.

Box Contents: 50 compression springs with 5kg tension rating.`
  },
  {
    slug: "nemtek-electric-fence-aluminium-ferrules-6mm-100-pack",
    description: `Create secure, permanent wire connections with Nemtek 6mm Aluminium Ferrules. This 100-pack provides the crimp connectors needed for professional electric fence installations.

Key Features:
- 6mm internal diameter fits standard fence wire
- Aluminium construction prevents corrosion
- Creates strong, permanent wire joints
- Compatible with standard crimping tools
- Maintains full conductivity through joints

Ferrules are essential for joining fence wires and creating termination loops. The aluminium material ensures excellent electrical conductivity while resisting corrosion from weather exposure.

Professional tip: Use a proper crimping tool for secure connections. Crimp twice for critical joints.

Applications: Wire splicing, termination loops, and any permanent wire connection in electric fence systems.

Pack Contents: 100 aluminium ferrules, 6mm size.`
  },
  {
    slug: "nemtek-hybrid-compression-spring-2-8kg-gold-black-50-pack",
    description: `Heavy-duty Nemtek Hybrid Compression Springs rated at 8kg for demanding electric fence applications. This 50-pack features the premium gold series construction for maximum durability.

Key Features:
- 8kg tension rating for heavy-duty applications
- Hybrid design combines spring and tensioner
- Gold series premium construction
- Black coating for UV resistance
- Maintains tension in extreme temperatures

Ideal for longer fence runs and areas with significant temperature variation. The 8kg rating provides sufficient tension for most commercial and agricultural installations.

Applications: Farm perimeters, game reserves, commercial properties, and any installation requiring higher tension. Recommended for wire runs exceeding 20 meters.

Pack Contents: 50 hybrid compression springs with 8kg rating.`
  },
  {
    slug: "stainless-steel-tension-springs-with-limiters-50-pack",
    description: `Premium stainless steel tension springs with built-in limiters for controlled wire tensioning. This 50-pack provides long-lasting, maintenance-free performance for electric fence installations.

Key Features:
- 304 stainless steel construction
- Built-in limiters prevent over-tensioning
- Corrosion-proof for coastal and humid areas
- Maintains consistent tension over time
- Professional-grade quality

The limiter feature prevents wire damage from excessive tension, making these springs ideal for installations where precise tension control is important. Stainless steel construction ensures decades of reliable service.

Applications: Premium residential installations, coastal properties, and anywhere corrosion resistance is essential.

Pack Contents: 50 stainless steel springs with limiters.`
  },
  {
    slug: "tensioner-compression-spring-hybrid-1-silver-5kg-nylon",
    description: `The Hybrid Compression Spring Tensioner combines a compression spring with a built-in ratchet tensioner for complete wire tension control. This innovative design allows for both automatic tension maintenance and manual adjustment.

Key Features:
- Combined compression spring and ratchet tensioner
- 5kg tension rating for residential use
- Nylon inner prevents galvanic corrosion
- Stainless steel spring for long life
- Compatible with 1mm to 1.2mm wire

The hybrid design eliminates the need for separate tensioners and springs, simplifying installation and reducing component count. The ratchet mechanism allows you to increase tension as needed over time.

Installation: Attach to fence wire end, allowing spring to absorb tension while ratchet locks position. Adjust using standard tensioner tool.

Applications: Residential security fences, small farm perimeters, and any installation requiring adjustable tension.`
  },
  {
    slug: "tensioner-compression-spring-hybrid-1-silver-5kg-nylon-50-pack",
    description: `Bulk pack of 50 Hybrid Compression Spring Tensioners for professional installers and larger projects. Each unit combines a compression spring with a ratchet tensioner for complete tension control.

Key Features:
- 50 units per pack for contractor use
- Combined spring and tensioner design
- 5kg tension rating per unit
- Nylon inner eliminates galvanic reaction
- Stainless steel springs for durability

Perfect for fence installers who need reliable, quality components in quantity. The hybrid design reduces installation time and ensures consistent performance across all fence runs.

Pack Contents: 50 hybrid compression spring tensioners with 5kg rating each.

Applications: Professional fence installations, housing estates, commercial properties, and agricultural projects requiring multiple tension points.`
  },
  {
    slug: "dts-ms5-energizer-weatherproof-box-only-grey",
    description: `Protect your DTS MS5 energizer with this purpose-built weatherproof enclosure. The grey UV-resistant housing shields your energizer from rain, dust, and harsh South African weather conditions.

Key Features:
- Custom fit for DTS MS5 energizer
- UV-stabilized plastic construction
- IP65 weather protection rating
- Lockable design for security
- Ventilation prevents overheating
- Grey color blends with outdoor settings

This enclosure is essential for outdoor energizer installations, significantly extending the life of your investment. The durable construction withstands extreme heat, cold, and heavy rain.

Installation: Mount to wall or post using provided brackets. Feed cables through weatherproof entry points. Secure energizer inside using mounting slots.

Note: Enclosure only - energizer sold separately.`
  },
  {
    slug: "8-wire-angle-square-tube-black",
    description: `The 8 Wire Angle Square Tube bracket supports eight electric fence wires at a 45-degree outward angle. This professional-grade bracket creates an imposing security barrier that's extremely difficult to bypass.

Key Features:
- Supports 8 parallel fence wires
- 45° outward angle for enhanced security
- Heavy-duty square steel tube construction
- Black powder-coated for corrosion resistance
- Wall-top mounting design

The angled configuration pushes fence wires outward, creating a formidable barrier that deters climbing and makes cutting difficult. The robust steel construction handles high wire tension without bending.

Applications: High-security perimeters, commercial properties, industrial facilities, and residential estates requiring maximum protection.

Installation: Mount to wall top using anchor bolts. Ensure proper grounding and wire spacing for optimal performance.`
  },
  {
    slug: "8-line-round-bar-black",
    description: `Support eight lines of electric fence wire with this sturdy round bar bracket. The black powder-coated finish provides excellent weather resistance for long-term outdoor use.

Key Features:
- Accommodates 8 fence wires
- Round bar construction for strength
- Black powder-coated finish
- UV and corrosion resistant
- Easy insulator mounting

This bracket is ideal for perimeter fences requiring multiple wire runs. The round bar design allows for flexible insulator positioning while maintaining structural integrity.

Applications: Residential security, farm boundaries, game reserves, and commercial perimeters requiring comprehensive coverage.

Installation: Mount vertically on walls or posts. Attach insulators at desired spacing for your fence configuration.`
  },
  {
    slug: "6-line-straight-square-tube-black",
    description: `Create a clean, professional fence installation with the 6 Line Straight Square Tube bracket. This vertical bracket supports six parallel electric fence wires in a straight configuration.

Key Features:
- Supports 6 parallel fence wires
- Straight vertical design
- Heavy-duty square tube steel
- Black powder-coated finish
- Modern, professional appearance

The straight vertical design provides a sleek, modern look while delivering effective security. Ideal for residential areas where aesthetics are important alongside security.

Applications: Residential estates, office complexes, shopping centers, and any installation requiring a clean visual appearance.

Installation: Mount vertically on walls using appropriate anchors. Space insulators evenly for consistent wire separation.`
  },
  {
    slug: "12v-red-strobe-light",
    description: `Enhance your security system visibility with this powerful 12V Red Strobe Light. The high-intensity flashing LED serves as both a deterrent and an alarm indicator.

Key Features:
- 12V DC operation
- High-intensity red LED
- Approximately 125dB equivalent visual impact
- Weather-resistant housing
- Easy installation

This strobe integrates with electric fence energizers, alarm systems, and gate motors to provide visual indication of system status or alarm activation.

Applications:
- Electric fence breach indication
- Alarm system activation
- Gate motor status display
- General security lighting

Installation: Connect to 12V DC power source. Mount in visible location using provided hardware.`
  },
  {
    slug: "12v-40w-white-security-siren",
    description: `Powerful 40W security siren delivering approximately 125dB sound output for maximum deterrent effect. This white-housed siren integrates with electric fences, alarms, and security systems.

Key Features:
- 40W speaker output
- Approximately 125dB sound level
- 12V DC operation
- Durable white ABS housing
- Weather-resistant design

This siren provides the audio alert needed to deter intruders and notify occupants of security breaches. Compatible with Nemtek, JVA, and DTS energizers.

Applications:
- Electric fence alarm systems
- Perimeter breach notification
- Gate automation alerts
- General security systems

Installation: Mount in protected location with clear sound projection. Connect to energizer alarm output or security panel.`
  },
  {
    slug: "bobbin-round-bar-insulator",
    description: `Secure your electric fence wires with the Bobbin Round Bar Insulator. This durable insulator provides reliable electrical isolation on round bar posts.

Key Features:
- Fits standard round bar posts
- UV-stabilized polymer construction
- High dielectric strength
- Weather-resistant design
- Easy clip-on installation

The bobbin design securely holds fence wires while maintaining complete electrical isolation from the support post. Essential for preventing power leakage and maintaining fence effectiveness.

Applications: Electric fences on round bar supports, perimeter security, farm fencing, and game enclosures.

Installation: Clip onto round bar post. Thread fence wire through bobbin opening. Ensure wire doesn't contact post.`
  },
  {
    slug: "omega-bobbin-with-clip",
    description: `The Omega Bobbin with Clip provides fast, tool-free installation for electric fence wires. The integrated clip secures the insulator to flat or round bar posts instantly.

Key Features:
- Quick-clip installation
- Fits flat and round bar posts
- UV-resistant polymer
- Impact-grade construction
- Secure wire retention

This insulator dramatically speeds up fence installation while ensuring reliable performance. The omega shape provides excellent wire grip and electrical isolation.

Applications: High-volume fence installations, farm perimeters, game reserves, and any project where installation speed matters.

Installation: Clip directly onto post. No tools required. Feed wire through center opening.`
  },
  {
    slug: "bobbin-flat-bar-black-4-5mm",
    description: `Professional flat bar insulator in 4.5mm size for electric fence installations. The black UV-stabilized body provides decades of reliable service.

Key Features:
- 4.5mm thickness for stability
- Designed for flat bar posts
- Black UV-resistant polymer
- High insulation value
- Secure wire grip

This insulator maintains proper electrical isolation between fence wires and flat bar supports. The 4.5mm thickness provides excellent durability for high-tension installations.

Applications: Perimeter security, agricultural fencing, game farm enclosures, and any flat bar fence system.

Installation: Slide onto flat bar post. Position at desired height. Thread fence wire through insulator opening.`
  },
  {
    slug: "wall-mount-loop-angle-304-stainless-steel",
    description: `Premium 304 stainless steel wall mount loop for electric fence grounding and wire support. This heavy-duty mount provides a secure anchor point for your fence installation.

Key Features:
- 304 stainless steel construction
- Corrosion-proof for coastal areas
- Heavy-duty design
- Multiple mounting holes
- Professional appearance

Ideal for grounding connections and fence wire termination points. The stainless steel construction ensures lifetime durability, even in harsh coastal environments.

Applications: Grounding systems, wire termination, direction changes, and any installation requiring premium corrosion resistance.

Installation: Mount to wall using appropriate anchors. Connect ground wire or fence wire through loop. Secure connections with ferrules or clamps.`
  },
  {
    slug: "copper-earth-spike-1-2m-with-nut-and-washer",
    description: `Essential grounding component for electric fence systems. This 1.2 meter copper earth spike provides superior conductivity for effective fence operation.

Key Features:
- 1.2 meter length for deep earth penetration
- Solid copper construction
- Includes nut and washer for cable connection
- Superior electrical conductivity
- Corrosion-resistant

Proper grounding is critical for electric fence effectiveness. Copper provides the best conductivity and corrosion resistance for long-term reliable grounding.

Installation: Drive into ground using post driver or hammer. Leave 100mm above ground for cable connection. Attach ground wire using provided nut and washer. Install multiple spikes for larger energizers.

Recommended: One spike per 0.5 joules of energizer output. Install in moist soil areas when possible.`
  },
  {
    slug: "6-line-20-meter-advanced-electric-fence-kit",
    description: `Complete 6-line electric fence system covering 20 meters of perimeter. This all-inclusive kit contains everything needed for a professional-grade installation.

Kit Includes:
- 1x Wizord 4i Energizer (powerful and reliable)
- 6-line fence wire (20m coverage)
- All brackets and insulators
- Earth spike and grounding kit
- Connection hardware
- Installation guide

Key Features:
- Complete system - nothing else to buy
- Professional-grade components
- Suitable for residential and commercial use
- Easy installation with included guide
- Expandable for larger perimeters

This kit is designed for South African security requirements, providing effective perimeter protection for homes, businesses, and small farms.

Applications: Residential security, townhouse complexes, small commercial properties, and storage yards.

Technical: 6 wire lines, 20 meter coverage, expandable with additional wire and brackets.`
  }
];

async function updateDescriptions() {
  console.log("Starting product description updates...\n");
  
  let updated = 0;
  let failed = 0;
  
  for (const item of electricFencingDescriptions) {
    try {
      const result = await db
        .update(products)
        .set({ description: item.description.trim() })
        .where(eq(products.slug, item.slug));
      
      console.log(`✓ Updated: ${item.slug}`);
      updated++;
    } catch (error) {
      console.error(`✗ Failed: ${item.slug}`, error);
      failed++;
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed: ${failed}`);
}

updateDescriptions()
  .then(() => {
    console.log("\nDescription update complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
