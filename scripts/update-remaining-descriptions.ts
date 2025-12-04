import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

interface ProductDescription {
  slug: string;
  description: string;
}

const remainingDescriptions: ProductDescription[] = [
  // Remotes
  {
    slug: "absolute-4-button-remote",
    description: `Versatile 4-button remote compatible with Absolute receivers. Controls up to 4 separate automation systems from one convenient handset.

Key Features:
- 4 independent channels
- Rolling code security
- Compact design
- Easy programming

Ideal for properties with multiple gates or garage doors.

Compatible with: Absolute receiver systems.`
  },
  {
    slug: "dts-octo-5-button-remote",
    description: `5-channel remote for DTS automation systems. The extra button provides flexibility for complex installations.

Key Features:
- 5 programmable buttons
- Rolling code encryption
- DTS compatible
- Long-range transmission

Control gate, garage, and more from a single remote.

Compatible with: DTS gate motor systems.`
  },
  {
    slug: "gemini-4-button-remote",
    description: `Original Gemini 4-button remote for Gemini gate motor systems. Reliable operation with rolling code security.

Key Features:
- 4 channels
- Code-hopping technology
- Gemini compatibility
- Durable construction

Genuine Gemini remote for optimal performance.

Compatible with: All Gemini gate motor systems.`
  },
  {
    slug: "sentry-2-button-c-hop-433-nova-remote",
    description: `Compact 2-button Sentry remote with code-hopping security. Perfect for basic gate and garage control.

Key Features:
- 2 button channels
- Code-hopping security
- 433MHz frequency
- Compact size

Simple control for properties with gate and garage automation.

Compatible with: Nova receiver systems.`
  },
  {
    slug: "sentry-3-button-c-hop-433-nova-remote-copy",
    description: `3-button Sentry remote offering balance between simplicity and versatility. Controls three separate systems.

Key Features:
- 3 button operation
- Rolling code encryption
- 433MHz transmission
- Reliable performance

Ideal for gate, garage, and one additional automation.

Compatible with: Nova receiver systems.`
  },
  {
    slug: "sentry-4-button-c-hop-433-nova-remote",
    description: `Full-featured 4-button Sentry remote with code-hopping technology. Maximum control from one handset.

Key Features:
- 4 independent buttons
- Code-hopping security
- 433MHz frequency
- Compact design

Complete automation control for larger properties.

Compatible with: Nova and compatible receiver systems.`
  },
  {
    slug: "nice-era-inti-2-button-remote",
    description: `Premium Nice Era Inti 2-button remote with sleek Italian design. Advanced security with elegant styling.

Key Features:
- 2 channel operation
- Nice Flor encryption
- Premium build quality
- Compact ergonomic design

The choice for discerning homeowners seeking style and security.

Compatible with: Nice receiver systems.`
  },
  {
    slug: "nice-era-inti-4-button-remote",
    description: `Top-of-the-line Nice Era Inti 4-button remote combining Italian design with advanced security.

Key Features:
- 4 programmable channels
- Nice Flor rolling code
- Premium finish
- Slim profile

Luxury automation control for prestigious properties.

Compatible with: Nice receiver systems.`
  },
  // Gate Motors - remaining
  {
    slug: "centurion-d5-evo-full-kit",
    description: `Complete D5 Evo kit including motor, rack, and accessories. This is a DISCONTINUED product - please see current D5 Evo Smart models.

Note: Limited availability. Replacement is Centurion D5 Evo Smart Full Kit.

Kit included:
- D5 Evo motor
- Steel rack
- Installation hardware

Applications: Residential sliding gates up to 500kg.`
  },
  {
    slug: "centurion-vantage-500-gate-motor",
    description: `Swing gate motor for double-leaf gates up to 500kg per leaf. Underground mounting for discreet automation.

Key Features:
- 500kg per leaf capacity
- Underground installation
- 24V DC operation
- Battery backup capable
- Low-profile appearance

Ideal for prestigious entrances where motor visibility is undesirable.

Applications: Double swing gates, estate entrances.`
  },
  {
    slug: "centurion-d10-smart-base-plate",
    description: `Heavy-duty base plate for Centurion D10 Smart gate motors. Provides stable mounting foundation.

Key Features:
- Designed for D10 Smart
- Heavy-duty steel
- Adjustable height
- Pre-drilled mounting

Essential for proper D10 installation and alignment.

Applications: Centurion D10 Smart installations.`
  },
  {
    slug: "centurion-d10-sliding-gate-motor",
    description: `Industrial-strength sliding gate motor for gates up to 1000kg. The D10 Smart delivers exceptional power and speed.

Key Features:
- 1000kg gate capacity
- Turbo speed option
- 24V DC with battery backup
- SMART wireless configuration
- Anti-theft design

Designed for commercial and high-traffic applications with 750+ cycles per day capability.

Applications: Factories, estates, office parks, commercial properties.`
  },
  {
    slug: "centurion-d2-sliding-gate-motor",
    description: `DISCONTINUED: The Centurion D2 has been replaced by the D3 Smart range.

Note: This product is no longer manufactured. Please consider Centurion D3 Smart as a direct replacement.

Applications: Legacy installations requiring D2 replacement parts.`
  },
  {
    slug: "centurion-d3-smart-gate-motor",
    description: `Entry-level Centurion sliding gate motor for residential gates up to 350kg. Smart features at an affordable price.

Key Features:
- 350kg gate capacity
- 24V DC operation
- Battery backup (5+ cycles)
- SMART configuration
- MyCentsys app capable

Perfect starter motor for residential installations.

Note: Remotes sold separately.

Applications: Small residential gates, townhouses.`
  },
  {
    slug: "centurion-d3-smart-full-kit-advanced-gate-automation-solution-1",
    description: `Complete D3 Smart kit with anti-theft bracket. Everything needed for a secure residential installation.

Kit Includes:
- D3 Smart motor
- 4m steel rack
- Anti-theft bracket
- Battery
- Remote controls

Ready to install with full protection against motor theft.

Applications: Residential homes requiring complete security.`
  },
  {
    slug: "centurion-d3-smart-full-kit-no-anti-theft-bracket",
    description: `D3 Smart complete kit without anti-theft bracket. Ideal for low-risk installations.

Kit Includes:
- D3 Smart motor
- Steel rack
- Battery
- Remote controls

Basic complete kit for standard residential use.

Applications: Secure complexes, low-risk residential areas.`
  },
  {
    slug: "centurion-d3-smart-motor-only",
    description: `D3 Smart motor unit only - for installer stock or replacements. Does not include rack, battery, or accessories.

Key Features:
- Motor unit only
- 350kg capacity
- 24V DC operation
- Smart compatibility

For installers with existing accessories or replacing failed motors.

Applications: Motor replacements, installer stock.`
  },
  {
    slug: "centurion-d3-smart-sliding-gate-motor",
    description: `Reliable D3 Smart sliding gate motor providing essential automation features for residential properties.

Key Features:
- 350kg gate capacity
- 24V DC motor
- Smart wireless setup
- Soft start/stop
- Battery backup capable

The most affordable Centurion option with full Smart features.

Applications: Standard residential sliding gates.`
  },
  {
    slug: "centurion-d3-d5-evo-smart-anti-theft-bracket",
    description: `Security bracket protecting D3 and D5 Evo Smart motors from theft. Heavy-duty construction deters tampering.

Key Features:
- Fits D3 and D5 Evo Smart
- Heavy-duty steel
- Tamper-resistant design
- Easy installation

Highly recommended for high-risk areas.

Applications: All D3 and D5 Evo Smart installations.`
  },
  {
    slug: "centurion-d5-d6-smart-anti-theft",
    description: `DISCONTINUED anti-theft bracket for legacy D5/D6 motors. See current D5/D6 Smart Anti-Theft Bracket.

Note: Limited availability. Contact for alternatives.

Applications: Legacy D5/D6 installations.`
  },
  {
    slug: "centurion-d5-evo-sliding-gate-motor",
    description: `DISCONTINUED: Original D5 Evo has been replaced by D5 Evo Smart.

Note: This model is no longer manufactured. Please see Centurion D5 Evo Smart for current equivalent.

Legacy specifications: 500kg capacity, 24V DC operation.

Applications: D5 Evo replacement parts and legacy support.`
  },
  {
    slug: "centurion-d5-evo-smart-gate-motor-2x-nova-4-button-remotes",
    description: `D5 Evo Smart motor bundle with 2 Nova 4-button remotes included. Ready to install with control for the whole family.

Package Includes:
- D5 Evo Smart motor
- 2x Nova 4-button remotes

Key Features:
- 500kg gate capacity
- Smart configuration
- App control capable
- Battery backup

Convenient package with remotes included.

Applications: Residential sliding gates.`
  },
  {
    slug: "centurion-d3-smart-full-kit-advanced-gate-automation-solution",
    description: `Complete D5 Evo Smart installation package with all accessories and anti-theft protection.

Kit Includes:
- D5 Evo Smart motor
- Steel rack (4m)
- Battery
- Anti-theft bracket
- Remote controls
- Installation hardware

The complete solution for residential gate automation with maximum security.

Applications: Standard to larger residential sliding gates.`
  },
  {
    slug: "centurion-d5-evo-smart-full-kit-advanced-gate-automation-solution-copy",
    description: `D5 Evo Smart complete kit without anti-theft bracket. For secure areas where theft protection is less critical.

Kit Includes:
- D5 Evo Smart motor
- Steel rack
- Battery
- Remote controls

Cost-effective complete package for lower-risk installations.

Applications: Secure complexes, estate homes with security.`
  },
  {
    slug: "centurion-d5-evo-smart-motor-only",
    description: `D5 Evo Smart motor unit for installers and replacements. Premium Centurion automation without accessories.

Key Features:
- 500kg gate capacity
- 24V DC motor
- Full Smart features
- Battery backup support

Motor only - rack, battery, and accessories purchased separately.

Applications: Installer stock, motor replacements.`
  },
  {
    slug: "centurion-d5-d6-smart-anti-theft-bracket",
    description: `Current anti-theft bracket for D5 and D6 Smart gate motors. Professional-grade theft protection.

Key Features:
- Fits D5 and D6 Smart
- Hardened steel construction
- Tamper-proof design
- Integrated locking

Essential protection for high-value motor installations.

Applications: D5 Smart and D6 Smart installations in high-risk areas.`
  },
  {
    slug: "centurion-d6-smart-gate-motor",
    description: `Mid-range Centurion motor for gates 500-750kg. Bridges the gap between D5 and D10 with enhanced features.

Key Features:
- 750kg gate capacity
- Extended duty cycle
- 24V DC with battery backup
- Smart wireless configuration

Ideal for heavier residential and light commercial gates.

Note: Remotes sold separately.

Applications: Heavy residential gates, small commercial entrances.`
  },
  {
    slug: "centurion-d6-smart-full-kit-advanced-gate-automation-solution",
    description: `Complete D6 Smart package with all accessories. Perfect for larger gates requiring more power.

Kit Includes:
- D6 Smart motor
- Steel rack
- Anti-theft bracket
- Battery
- Remote controls

Comprehensive kit for heavy-duty residential applications.

Applications: Large residential gates, light commercial use.`
  },
  {
    slug: "centurion-d6-smart-full-kit-no-anti-theft-bracket",
    description: `D6 Smart complete kit without anti-theft bracket. For installations where motor security is less concern.

Kit Includes:
- D6 Smart motor
- Steel rack
- Battery
- Remote controls

Value package for secure environments.

Applications: Estates, secure complexes.`
  },
  {
    slug: "centurion-gate-motor-nylon-rack-2m",
    description: `Quiet-running nylon rack for Centurion sliding gate motors. Reduces noise and extends pinion gear life.

Key Features:
- 2 meter sections
- Nylon construction
- Quiet operation
- Reduced wear on motor
- Centurion compatible

Premium upgrade for noise-sensitive installations.

Applications: Residential gates where quiet operation is priority.`
  },
  {
    slug: "centurion-vantage-400-gate-motor",
    description: `Swing gate motor for single-leaf gates up to 400kg. Underground mounting provides clean installation.

Key Features:
- 400kg single leaf capacity
- Underground installation
- 24V DC operation
- Invisible automation

Ideal for prestige properties where visible motors are undesirable.

Applications: Single swing gates, feature entrances.`
  },
  {
    slug: "custom-amount",
    description: `Custom order amount for special requirements. Contact Alectra Solutions to discuss your specific needs.

This product allows for custom pricing on:
- Special orders
- Bulk purchases
- Custom configurations
- Service packages

Contact us: info@alectra.co.za`
  },
  {
    slug: "dts-eco-gate-motor-kit",
    description: `Budget-friendly complete gate motor kit from DTS. Reliable automation at an economical price point.

Kit Includes:
- DTS Eco motor
- Steel rack
- Battery
- Remote control
- Installation hardware

Quality South African brand offering value for residential installations.

Applications: Residential gates, budget-conscious installations.`
  },
  {
    slug: "dts-expert-gate-motor-full-kit",
    description: `Professional-grade DTS gate motor package with comprehensive accessories. Enhanced features for demanding applications.

Kit Includes:
- DTS Expert motor
- Steel rack (4m)
- Battery
- Remote controls
- Anti-theft bracket

Full-featured kit for reliable residential automation.

Applications: Standard to larger residential gates.`
  },
  {
    slug: "dts-expert-gate-motor-battery",
    description: `DTS Expert motor bundled with matching battery. Essential combination for proper installation.

Package Includes:
- DTS Expert gate motor
- Compatible 12V battery

Key Features:
- Quality DTS motor
- Correct battery specification
- Ready for installation

Applications: Residential sliding gate automation.`
  },
  {
    slug: "dace-sprint-500-gate-motor",
    description: `DISCONTINUED: Dace Sprint 500 is no longer manufactured.

Note: This product is discontinued. Consider alternative motors like E.T Nice Drive 500 or Gemini Slider for similar applications.

Applications: Legacy Dace installations requiring parts.`
  },
  {
    slug: "digidoor",
    description: `DigiDoor compatible remotes for garage and gate automation. Various button configurations available.

Key Features:
- DigiDoor compatibility
- Rolling code security
- Multiple button options

For DigiDoor motor systems only.

Applications: DigiDoor garage and gate automation.`
  },
  {
    slug: "duraslide",
    description: `Duraslide gate motor remotes for compatible systems. Secure transmission for reliable control.

Key Features:
- Duraslide compatible
- Rolling code encryption
- Various button options

Check compatibility before ordering.

Applications: Duraslide gate motor systems.`
  },
  {
    slug: "e-t-drive-500-gate-motor-kit",
    description: `Complete E.T Drive 500 sliding gate kit including all installation components.

Kit Includes:
- E.T Drive 500 motor
- Steel rack
- Battery
- Remote control

Key Features:
- 500kg capacity
- Complete package
- 24V DC operation

Ready for full installation.

Applications: Residential sliding gates up to 500kg.`
  },
  {
    slug: "et-nice-drive-1000-gate-motor",
    description: `Heavy-duty industrial sliding gate motor for gates up to 1000kg. Built for commercial and industrial applications.

Key Features:
- 1000kg (1 ton) capacity
- Industrial-grade construction
- Extended duty cycle
- 24V DC operation

Reliable power for demanding commercial gates.

Applications: Factories, warehouses, estates, high-traffic entrances.`
  },
  {
    slug: "et-nice-drive-300-gate-motor",
    description: `Entry-level sliding gate motor for light residential gates up to 300kg. Affordable automation for basic applications.

Key Features:
- 300kg gate capacity
- 24V DC motor
- Battery backup capable
- Simple operation

Budget-friendly option for light gates.

Applications: Small residential gates, pedestrian gates.`
  },
  {
    slug: "gemini-sel-gate-motor",
    description: `Gemini 12V sliding gate motor offering reliable automation at an economical price point. Trusted South African brand.

Key Features:
- 12V DC operation
- Battery backup
- Simple installation
- Gemini quality

Proven reliability for residential applications.

Applications: Residential sliding gates.`
  },
  {
    slug: "gemini-slider-12v-7ah-full-kit-complete-gate-automation-solution-copy",
    description: `Gemini Slider complete kit without anti-theft bracket. Value package for secure installations.

Kit Includes:
- Gemini Slider motor
- 12V 7Ah battery
- Steel rack
- Remote control

For lower-risk environments where anti-theft is not priority.

Applications: Secure complexes, residential estates.`
  },
  // Garage Motors
  {
    slug: "centurion-rdo-ii-roll-up-motor",
    description: `Professional roll-up door motor from Centurion. Complete kit for industrial roll-up door automation.

Key Features:
- For roll-up garage doors
- Centurion quality
- Battery backup capable
- Complete kit included

Designed specifically for roll-up door applications.

Applications: Industrial roll-up doors, commercial entrances.`
  },
  {
    slug: "centurion-t10-sdo4-motor",
    description: `Centurion SDO4 T10 Smart kit for sectional garage doors. Premium automation with app control.

Key Features:
- Sectional door compatible
- Smart configuration
- MyCentsys app support
- Battery backup

Premium Centurion garage automation.

Applications: Residential sectional garage doors.`
  },
  {
    slug: "centurion-sdo4-t12-smart-kit",
    description: `Enhanced Centurion SDO4 T12 Smart kit with extended rail for taller garage doors.

Key Features:
- Extended rail length
- Smart wireless setup
- App control capable
- Quiet operation

For taller sectional garage doors.

Applications: Tall residential sectional doors.`
  },
  {
    slug: "digidoor-digi-iq-smart-garage-door-motor",
    description: `DISCONTINUED: DigiDoor Digi IQ Smart is no longer manufactured.

Note: This product is discontinued. Please contact us for current alternatives.

The Digi IQ was a smart garage door motor with WiFi connectivity and app control.

Applications: Legacy DigiDoor installations.`
  },
  {
    slug: "digidoor-digi-one-garage-door-motor",
    description: `DISCONTINUED: DigiDoor Digi One is no longer manufactured.

Note: This product is discontinued. Consider alternatives like E.T DC Blue Advance or Gemini Sectional motors.

Applications: Legacy DigiDoor replacement parts.`
  },
  {
    slug: "e-t-dc-blue-advanced-pico-motor",
    description: `Compact DC Blue Advanced Pico motor bundle for smaller garage doors. Space-saving design with full features.

Bundle Includes:
- Pico motor unit
- Rail system
- Remote control
- Installation kit

Key Features:
- Compact design
- Quiet DC operation
- Battery backup capable

For smaller sectional and tilt doors.

Applications: Single garages, compact installations.`
  },
  {
    slug: "et-nice-dc-blue-astute-3-2m-sectional-garage-door-motor",
    description: `Premium DC Blue Astute motor with 3.2m rail for standard sectional garage doors. Full smart features included.

Key Features:
- 3.2m rail included
- DC motor quiet operation
- Smart features
- Battery backup

Complete package for standard residential garages.

Applications: Standard sectional garage doors up to 3.2m height.`
  },
  {
    slug: "garador-elev8tor-garage-door-motor",
    description: `Garador Elev8tor motor kit with extrusion rail system. Quality British brand for reliable automation.

Kit Includes:
- Elev8tor motor
- Extrusion rail
- Remote control
- Installation hardware

Smooth, quiet operation for sectional and tilt doors.

Applications: Sectional and tilt-up garage doors.`
  },
  {
    slug: "gemini-sectional-garage-door-motor-kit",
    description: `Gemini sectional garage door motor kit offering South African quality and reliability.

Kit Includes:
- Gemini sectional motor
- Rail system
- Remote control

Key Features:
- Sectional door compatible
- Quiet operation
- Battery backup capable

Proven performance from trusted local brand.

Applications: Residential sectional garage doors.`
  },
  // Intercoms
  {
    slug: "centurion-g-speak-ultra",
    description: `Premium GSM intercom with 4G connectivity and smartphone app control. Eliminate wired handsets entirely.

Key Features:
- 4G/LTE connectivity
- MyCentsys app control
- 4 programmable buttons
- Up to 1500 users
- Weatherproof housing

The most advanced Centurion intercom for modern access control.

Requires: Active SIM card with data.

Applications: Estates, complexes, commercial buildings.`
  },
  {
    slug: "centurion-g-ultra-gsm-smart-switch",
    description: `Smart switch adding remote control to any automation system. Open gates, doors, and more via mobile phone.

Key Features:
- GSM connectivity
- SMS and app control
- Works with any automation
- Easy retrofit
- Multiple user support

Add smartphone control to existing gate motors and garage doors.

Applications: Upgrading legacy systems to smart control.`
  },
  {
    slug: "centurion-polophone",
    description: `Traditional wired intercom providing reliable audio communication between gate and house.

Key Features:
- Wired connection
- Clear audio quality
- Weatherproof gate station
- Indoor handset included
- Gate release function

Simple, reliable communication without complexity.

Applications: Residential homes, basic intercom needs.`
  },
  {
    slug: "centurion-smartguard-air-wireless-keypad",
    description: `Wireless keypad for code-based access control. No wiring required between gate and keypad.

Key Features:
- Wireless installation
- Multiple user codes
- Weather-resistant
- Easy programming
- Battery powered

Ideal for retrofits and installations where wiring is impractical.

Applications: Pedestrian gates, secondary entrances, retrofit installations.`
  },
  {
    slug: "centurion-smartguard-wired-keypad",
    description: `Wired keypad for reliable code-based access control. Direct connection ensures consistent operation.

Key Features:
- Wired connection
- Multiple user codes
- Backlit keys
- Weather-resistant
- Master code programmable

Most reliable option where wiring is feasible.

Applications: Main entrances, high-security access points.`
  },
  {
    slug: "e-t-nice-7-monitor-intercom-gate-station-full-kit",
    description: `Complete video intercom system with 7" monitor and gate station. See and speak with visitors before granting access.

Kit Includes:
- 7 inch color monitor
- Gate station with camera
- Wiring accessories
- Installation hardware

Full audio/video communication for secure access control.

Applications: Residential video intercom systems.`
  },
  {
    slug: "maglock-280kg-weatherproof-with-bracket",
    description: `Heavy-duty 280kg magnetic lock for gate and door access control. Weatherproof design for outdoor installation.

Key Features:
- 280kg holding force
- Weatherproof (IP65)
- 12/24V DC operation
- Mounting bracket included
- Fail-safe design

Essential for electric gate locking and access control systems.

Applications: Pedestrian gates, security doors, access control points.`
  },
  // LP Gas
  {
    slug: "19kg-exchange",
    description: `Standard 19kg LP Gas cylinder exchange. Bring your empty cylinder for refill collection.

Key Features:
- 19kg capacity
- Exchange service
- Refilled at certified facility
- Safety tested

Most popular size for residential cooking and heating.

Requirements: Bring matching empty cylinder for exchange.

Applications: Home cooking, braais, patio heating.`
  },
  {
    slug: "48kg-exchange",
    description: `Large 48kg LP Gas cylinder exchange for commercial and extended use applications.

Key Features:
- 48kg capacity
- Commercial size
- Exchange service
- Certified refills

Maximum capacity for extended use between refills.

Requirements: Bring matching empty 48kg cylinder.

Applications: Commercial kitchens, heating systems, extended residential use.`
  },
  {
    slug: "9kg-exchange",
    description: `Compact 9kg LP Gas cylinder exchange. Portable size for braais and camping.

Key Features:
- 9kg capacity
- Portable size
- Easy to transport
- Exchange service

Perfect for outdoor cooking and portable applications.

Requirements: Bring matching empty cylinder.

Applications: Braais, camping, portable heaters.`
  },
  {
    slug: "lp-gas-regulator-for-3kg-5kg-and-7kg",
    description: `Low-pressure regulator designed for small LP Gas cylinders. Controls gas flow for safe appliance operation.

Key Features:
- Fits 3kg, 5kg, 7kg cylinders
- Low-pressure output
- SABS approved
- Safety clip included

Essential safety component for gas appliances.

Applications: Portable stoves, camping equipment, small heaters.`
  },
  {
    slug: "lp-gas-regulator-for-9kg-19kg-48kg-cylinder",
    description: `Standard regulator for medium and large LP Gas cylinders. Required for safe connection to household appliances.

Key Features:
- Fits 9kg, 19kg, 48kg cylinders
- Standard pressure output
- SABS certified
- Durable construction

Must-have safety device for all gas installations.

Applications: Home stoves, braais, geysers, commercial appliances.`
  },
  // Additional CCTV
  {
    slug: "bnc-male-screw-type-connector",
    description: `Easy-install screw-on BNC connector requiring no crimping tools. Perfect for field installations and repairs.

Key Features:
- Tool-free installation
- Screw-on design
- RG59/RG6 compatible
- Reliable connection

Quick solution for CCTV cable terminations.

Applications: CCTV installations, repairs, DIY setups.`
  },
  {
    slug: "bnc-connector-crimp-type-for-rg59-2x-in-a-pack",
    description: `Professional crimp-style BNC connectors sold in pairs. Provides superior connection quality for permanent installations.

Key Features:
- 2 connectors per pack
- Crimp installation
- RG59 compatible
- Professional grade

Requires crimping tool for installation.

Applications: Professional CCTV installations.`
  },
  {
    slug: "network-cable-1000cm-cat6",
    description: `Pre-terminated 10m CAT6 Ethernet patch cable. Ready to use for IP camera and network connections.

Key Features:
- 10 meter length
- CAT6 rated
- Pre-fitted RJ45 connectors
- Gigabit capable

Convenient ready-made cable for quick installations.

Applications: IP cameras, network equipment, computer networking.`
  },
  {
    slug: "100x100x70-mm-waterproof-pvc-electrical-junction-box",
    description: `Weatherproof PVC junction box for outdoor electrical connections. IP65 rated for protection against water and dust.

Key Features:
- 100x100x70mm dimensions
- IP65 waterproof rating
- PVC construction
- Multiple cable entries
- Lid seal included

Essential for outdoor CCTV and electrical installations.

Applications: CCTV power connections, outdoor wiring, gate motor connections.`
  },
  // Garage Parts
  {
    slug: "wood-hinge-screws-85-in-a-pack",
    description: `Bulk pack of 85 wood screws for garage door hinge installation. Correct specification for standard hinges.

Key Features:
- 85 screws per pack
- Hinge mounting size
- Wood thread design
- Contractor quantity

Enough for multiple hinge replacements.

Applications: Garage door hinge mounting and replacement.`
  },
  {
    slug: "pulley-spring-mount-for-garage-doors",
    description: `Spring-mounted pulley assembly for extension spring garage door systems. Essential cable routing component.

Key Features:
- Spring mounting
- Smooth cable guide
- Steel construction
- Standard fitting

Guides lifting cables for proper door operation.

Applications: Extension spring garage door cable systems.`
  },
  {
    slug: "elev8tor-4-button-garage-door-remote",
    description: `Multi-channel remote for Elev8tor garage door systems. Control up to 4 different doors or motors.

Key Features:
- 4 independent buttons
- Rolling code security
- Elev8tor compatible
- Long battery life

Convenient control for multi-door properties.

Applications: Elev8tor garage systems, multi-door homes.`
  },
  {
    slug: "eazylift-garage-door-remote-4-button",
    description: `4-button remote compatible with Eazylift garage door openers. Secure rolling code transmission.

Key Features:
- 4 channels
- Code-hopping security
- Eazylift compatible
- Easy programming

Control multiple doors from one remote.

Applications: Eazylift garage door systems.`
  },
  // More accessories
  {
    slug: "pcb-shaft-encoder",
    description: `Position encoder providing accurate gate position feedback for precise motor control. Essential for limit detection.

Key Features:
- Accurate position sensing
- Motor control integration
- Standard fitting
- Reliable operation

Enables precise gate positioning and soft stop operation.

Applications: Gate motor systems requiring position feedback.`
  },
  {
    slug: "centurion-photon-wireless-beams",
    description: `Wireless safety beams eliminating cable trenching between gate posts. Essential safety feature installation made easy.

Key Features:
- Wireless transmission
- No trenching needed
- Safety detection
- Battery powered
- Easy installation

Prevents gate closure on vehicles and pedestrians.

Applications: Gate safety installations, retrofit projects.`
  },
  {
    slug: "sentry-safety-wireless-gate-beams",
    description: `Wireless safety beam system for automated gate obstruction detection. Stops gate when beam is broken.

Key Features:
- Wireless operation
- Safety detection
- Quick installation
- Long battery life

Critical safety component for all automated gates.

Applications: Gate motor safety systems.`
  },
  {
    slug: "gemini-gemlink-smart-device",
    description: `Add smartphone control to compatible Gemini gate motors. The Gemlink enables WiFi connectivity and app-based operation.

Key Features:
- WiFi connectivity
- Smartphone app control
- Remote access anywhere
- Easy retrofit

Upgrade existing Gemini motors to smart control.

Applications: Gemini gate motor upgrades.`
  },
  {
    slug: "gemini-hex-coupling-and-disc",
    description: `Replacement coupling and disc for Gemini motor gearbox connection. OEM parts ensure proper fit.

Key Features:
- Genuine Gemini parts
- Motor to gearbox connection
- Precision fit
- Easy replacement

Essential for Gemini motor servicing.

Applications: Gemini motor repair and maintenance.`
  },
  {
    slug: "gemini-pcb-v-90",
    description: `Replacement control board for Gemini gate motors version V.90. Restores full motor functionality.

Key Features:
- V.90 version
- Complete control functions
- Direct replacement
- Quality components

Genuine Gemini PCB for reliable operation.

Applications: Gemini motor control board replacement.`
  },
  {
    slug: "centurion-d5-cp80-pcb",
    description: `Legacy CP80 control board for older D5 motors. Maintains operation of original D5 installations.

Note: For legacy systems only. Current D5 Evo Smart uses different PCB.

Key Features:
- CP80 version compatibility
- Full control functionality
- Limited availability

While stocks last.

Applications: Older Centurion D5 motor repair.`
  },
  {
    slug: "gemini-power-supply-12v-solar-compatible",
    description: `Versatile 12V power supply for Gemini motors. Accepts both mains and solar input for flexible installations.

Key Features:
- 12V DC output
- Mains compatible
- Solar ready
- Battery charging function
- Gemini compatible

Enables solar-powered gate automation.

Applications: Gemini motors, solar installations.`
  },
  {
    slug: "gemini-anti-theft-bracket",
    description: `Heavy-duty security bracket protecting Gemini motors from theft and tampering.

Key Features:
- Heavy-duty steel
- Tamper resistant
- Easy installation
- Gemini specific fit

Recommended for all Gemini installations.

Applications: Gemini motor security.`
  },
  {
    slug: "gemini-pcb-v-90-gemlink-smart-device",
    description: `Bundle combining V.90 PCB with Gemlink smart device. Complete upgrade package for Gemini motors.

Bundle Includes:
- Gemini PCB V.90
- Gemlink smart device

Upgrade control board and add smart connectivity together.

Applications: Gemini motor modernization.`
  },
  {
    slug: "dts-60mm-radius-gate-wheels",
    description: `60mm gate wheels for standard sliding gate track systems. DTS quality for smooth, quiet operation.

Key Features:
- 60mm diameter
- Standard profile
- Smooth rolling
- Durable construction

Replacement wheels for sliding gate maintenance.

Applications: Sliding gate repair.`
  },
  {
    slug: "dts-60mm-radius-gate-wheels-v-profile",
    description: `V-profile 60mm wheels specifically for V-track sliding gate systems. The V-shape provides stable tracking.

Key Features:
- 60mm diameter
- V-profile for V-track
- Precision manufactured
- Long service life

For V-rail gate systems only.

Applications: V-track sliding gates.`
  }
];

async function updateDescriptions() {
  console.log("Starting remaining product description updates...\n");
  
  let updated = 0;
  let failed = 0;
  
  for (const item of remainingDescriptions) {
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
