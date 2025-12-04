import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

interface ProductDescription {
  slug: string;
  description: string;
}

const shortDescriptions: ProductDescription[] = [
  // CCTV
  {
    slug: "4-channel-advanced-cctv-camera-kit",
    description: `Complete 4-camera surveillance kit perfect for small homes and businesses. Everything included for immediate installation.

Kit Includes:
- 4-channel DVR recorder
- 4 HD security cameras
- Power supply unit
- All cables and connectors
- Mobile app access

Key Features:
- Full HD 1080p recording quality
- Night vision on all cameras
- Remote viewing via smartphone
- Motion detection alerts

Ready to install with everything you need for basic security coverage.

Applications: Small homes, shops, offices, storage areas.`
  },
  {
    slug: "hikvision-4-channel-cctv-power-supply",
    description: `Quality 4-channel power supply box from Hikvision for smaller CCTV systems. Centralized power for up to 4 cameras.

Key Features:
- 4 output channels with individual fusing
- Stable 12V DC regulated output
- LED power indicators
- Compact metal housing
- Quality Hikvision construction

Provides clean, stable power essential for reliable camera operation.

Applications: 4-camera systems, home surveillance, small offices.`
  },
  {
    slug: "hikvision-8-channel-cctv-power-supply",
    description: `Professional 8-channel power distribution unit from Hikvision. Powers medium-sized CCTV installations reliably.

Key Features:
- 8 individually fused outputs
- Stable voltage regulation
- LED status indicators
- Metal enclosure protection
- Hikvision quality assurance

Essential component for medium surveillance systems.

Applications: 8-camera installations, medium commercial CCTV.`
  },
  // Electric Fencing
  {
    slug: "nemtek-ht-cable-slimline-30m-black",
    description: `Compact 30-meter roll of high-tension cable for electric fence connections. Ideal for small installations and repairs.

Key Features:
- 30 meter roll length
- High-voltage insulation
- Slimline black sheath
- UV-resistant construction
- Easy to work with

Perfect for connecting energizers to fence lines on smaller properties.

Applications: Small fence systems, repairs, additions.`
  },
  {
    slug: "nemtek-ht-cable-slimline-50m-black",
    description: `Medium 50-meter roll of HT cable providing optimal length for typical residential electric fence installations.

Key Features:
- 50 meter roll
- High-voltage rated insulation
- UV-resistant black sheath
- Slimline profile
- Flexible installation

The right size for most home fence installations without excess waste.

Applications: Residential installations, medium projects.`
  },
  {
    slug: "nemtek-sliding-gate-contact-in-line-3-way",
    description: `3-way in-line gate contact for complex sliding gate configurations. Routes electric fence power through multiple paths simultaneously.

Key Features:
- 3-way connection capability
- In-line mounting design
- Sliding gate compatible
- Weather-resistant construction
- Quality materials

Essential for gates requiring multiple wire connections to maintain fence continuity.

Applications: Complex gate setups, multi-wire gates.`
  },
  // Garage Door Parts
  {
    slug: "garage-door-steel-hinge-no-2",
    description: `Position 2 steel hinge connecting panels 2 and 3 on sectional garage doors. Heavy-duty construction for reliable operation.

Key Features:
- Hinge position No. 2 (specific placement)
- Heavy-duty steel construction
- Smooth pivot action
- Precision-drilled mounting holes
- Long-lasting durability

Each panel joint requires the correctly numbered hinge for proper door folding.

Applications: Sectional garage doors, panel joint connections.`
  },
  {
    slug: "garage-door-steel-hinge-no-3",
    description: `Position 3 hinge for connecting panels 3 and 4 on sectional doors. Maintains smooth door folding through track curves.

Key Features:
- Hinge position No. 3
- Steel construction
- Reliable pivot mechanism
- Standard mounting pattern
- Professional quality

Ensures proper panel articulation as door moves through track system.

Applications: Sectional garage door panel connections.`
  },
  {
    slug: "garage-door-steel-hinge-no-4",
    description: `Position 4 steel hinge connecting panels 4 and 5 on taller sectional garage doors. Essential for proper door operation.

Key Features:
- Hinge position No. 4
- Heavy-duty steel
- Smooth articulation
- Standard fitting pattern
- Durable construction

Required for taller sectional doors with 5 or more panels.

Applications: Sectional garage doors with 5+ panels.`
  },
  {
    slug: "garage-door-steel-hinge-no-5",
    description: `Position 5 hinge for connecting panels 5 and 6 on extra-tall sectional doors. Built for commercial-grade durability.

Key Features:
- Hinge position No. 5
- Heavy-duty construction
- Precision fit
- Reliable operation
- Steel strength

For taller residential and commercial garage door installations.

Applications: Tall sectional garage doors.`
  },
  {
    slug: "garage-door-steel-hinge-no-6",
    description: `Position 6 steel hinge for panels 6 and 7 on extra-tall sectional doors. Industrial-grade quality for demanding applications.

Key Features:
- Hinge position No. 6
- Commercial-grade steel
- Smooth pivot action
- Standard mounting holes
- Long service life

For the tallest sectional door installations.

Applications: Extra-tall sectional doors, commercial installations.`
  },
  // Garage Motors
  {
    slug: "centurion-t10-sdo4-motor",
    description: `Premium Centurion SDO4 T10 Smart kit for sectional garage door automation. Full smart home integration with app control.

Key Features:
- For sectional garage doors
- Smart wireless configuration
- MyCentsys app support
- Battery backup capability
- Quiet operation

Centurion quality for reliable garage automation.

Applications: Residential sectional garage doors.`
  },
  {
    slug: "centurion-sdo4-t12-smart-kit",
    description: `Extended Centurion SDO4 T12 Smart kit with longer rail for taller garage doors. All smart features included.

Key Features:
- Extended rail length for tall doors
- Smart wireless setup
- App control via MyCentsys
- Quiet DC motor operation
- Battery backup

For taller sectional garage doors requiring longer travel.

Applications: Tall residential sectional doors.`
  },
  {
    slug: "digidoor-digi-iq-smart-garage-door-motor",
    description: `DISCONTINUED: The DigiDoor Digi IQ Smart garage motor is no longer manufactured.

Note: This product is discontinued. Contact us for current alternatives such as E.T DC Blue Advance or Centurion SDO4.

The Digi IQ was a smart garage motor with WiFi connectivity and smartphone app control.

Applications: Legacy DigiDoor installations requiring parts.`
  },
  {
    slug: "digidoor-digi-one-garage-door-motor",
    description: `DISCONTINUED: The DigiDoor Digi One garage motor is no longer manufactured.

Note: This product is discontinued. Please consider alternatives like E.T DC Blue Advance or Gemini Sectional motors.

Contact us for suitable replacement options.

Applications: Legacy DigiDoor replacement parts and support.`
  },
  {
    slug: "garador-elev8tor-garage-door-motor",
    description: `Garador Elev8tor motor kit with extrusion rail included. British quality for reliable garage door automation.

Kit Includes:
- Elev8tor motor unit
- Extrusion rail system
- Remote control
- Installation hardware

Key Features:
- Smooth quiet operation
- Suitable for sectional and tilt doors
- Battery backup capable

Applications: Sectional and tilt-up garage doors.`
  },
  // Gate Motors
  {
    slug: "centurion-d2-sliding-gate-motor",
    description: `DISCONTINUED: The Centurion D2 sliding gate motor has been replaced by the D3 Smart range.

Note: This model is no longer manufactured. The Centurion D3 Smart is the direct replacement offering improved features.

Legacy specifications: Entry-level sliding gate automation for residential use.

Applications: Legacy D2 replacement parts and support.`
  },
  {
    slug: "centurion-d3-smart-full-kit-no-anti-theft-bracket",
    description: `D3 Smart complete installation kit without anti-theft bracket. Ideal for lower-risk installations or secure complexes.

Kit Includes:
- D3 Smart sliding gate motor
- Steel rack sections
- 12V battery
- Remote controls

For installations where motor theft is not a significant concern.

Applications: Secure complexes, low-risk residential areas.`
  },
  {
    slug: "centurion-d5-d6-smart-anti-theft",
    description: `DISCONTINUED: Legacy anti-theft bracket for older D5/D6 motors. See current D5/D6 Smart Anti-Theft Bracket for replacement.

Note: Limited availability. This bracket fits older non-Smart D5/D6 motors.

Contact us for alternatives if stock is unavailable.

Applications: Legacy D5/D6 installations requiring security brackets.`
  },
  {
    slug: "centurion-d5-evo-sliding-gate-motor",
    description: `DISCONTINUED: The original D5 Evo has been replaced by the D5 Evo Smart range.

Note: This model is no longer manufactured. Please see Centurion D5 Evo Smart for the current equivalent motor.

Legacy specifications: 500kg capacity, 24V DC operation, battery backup.

Applications: D5 Evo replacement parts and legacy support.`
  },
  {
    slug: "centurion-d6-smart-full-kit-no-anti-theft-bracket",
    description: `D6 Smart complete kit without anti-theft bracket. Value package for secure installation environments.

Kit Includes:
- D6 Smart motor (750kg capacity)
- Steel rack
- Battery
- Remote controls

For environments where additional theft protection is not required.

Applications: Secure estates, monitored complexes.`
  },
  {
    slug: "custom-amount",
    description: `Custom order option for special requirements not covered by standard products. Contact Alectra Solutions to discuss your specific needs.

This product allows for:
- Custom pricing on special orders
- Bulk purchase arrangements
- Custom configurations
- Service packages
- Trade account deposits

Contact our team at info@alectra.co.za or call to discuss your requirements.`
  },
  {
    slug: "dace-sprint-500-gate-motor",
    description: `DISCONTINUED: The Dace Sprint 500 gate motor is no longer manufactured.

Note: This product is discontinued. Consider alternatives such as E.T Nice Drive 500 or Gemini Slider for similar residential applications.

Contact us for suitable replacement recommendations.

Applications: Legacy Dace installations requiring parts or alternatives.`
  },
  {
    slug: "digidoor",
    description: `DigiDoor compatible remote controls for garage and gate automation systems. Various button configurations available.

Key Features:
- DigiDoor system compatibility
- Rolling code security encryption
- Multiple button options available
- Durable construction

Ensure compatibility with your specific DigiDoor motor model before ordering.

Applications: DigiDoor garage and gate automation systems.`
  },
  {
    slug: "duraslide",
    description: `Duraslide gate motor remote controls for compatible automation systems. Secure transmission for reliable control.

Key Features:
- Duraslide system compatible
- Rolling code encryption technology
- Various button configurations
- Quality construction

Verify compatibility with your Duraslide model before ordering.

Applications: Duraslide gate motor systems.`
  },
  {
    slug: "gemini-sel-gate-motor",
    description: `Gemini 12V sliding gate motor delivering reliable automation at an economical price. Trusted South African brand with proven performance.

Key Features:
- 12V DC operation
- Battery backup capable
- Simple installation process
- Gemini quality reliability
- Suitable for residential gates

A popular choice for homeowners seeking dependable gate automation.

Applications: Residential sliding gates.`
  },
  {
    slug: "gemini-slider-12v-7ah-full-kit-complete-gate-automation-solution-copy",
    description: `Gemini Slider complete kit without anti-theft bracket. Value package for installations in secure environments.

Kit Includes:
- Gemini Slider motor
- 12V 7Ah battery
- Steel rack sections
- Remote control

For lower-risk installations where anti-theft bracket is not essential.

Applications: Secure complexes, monitored residential estates.`
  },
  // Remotes
  {
    slug: "eazylift-garage-door-remote-4-button",
    description: `Four-button remote for Eazylift garage door opener systems. Controls up to 4 different doors or automation systems.

Key Features:
- 4 independent channels
- Rolling code security encryption
- Eazylift system compatible
- Easy programming process
- Compact design

Convenient multi-door control from a single remote handset.

Applications: Eazylift garage door systems, multi-door properties.`
  },
  {
    slug: "sentry-1-button-c-hop-433-nova-remote",
    description: `Simple single-button Sentry remote with code-hopping security. Perfect for basic gate or garage control.

Key Features:
- Single button operation
- Code-hopping encryption technology
- 433MHz frequency
- Nova receiver compatible
- Compact design

The simplest solution for single-automation control.

Compatible with: Nova receiver systems and compatible motors.`
  },
  // Uncategorized products
  {
    slug: "centurion-d10-charger",
    description: `Replacement charger module for Centurion D10 gate motors. Maintains proper battery charging for reliable backup power.

Key Features:
- D10 motor compatible
- Correct charging parameters
- OEM specification
- Direct replacement

Essential for maintaining D10 battery backup functionality.

Applications: Centurion D10 motor maintenance and repair.`
  },
  {
    slug: "centurion-d10-pcb-v2",
    description: `Version 2 control board for Centurion D10 gate motors. Complete motor control and monitoring functionality.

Key Features:
- D10 compatible (V2 version)
- Full motor control functions
- Status monitoring capability
- Direct replacement

Restores full functionality to D10 gate motor systems.

Applications: Centurion D10 motor repair and upgrade.`
  },
  {
    slug: "centurion-d3-smart-pcb-12v",
    description: `12V control board for Centurion D3 Smart gate motors. Essential electronics for motor operation.

Key Features:
- D3 Smart compatible
- 12V system operation
- Full control functionality
- Smart features included
- Direct replacement

Genuine Centurion PCB for reliable D3 Smart operation.

Applications: D3 Smart motor control board replacement.`
  },
  {
    slug: "centurion-photon-smart-wireless-beams",
    description: `Advanced Centurion Photon Smart wireless safety beams with smartphone integration. No cable trenching required.

Key Features:
- Smart wireless technology
- MyCentsys app integration
- Battery powered operation
- Easy installation
- Safety detection

Premium safety beams with smart home connectivity.

Applications: Gate safety systems, retrofit installations.`
  },
  {
    slug: "centurion-surge-and-lightning-protector",
    description: `Surge protection kit designed specifically for gate motor installations. Protects against lightning damage and electrical surges.

Key Features:
- 10A capacity filter tube
- Lightning protection
- Surge suppression
- Gate motor compatible
- Easy installation

Essential protection for gate motors in lightning-prone areas of South Africa.

Applications: All gate motor installations, lightning protection.`
  },
  {
    slug: "centurion-vantage-400-500-smart-pcb",
    description: `Smart control board for Centurion Vantage 400 and 500 swing gate motors. Adds smart connectivity and app control.

Key Features:
- Vantage 400/500 compatible
- Smart wireless configuration
- MyCentsys app support
- Full control functions

Upgrade Vantage motors to Smart specification.

Applications: Vantage 400/500 motor upgrade and repair.`
  },
  {
    slug: "dts-60mm-radius-gate-wheels",
    description: `Quality 60mm gate wheels from DTS for standard sliding gate track systems. Smooth, quiet operation guaranteed.

Key Features:
- 60mm wheel diameter
- Standard track profile
- Smooth rolling bearings
- Durable construction
- Easy replacement

Replacement wheels restore smooth gate travel on sliding gates.

Applications: Sliding gate repair and maintenance.`
  },
  {
    slug: "dts-60mm-radius-gate-wheels-v-profile",
    description: `V-profile 60mm wheels designed specifically for V-track sliding gate systems. The V-shape provides stable, centered tracking.

Key Features:
- 60mm diameter wheel
- V-profile for V-track rails
- Precision manufactured
- Long service life
- Stable operation

Specifically designed for V-rail gate installations only.

Applications: V-track sliding gate systems.`
  },
  {
    slug: "gemini-anti-theft-bracket",
    description: `Heavy-duty security bracket protecting Gemini gate motors from theft and tampering attempts.

Key Features:
- Heavy-duty steel construction
- Tamper-resistant design
- Gemini specific fitting
- Easy installation
- Deters motor theft

Highly recommended for all Gemini installations in high-risk areas.

Applications: Gemini motor security protection.`
  },
  {
    slug: "gemini-hex-coupling-and-disc",
    description: `Genuine Gemini replacement coupling and disc for motor-to-gearbox connection. OEM parts ensure proper fit and function.

Key Features:
- Original Gemini parts
- Motor to gearbox connection
- Precision manufactured
- Easy replacement
- Quality materials

Essential component for Gemini motor servicing and repair.

Applications: Gemini gate motor repair and maintenance.`
  },
  {
    slug: "gemini-pcb-v-90",
    description: `Replacement control board for Gemini gate motors version V.90. Restores complete motor control functionality.

Key Features:
- Version V.90 compatible
- Full control functions
- Direct replacement part
- Quality components
- Genuine Gemini

Use genuine parts for reliable long-term operation.

Applications: Gemini motor control board replacement.`
  },
  {
    slug: "gemini-pcb-v-90-gemlink-smart-device",
    description: `Bundle package combining Gemini V.90 PCB with Gemlink smart connectivity device. Complete upgrade solution.

Bundle Includes:
- Gemini PCB version V.90
- Gemlink smart device

Upgrade older Gemini motors with new control electronics and add smartphone app control simultaneously.

Applications: Gemini motor modernization and upgrade.`
  },
  {
    slug: "sentry-safety-wireless-gate-beams",
    description: `Wireless safety beam system from Sentry for automated gate obstruction detection. Prevents gate closure on vehicles and people.

Key Features:
- Wireless transmission technology
- Safety beam detection
- Quick and easy installation
- Long battery life
- Reliable operation

Critical safety component required for all automated gate installations.

Applications: Gate motor safety systems, commercial entrances.`
  }
];

async function updateDescriptions() {
  console.log("Starting short product description updates...\n");
  
  let updated = 0;
  let failed = 0;
  
  for (const item of shortDescriptions) {
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
