import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

interface ProductDescription {
  slug: string;
  description: string;
}

const moreDescriptions: ProductDescription[] = [
  // Electric Fencing continued
  {
    slug: "12v-15w-white-security-siren",
    description: `Compact yet powerful 15W security siren for electric fence and alarm systems. The white ABS housing blends seamlessly with any installation while delivering clear audio alerts.

Key Features:
- 15W speaker output
- 12V DC operation
- Compact design for discreet mounting
- Weather-resistant housing
- Low power consumption

Ideal for smaller installations where a full-size siren isn't required. Provides effective audio deterrent while maintaining energy efficiency.

Applications: Residential electric fences, small business security, access control systems, and perimeter alarm networks.

Installation: Mount in protected location. Connect to energizer alarm output or security panel.`
  },
  {
    slug: "4x2-30a-2p-white-isolator",
    description: `Professional-grade 30A 2-pole isolator switch for safe circuit isolation. The white finish provides a clean, modern appearance for visible installations.

Key Features:
- 30A current rating
- 2-pole switching
- DIN-rail compatible
- Clear ON/OFF indication
- IP-rated enclosure

Essential for safely disconnecting electrical circuits during maintenance. Commonly used in electric fence installations to isolate energizers safely.

Applications: Electric fence energizer isolation, solar panel disconnects, general electrical circuit control.

Installation: Mount in weatherproof enclosure. Connect line and load terminals according to circuit requirements.`
  },
  {
    slug: "6-line-angle-square-tube-black",
    description: `Premium 6-line electric fence bracket with 45-degree outward angle. The square tube construction provides maximum strength while the angled design enhances security.

Key Features:
- Supports 6 parallel fence wires
- 45° outward angle deters climbing
- Heavy-duty square steel tube
- Black powder-coated finish
- Pre-drilled for easy insulator mounting

The angled configuration creates an overhang that makes the fence extremely difficult to bypass. Perfect for high-security installations.

Applications: Commercial perimeters, industrial facilities, residential estates, and high-security areas.

Installation: Mount to wall top using appropriate anchors. Space insulators evenly for consistent wire separation.`
  },
  {
    slug: "6-line-round-bar-black",
    description: `Support six lines of electric fence wire with this durable round bar bracket. The black powder-coated finish ensures weather resistance for years of service.

Key Features:
- Accommodates 6 fence wires
- Round bar steel construction
- Corrosion-resistant coating
- UV stable finish
- Versatile mounting options

Ideal for perimeter fences requiring multiple wire runs with a clean appearance.

Applications: Residential security, small commercial properties, farm boundaries.

Installation: Mount vertically on walls or posts. Attach insulators at desired spacing.`
  },
  {
    slug: "6-wire-flat-bar",
    description: `The 6 Wire Black Top Angle bracket features a 45-degree outward tilt for enhanced perimeter security. Built from durable steel with corrosion-resistant coating.

Key Features:
- 6 wire capacity
- 45° outward angle
- Flat bar construction
- Black powder coating
- Pre-drilled mounting holes

The angled design increases fence reach and creates an effective barrier against intruders.

Applications: Wall-top security, perimeter protection, residential and commercial fencing.

Installation: Mount to wall top. Install insulators and thread fence wires through.`
  },
  {
    slug: "750mm-stay-with-sleeves-and-screws",
    description: `Professional 750mm fence stay for anchoring straining posts and corner assemblies. Complete with sleeves and mounting screws for quick installation.

Key Features:
- 750mm length for effective bracing
- Galvanized steel construction
- Includes sleeves and screws
- Supports high-tension fence lines
- Prevents post movement

Essential for maintaining proper fence tension at corners, ends, and strain points.

Applications: Corner post support, end strainer assemblies, high-tension fence lines.

Installation: Drive stay into ground at 45° angle. Attach to post using provided sleeves and screws.`
  },
  {
    slug: "8-line-30-meter-advanced-electric-fence-kit",
    description: `Complete 8-line electric fence system covering 30 meters of perimeter. This comprehensive kit includes everything needed for a professional installation.

Kit Includes:
- 1x Wizord 4i Energizer
- 8-line fence configuration (30m)
- All brackets and insulators
- Grounding system components
- Connection hardware
- Installation guide

Key Features:
- Complete turnkey solution
- Professional-grade components
- Expandable design
- Suitable for residential and commercial use

The 8-line configuration provides enhanced security coverage for higher-risk areas.

Applications: Medium-sized residential properties, commercial premises, warehouses, and industrial perimeters.`
  },
  {
    slug: "8-wire-straight-square-tube-black",
    description: `Heavy-duty 8-wire straight bracket for maximum fence density. The square tube construction provides exceptional strength for high-tension installations.

Key Features:
- 8 wire capacity
- Straight vertical design
- Heavy-duty square tube steel
- Black powder-coated finish
- Dense wire spacing for security

The 8-wire configuration creates a comprehensive barrier that's difficult to penetrate or climb.

Applications: High-security perimeters, industrial sites, correctional facilities.

Installation: Mount vertically. Space wires evenly for optimal coverage.`
  },
  {
    slug: "8-wire-top-angle-square-tube-black",
    description: `Premium 8-wire bracket with outward-facing angle for maximum security. The robust construction handles high tension while creating an imposing barrier.

Key Features:
- 8 wire capacity
- Outward-angled design
- Square tube steel construction
- Black weather-resistant finish
- Professional appearance

The combination of 8 wires and outward angle creates one of the most effective fence configurations available.

Applications: Maximum security installations, commercial and industrial perimeters, high-value property protection.`
  },
  {
    slug: "alectra-solutions-electric-fence-warning-sign",
    description: `Legally required electric fence warning sign with UV-stabilized yellow background. Meets South African safety standards for electric fence installations.

Key Features:
- Bright yellow UV-resistant plastic
- Bold black graphics
- International warning symbols
- Multilingual text
- Weather-resistant construction

Required by law on all electric fence installations. Place at regular intervals along fence line and at all entry points.

Installation: Mount using cable ties, screws, or wire. Position at eye level for maximum visibility.`
  },
  {
    slug: "dts-megashock-5-joule-electric-fence-energizer",
    description: `Powerful 5 Joule energizer for medium to high-security electric fence installations. Features intelligent monitoring and tamper detection.

Key Features:
- 5 Joule output power
- Built-in monitoring system
- Tamper detection
- Alarm output for sirens
- LED status indicators
- 12V DC battery backup capable

Suitable for fence lines up to 10km depending on vegetation and conditions.

Applications: Commercial properties, farms, estates, and high-security residential installations.

Installation: Mount indoors or in weatherproof enclosure. Connect to mains power and battery backup.`
  },
  {
    slug: "druid-15-lcd-electric-fence-energizer-15-joule",
    description: `Professional 15 Joule energizer with LCD display and Adaptive Power Technology. The Nemtek Druid 15 automatically optimizes output for maximum fence efficiency.

Key Features:
- 15 Joule maximum output
- LCD display for status monitoring
- Adaptive Power Technology (APT)
- Reduces false alarms
- Multi-zone capability available
- Professional-grade reliability

APT technology detects optimal fence power and adjusts automatically, maximizing effectiveness while minimizing energy waste.

Applications: Large commercial installations, game farms, agricultural perimeters, and estate security.`
  },
  {
    slug: "in-line-earth-loop-stainless-steel-10-pack",
    description: `Stainless steel earth loops for secure grounding connections in electric fence systems. Pack of 10 provides enough for multiple ground rod connections.

Key Features:
- 304 stainless steel construction
- Corrosion-proof for all environments
- Easy wire attachment
- High current capacity
- 10 loops per pack

Essential for creating reliable ground connections that maintain fence effectiveness.

Applications: Earth rod connections, ground wire splicing, perimeter grounding systems.

Installation: Crimp or clamp ground wire to loop. Connect to earth rod or fence return.`
  },
  {
    slug: "jva-basic-steel-gate-contact",
    description: `Reliable gate contact for maintaining fence continuity through sliding or swing gates. Stainless steel construction ensures long-term durability.

Key Features:
- Stainless steel contact plate
- Weatherproof design
- Maintains fence voltage across gates
- Easy installation
- Compatible with all fence systems

Allows electric current to flow through moving gates without interruption, maintaining perimeter integrity.

Applications: Sliding gates, swing gates, any opening in electric fence line.

Installation: Mount contact plates on gate and post. Adjust for proper alignment when gate closes.`
  },
  {
    slug: "nail-in-anchors-6x60mm-100-pack",
    description: `Quick-install nail-in anchors for mounting electric fence brackets to masonry. Pack of 100 for larger installations.

Key Features:
- 6x40mm size
- Nylon plug with zinc-plated nail
- For concrete, brick, and block
- Strong holding power
- Quick installation

Simply drill, insert plug, and hammer in nail for secure mounting.

Applications: Mounting fence brackets, insulators, conduit clips, and warning signs.

Contents: 100 nail-in anchors with matching nails.`
  },
  {
    slug: "nail-in-anchors-8x80mm-50-pack",
    description: `Heavy-duty nail-in anchors for secure mounting of electric fence hardware. Larger size provides extra holding power for demanding applications.

Key Features:
- 8x80mm size for heavy-duty use
- High-strength nylon plug
- Steel nail included
- For masonry and concrete
- 50 anchors per pack

Ideal for mounting larger brackets and hardware where maximum holding strength is required.

Applications: Heavy bracket mounting, industrial installations, high-load applications.`
  },
  {
    slug: "nemtek-1-2mm-galvanised-stranded-electric-fence-wire-680m-5kg-roll",
    description: `High-quality 1.2mm galvanized stranded fence wire in 680m rolls. The stranded construction provides flexibility while maintaining excellent conductivity.

Key Features:
- 1.2mm diameter stranded wire
- Galvanized for corrosion resistance
- 680 meters per roll (5kg)
- Flexible and easy to handle
- Good conductivity for fence power

The stranded design prevents kinking and makes installation easier than solid wire.

Applications: Perimeter security fences, farm boundaries, game reserves.

Roll Size: 680 meters / 5kg`
  },
  {
    slug: "nemtek-1-6mm-aluminium-stranded-electric-fence-wire-1000m-roll",
    description: `Premium 1.6mm aluminium stranded wire offering superior conductivity for long fence runs. The 1000m roll covers large installations efficiently.

Key Features:
- 1.6mm diameter aluminium stranded
- Exceptional electrical conductivity
- Lightweight for easy installation
- Corrosion resistant
- 1000 meters per roll

Aluminium wire conducts electricity better than galvanized steel, making it ideal for long-distance fencing.

Applications: Long perimeter fences, farm installations, game reserves.

Roll Size: 1000 meters`
  },
  {
    slug: "nemtek-1-6mm-aluminium-stranded-electric-fence-wire-500m-roll",
    description: `High-conductivity 1.6mm aluminium stranded wire in convenient 500m rolls. Perfect for medium-sized installations or as additional stock.

Key Features:
- 1.6mm aluminium stranded
- Superior conductivity
- Easy to tension and install
- Weather resistant
- 500 meters per roll

Same premium quality as the 1000m roll in a more manageable size.

Applications: Medium fence runs, residential perimeters, patch and repair work.

Roll Size: 500 meters`
  },
  {
    slug: "nemtek-1-6mm-solid-aluminium-alloy-wire-1000m",
    description: `Solid aluminium alloy wire for maximum conductivity and durability. The 1.6mm solid construction provides consistent performance over long distances.

Key Features:
- 1.6mm solid aluminium alloy
- Maximum electrical conductivity
- Lightweight construction
- Corrosion proof
- 1000 meters per roll

Solid wire offers the best conductivity but requires careful handling to prevent kinks.

Applications: Professional installations, long fence runs, high-performance requirements.

Roll Size: 1000 meters`
  },
  {
    slug: "nemtek-100mm-x-2-5mm-black-cable-ties-pack-of-100",
    description: `UV-resistant cable ties for secure wire management in electric fence installations. Pack of 100 small ties for light-duty applications.

Key Features:
- 100mm x 2.5mm size
- Black UV-stabilized nylon
- Strong tensile strength
- Weather resistant
- 100 ties per pack

Ideal for securing fence wires to intermediate posts and organizing cables.

Applications: Wire management, cable bundling, temporary fence repairs.`
  },
  {
    slug: "nemtek-2-way-gate-contact",
    description: `Heavy-duty 2-way gate contact for maintaining electric fence continuity through sliding gates. Features stainless steel and brass construction.

Key Features:
- Stainless steel and brass components
- All-weather durability
- Large location plates for easier installation
- Optional earth plate available
- Brass or crimp lug connectors

Designed for reliable performance in all South African climate conditions.

Applications: Sliding gates, double-leaf gates, heavy-duty installations.`
  },
  {
    slug: "nemtek-200mm-x-4-8mm-black-cable-ties-pack-of-100",
    description: `Medium-duty UV-resistant cable ties for electric fence installations. The 200mm length handles larger bundles and spacing requirements.

Key Features:
- 200mm x 4.8mm size
- Black UV-stabilized nylon
- High tensile strength
- Weather resistant
- 100 ties per pack

Suitable for securing fence wires, mounting accessories, and general cable management.

Applications: Fence wire attachment, cable organization, equipment mounting.`
  },
  // Gate Motors
  {
    slug: "centurion-d5-evo-gate-motor",
    description: `South Africa's most popular sliding gate motor, the Centurion D5 EVO delivers reliable automation for gates up to 500kg. Trusted by installers nationwide for its durability and ease of installation.

Key Features:
- 500kg gate capacity
- 24V DC operation with battery backup
- Built-in anti-theft features
- SMART controller compatibility
- MyCentsys app integration available
- Sleek, modern cover design

The D5 EVO includes intelligent limit detection, soft start/stop operation, and comprehensive safety features. Battery backup provides up to 20 cycles during power outages.

Applications: Residential homes, townhouse complexes, small business premises.

Package: Motor unit with rack sold separately. Battery recommended for backup.`
  },
  {
    slug: "centurion-d10-smart-turbo-gate-motor-no-remotes-included",
    description: `Industrial-grade sliding gate motor for heavy-duty applications up to 1000kg. The D10 Smart Turbo delivers exceptional speed and power for high-traffic installations.

Key Features:
- 1000kg (1 ton) gate capacity
- Turbo speed up to 45m per minute
- 24V DC with battery backup (up to 35 cycles)
- SMART wireless configuration
- MyCentsys Pro app control
- Anti-theft cage design

Designed for commercial and industrial applications with high daily cycle requirements (750+ per day).

Applications: Estates, office parks, warehouses, industrial facilities.

Note: Remotes sold separately. Requires rack for installation.`
  },
  {
    slug: "et-nice-drive-500-gate-motor",
    description: `Reliable sliding gate motor for residential applications up to 500kg. The E.T Nice Drive 500 offers quality automation at an affordable price point.

Key Features:
- 500kg gate capacity
- 24V DC motor
- Battery backup capable
- Soft start/stop function
- Built-in safety features

A dependable choice for homeowners seeking quality gate automation without the premium price.

Applications: Residential homes, townhouses, small commercial gates.`
  },
  {
    slug: "et-nice-drive-600-gate-motor",
    description: `Mid-range sliding gate motor for gates up to 600kg. Enhanced features including improved duty cycle for more frequent use.

Key Features:
- 600kg gate capacity
- 24V DC operation
- Enhanced duty cycle
- Safety features included
- Battery backup compatible

Ideal for properties with heavier gates or more frequent operation needs.

Applications: Medium-sized residential gates, light commercial installations.`
  },
  {
    slug: "et-nice-drive-1000-gate-motor",
    description: `Heavy-duty sliding gate motor for industrial gates up to 1000kg. Built for frequent operation with extended duty cycle.

Key Features:
- 1000kg gate capacity
- Industrial-grade construction
- Extended duty cycle
- 24V DC with backup capability
- Commercial-grade reliability

Designed for high-traffic commercial and industrial applications.

Applications: Factories, warehouses, estates, office parks.`
  },
  // Remotes
  {
    slug: "centurion-nova-1-button-remote",
    description: `Secure single-button remote with Keeloq code-hopping technology. The Centurion Nova transmits on 433MHz with military-grade encryption.

Key Features:
- Single button operation
- Keeloq rolling code encryption
- 433MHz frequency
- Carbon-look design
- Rotating body for comfort
- Long battery life

Each button press generates a unique code, preventing signal cloning and ensuring maximum security.

Compatible with: Centurion NOVA receivers, D5-Evo, D10, VECTOR2, XTrac systems.`
  },
  {
    slug: "centurion-nova-1-button-remote-copy",
    description: `Versatile 2-button remote for controlling two separate automation systems. Features the same advanced Keeloq security as all Nova remotes.

Key Features:
- 2 independent buttons
- Keeloq code-hopping encryption
- 433MHz frequency
- Control gate and garage separately
- Premium carbon-look finish

Ideal for properties with multiple automated access points.

Compatible with: All Centurion NOVA receiver systems.`
  },
  {
    slug: "centurion-nova-4-button-remote",
    description: `Multi-channel remote for controlling up to 4 different automation systems. The ultimate convenience for properties with multiple gates and garages.

Key Features:
- 4 independent channels
- Keeloq military-grade encryption
- 433MHz frequency
- Carbon-look aesthetic
- Ergonomic design
- Long-lasting battery

Control your gate, garage, electric door, and more from a single stylish remote.

Compatible with: Centurion D5-Evo, D10, VECTOR2, XTrac, and all NOVA receiver systems.`
  },
  {
    slug: "sentry-4-button-c-hop-433-nova-remote",
    description: `Sentry 4-button remote with code-hopping security on 433MHz frequency. Compatible with Nova receiver systems.

Key Features:
- 4 button channels
- Code-hopping technology
- 433MHz operation
- Durable construction
- Easy battery replacement

Control multiple automation systems with one convenient remote.

Applications: Gate motors, garage doors, automated access systems.`
  },
  {
    slug: "sentry-3-button-c-hop-433-nova-remote-copy",
    description: `Compact 3-button Sentry remote with rolling code security. Ideal for properties with gate, garage, and one additional automation system.

Key Features:
- 3 button operation
- Code-hopping security
- 433MHz frequency
- Compact design
- Reliable performance

A practical choice for most residential automation needs.

Compatible with: Nova receiver systems and compatible gate/garage motors.`
  },
  // CCTV
  {
    slug: "hilook-2mp-dome-camera",
    description: `Professional 2MP Full HD dome camera for indoor and outdoor surveillance. The compact design provides discreet monitoring while delivering crisp 1080p video.

Key Features:
- 1920x1080p Full HD resolution
- IR night vision up to 20m
- IP67 weatherproof rating
- Wide Dynamic Range (WDR)
- 12V DC or PoE power options
- Compact dome design

The vandal-resistant housing makes this camera ideal for both indoor and outdoor installations.

Applications: Retail stores, offices, homes, parking areas.

Compatibility: HiLook and Hikvision NVR/DVR systems.`
  },
  {
    slug: "hilook-2mp-full-colour-vu-dome-camera",
    description: `Advanced 2MP dome camera with ColorVu technology for full-color video 24/7. Captures clear, colorful footage even in low-light conditions.

Key Features:
- Full-color day and night recording
- 2MP 1080p resolution
- ColorVu low-light technology
- IP67 weatherproof rating
- Wide viewing angle

ColorVu technology uses advanced sensor and supplemental lighting to deliver color images where traditional cameras would switch to black and white.

Applications: Areas requiring detailed identification, parking lots, entrances.`
  },
  {
    slug: "hilook-2mp-bullet-camera",
    description: `Robust 2MP bullet camera with exceptional IR night vision. The outdoor-rated housing withstands harsh South African weather conditions.

Key Features:
- 1920x1080p Full HD
- IR night vision up to 30m
- IP67 weatherproof rating
- Smart IR technology
- WDR for high-contrast scenes
- 12V DC or PoE options

The extended IR range makes this camera ideal for perimeter monitoring and outdoor areas.

Applications: Perimeters, parking areas, building entrances, driveways.`
  },
  {
    slug: "hilook-4-channel-turbo-hd-dvr",
    description: `Compact 4-channel DVR for small surveillance systems. Supports Full HD recording with remote viewing via smartphone app.

Key Features:
- 4 camera channels
- Full HD 1080p recording
- H.265+ compression
- Remote viewing via HiLook app
- Easy setup and configuration

Perfect for small homes and businesses requiring basic surveillance coverage.

Applications: Small retail stores, residential homes, small offices.

Storage: Supports up to 6TB HDD (sold separately).`
  },
  {
    slug: "hilook-8-channel-turbo-hd-dvr-with-built-in-512gb-hdd",
    description: `8-channel DVR with pre-installed 512GB hard drive for immediate deployment. Supports up to 8 Full HD cameras.

Key Features:
- 8 camera channels
- 512GB HDD included
- Full HD 1080p recording
- H.265+ compression
- HiLook Vision app support

Ready to record right out of the box with included storage.

Applications: Medium-sized homes and businesses.

Recording: Approximately 2 weeks of continuous recording at standard quality.`
  },
  {
    slug: "hilook-16-channel-turbo-hd-dvr-with-built-in-1tb-hdd",
    description: `Professional 16-channel DVR with 1TB storage for larger surveillance systems. Ideal for commercial and industrial applications.

Key Features:
- 16 camera channels
- 1TB HDD pre-installed
- Full HD recording
- H.265+ efficient compression
- Remote monitoring

Provides comprehensive coverage for larger properties with extended recording capacity.

Applications: Commercial buildings, warehouses, estates, industrial sites.`
  },
  // Batteries
  {
    slug: "12v-7ah-battery",
    description: `Standard 12V 7Ah sealed lead-acid battery for gate motors, alarms, and backup power systems. Maintenance-free operation with reliable performance.

Key Features:
- 12V 7Ah capacity
- Sealed lead-acid (SLA) type
- Maintenance-free design
- AGM technology
- Low self-discharge
- Operating range: -15°C to +50°C

The most common backup battery for gate motors including Centurion D5-Evo and similar models.

Applications: Gate motors, alarm panels, UPS systems, emergency lighting.

Dimensions: Approximately 151mm x 65mm x 94mm.`
  },
  {
    slug: "12v-8ah-lithium-battery",
    description: `Advanced lithium iron phosphate (LiFePO4) battery delivering superior performance and lifespan. Up to 4 times longer life than lead-acid alternatives.

Key Features:
- 12V 8Ah capacity
- LiFePO4 technology
- 2000+ charge cycles
- 60% lighter than SLA
- Built-in BMS protection
- Rapid charging (3-5 hours)
- 10+ year potential lifespan

The most cost-effective long-term solution for gate motors and solar systems.

Applications: Gate motors, solar installations, portable equipment.`
  },
  {
    slug: "centurion-gate-motor-battery-12v-7ah-cp4c2-28w",
    description: `Genuine Centurion 12V 7.2Ah battery specifically engineered for Centurion gate motors. OEM specification ensures perfect compatibility.

Key Features:
- Original Centurion specification
- 12V 7.2Ah capacity
- Perfect fit for Centurion motors
- Optimized for Centurion chargers
- Maintains warranty compliance

Using genuine Centurion batteries ensures optimal performance and prevents charging issues.

Compatible with: D5-Evo, D3-Evo, VANTAGE, and other Centurion models.

Replacement interval: Every 2-3 years for consistent performance.`
  },
  // Intercoms
  {
    slug: "centurion-g-speak-ultra-4-button-intercom",
    description: `Advanced GSM intercom with 4 programmable buttons for multi-user access control. Connect your gate to your mobile phone from anywhere in the world.

Key Features:
- 4 programmable call buttons
- Each button calls up to 2 numbers
- 4G/LTE connectivity
- MyCentsys app management
- Supports up to 1500 users
- Time-barring access control
- Weatherproof aluminum housing

The G-Speak Ultra eliminates wired handsets, using your mobile phone for all communication and gate control.

Applications: Residential estates, townhouse complexes, commercial buildings.

Requirements: Active SIM card with data plan.`
  },
  {
    slug: "centurion-g-speak-ultra-upgrade-kit",
    description: `Upgrade existing Centurion intercom systems to G-Speak Ultra functionality. Adds modern GSM connectivity using existing wiring.

Key Features:
- Retrofit kit for older systems
- Adds 4G/LTE connectivity
- Mobile app control
- Uses existing installation
- Easy upgrade process

Modernize your access control without replacing the entire intercom system.

Applications: Upgrading older Centurion intercoms to smartphone control.`
  },
  {
    slug: "zartek-wireless-intercom-system",
    description: `Complete wireless intercom solution requiring no wiring between gate and house. Ideal for properties where cable installation is impractical.

Key Features:
- Fully wireless operation
- No installation wiring needed
- Clear audio communication
- Long wireless range
- Battery backup

Simple setup makes this perfect for DIY installation or difficult cable routing situations.

Applications: Properties with long driveways, retrofitting existing homes.`
  },
  {
    slug: "kocom-intercom-system",
    description: `Video intercom system providing clear audio and video communication between gate and indoor monitor. See and speak with visitors before granting access.

Key Features:
- Video and audio communication
- Indoor monitor included
- Gate station camera
- Door release function
- Multiple monitor expandable

A complete solution for residential and small commercial video intercom needs.

Applications: Homes, offices, small apartment buildings.`
  },
  // Garage Motors
  {
    slug: "dc-blue-advance-garage-door-motor",
    description: `Premium sectional garage door motor offering quiet, reliable operation. The DC Blue Advance features advanced safety systems and smooth performance.

Key Features:
- Suitable for sectional doors
- DC motor for quiet operation
- Soft start/stop function
- Battery backup capable
- Safety obstruction detection

Note: Motor unit only. Requires compatible rail system for installation.

Applications: Residential sectional garage doors.`
  },
  {
    slug: "dc-blue-advance-sectional-garage-motor-extrusion",
    description: `Complete sectional garage motor kit including motor and extrusion rail. Everything needed for a professional garage door automation.

Kit Includes:
- DC Blue Advance motor
- Extrusion rail system
- Mounting hardware
- Remote control
- Safety features included

The complete package for automating sectional garage doors.

Applications: Standard residential sectional garage doors.`
  },
  {
    slug: "e-t-roll-up-advance-garage-door-motor-kit",
    description: `Specialized motor kit for roll-up garage doors. The E.T Roll-up Advance handles the unique requirements of roll-up door automation.

Kit Includes:
- Roll-up door motor
- Remote control
- Mounting hardware
- Installation components

Key Features:
- Designed for roll-up doors
- Smooth, controlled operation
- Safety features
- Remote control included

Applications: Industrial and commercial roll-up doors, residential roll-up installations.`
  }
];

async function updateDescriptions() {
  console.log("Starting additional product description updates...\n");
  
  let updated = 0;
  let failed = 0;
  let notFound = 0;
  
  for (const item of moreDescriptions) {
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
