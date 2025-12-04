import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

interface ProductDescription {
  slug: string;
  description: string;
}

const finalDescriptions: ProductDescription[] = [
  // Batteries
  {
    slug: "12v-1-4ah-battery",
    description: `Compact 12V 1.4Ah sealed lead-acid battery for smaller backup power applications. Ideal for alarm panels and small electronic devices.

Key Features:
- 12V 1.4Ah capacity
- Sealed lead-acid (SLA) construction
- Maintenance-free operation
- Compact dimensions
- Rechargeable

Perfect for alarm systems, small UPS units, and electronic equipment requiring reliable backup power.

Applications: Alarm panels, emergency lighting, small electronic devices.`
  },
  {
    slug: "12v-2-4ah",
    description: `Reliable 12V 2.4Ah battery providing increased capacity for medium-duty backup applications. Sealed design requires no maintenance.

Key Features:
- 12V 2.4Ah capacity
- Sealed lead-acid type
- Maintenance-free
- AGM technology
- Rechargeable

Suitable for larger alarm panels, access control systems, and devices requiring extended backup time.

Applications: Security systems, access control, small gate motor backup.`
  },
  {
    slug: "24v-3-5ah",
    description: `Specialized 24V 3.5Ah battery pack for equipment requiring higher voltage operation. Commonly used in industrial and automation applications.

Key Features:
- 24V nominal voltage
- 3.5Ah capacity
- Sealed construction
- Industrial-grade reliability
- Extended cycle life

Designed for 24V motor systems and industrial equipment.

Applications: Industrial automation, motor backup systems, 24V equipment.`
  },
  {
    slug: "dc-ups-12vdc-battery-backup",
    description: `Intelligent DC UPS system providing uninterrupted 12V power for critical security equipment. Features automatic switchover during power failures.

Key Features:
- 12V DC output
- Automatic mains/battery switching
- LED status indicators
- Charging circuit included
- Compact design

Essential for maintaining CCTV cameras, access control, and other security equipment during power outages.

Applications: CCTV systems, access control panels, routers, security equipment.

Note: Battery sold separately. Compatible with standard 12V SLA batteries.`
  },
  {
    slug: "12v-8ah-gel-battery",
    description: `Deep-cycle gel battery offering superior performance for gate motor applications. Gel technology provides longer life and better deep-discharge recovery.

Key Features:
- 12V 8Ah capacity
- Gel electrolyte technology
- Deep-cycle capable
- Extended lifespan
- Maintenance-free

Gel batteries outperform standard SLA in demanding applications with frequent discharge cycles.

Applications: Gate motors, solar systems, UPS backup.`
  },
  {
    slug: "12-8v-7ah-lithium-battery",
    description: `Premium lithium iron phosphate (LiFePO4) battery with 12.8V 7Ah capacity. Offers 4x longer lifespan than lead-acid alternatives.

Key Features:
- 12.8V nominal voltage
- 7Ah capacity
- LiFePO4 chemistry
- 2000+ charge cycles
- Built-in BMS protection
- Lightweight design
- 10+ year lifespan potential

The ultimate upgrade for gate motors and solar systems requiring reliable, long-lasting power.

Applications: Gate motors, solar backup, portable power stations.`
  },
  {
    slug: "gemini-12v-7-2ah-battery",
    description: `Genuine Gemini 12V 7.2Ah battery designed for Gemini gate motor systems. OEM specification ensures compatibility and optimal performance.

Key Features:
- Original Gemini specification
- 12V 7.2Ah capacity
- Sealed lead-acid
- Perfect fit for Gemini motors
- Maintenance-free

Using genuine Gemini batteries maintains warranty compliance and ensures proper charging.

Compatible with: Gemini Slider and other Gemini gate motor models.`
  },
  // CCTV Systems
  {
    slug: "10a-9-channel-cctv-power-supply-with-metal-casing",
    description: `Professional 9-channel CCTV power distribution unit delivering 10A total output. The metal housing provides protection and heat dissipation.

Key Features:
- 10A total output capacity
- 9 individual channels
- Metal enclosure for protection
- LED indicators per channel
- Fused outputs for safety

Centralized power solution for medium CCTV installations.

Applications: 8-9 camera installations, commercial surveillance systems.`
  },
  {
    slug: "12v-10a-9-channel-cctv-battery-backup",
    description: `Power supply with integrated battery backup for uninterrupted CCTV operation. Maintains recording during power outages.

Key Features:
- 12V 10A output
- 9 channels
- Battery backup function
- Automatic switchover
- LED status indicators

Ensures continuous surveillance during loadshedding and power failures.

Applications: Critical surveillance areas, 24/7 monitoring systems.`
  },
  {
    slug: "16-channel-advanced-cctv-camera-kit",
    description: `Complete 16-camera surveillance kit for large properties and commercial installations. Includes everything needed for a professional setup.

Kit Includes:
- 16-channel DVR
- 16 HD cameras (mix of bullet and dome)
- Power supplies
- Cables and connectors
- Storage HDD

Key Features:
- Full HD recording
- Remote viewing app
- Motion detection
- Night vision on all cameras

Applications: Large commercial buildings, estates, warehouses, factories.`
  },
  {
    slug: "20a-18-channel-cctv-power-supply-with-metal-casing",
    description: `High-capacity 18-channel CCTV power supply providing 20A total output. Designed for large surveillance installations.

Key Features:
- 20A total capacity
- 18 individual channels
- Heavy-duty metal housing
- Individual channel fusing
- LED indicators

Essential for large-scale CCTV deployments with many cameras.

Applications: Large commercial installations, industrial surveillance, estates.`
  },
  {
    slug: "305m-cat6-utp-copper-coated-ethernet-cable",
    description: `Full 305m box of CAT6 network cable for IP camera installations and networking. Copper-coated aluminum provides cost-effective performance.

Key Features:
- 305 meters (1000 feet)
- CAT6 rated
- Gigabit capable (10/100/1000 Mbps)
- 250MHz bandwidth
- Easy-pull box design

Ideal for IP camera installations and general networking.

Applications: IP CCTV systems, office networking, structured cabling.`
  },
  {
    slug: "4-channel-advanced-cctv-camera-kit",
    description: `Starter CCTV kit with 4 cameras perfect for small homes and businesses. Complete system ready for immediate installation.

Kit Includes:
- 4-channel DVR
- 4 HD cameras
- Power supply
- Cables
- Mobile app access

Applications: Small homes, shops, offices, storage areas.`
  },
  {
    slug: "8-channel-advanced-cctv-camera-kit",
    description: `Medium-sized surveillance kit with 8 cameras for comprehensive coverage. Ideal for larger homes and small commercial properties.

Kit Includes:
- 8-channel DVR
- 8 HD cameras (bullet/dome mix)
- Power supplies
- All cables and connectors
- Pre-installed storage

Applications: Medium homes, retail stores, small warehouses, office buildings.`
  },
  {
    slug: "andowl-q-a129-solar-wifi-security-camera",
    description: `Solar-powered WiFi camera requiring no external power or cables. Perfect for remote locations and areas without power access.

Key Features:
- Fully solar powered
- WiFi connectivity
- No wiring required
- Motion detection
- Night vision
- Smartphone app viewing

Ideal for properties without power infrastructure or during loadshedding.

Applications: Farm entrances, remote locations, holiday homes, driveways.`
  },
  {
    slug: "andowl-q-s4max-8k-wifi-security-camera",
    description: `Ultra-high resolution 8K WiFi camera for exceptional detail capture. Latest technology for demanding surveillance requirements.

Key Features:
- 8K resolution
- WiFi connectivity
- Advanced image sensor
- AI motion detection
- Night vision
- Cloud and local storage

The highest resolution available for residential surveillance.

Applications: High-security areas, license plate capture, facial recognition.`
  },
  {
    slug: "andowl-solar-smart-4g-camera-sim-card-powered-wireless-security",
    description: `4G cellular camera with solar power for locations without WiFi or power. Works anywhere with mobile network coverage.

Key Features:
- 4G/LTE connectivity
- Solar powered
- No WiFi needed
- SIM card slot
- Remote viewing app
- Battery backup

Perfect for remote farms, construction sites, and off-grid locations.

Applications: Farms, construction sites, remote properties, anywhere without WiFi.`
  },
  {
    slug: "balun-1-channel-utp-passive-video-transceiver-per-pair",
    description: `Passive video balun pair for transmitting CCTV video over CAT5e/CAT6 cable. Cost-effective alternative to coaxial cable.

Key Features:
- No power required
- Up to 500m transmission
- Compatible with HD cameras
- Screw terminal connection
- Built-in surge protection

Simplifies installation by using common network cable for video.

Applications: Long-distance CCTV runs, retrofit installations.

Package: Sold in pairs (1 sender, 1 receiver).`
  },
  {
    slug: "hilook-4-channel-turbo-hd-dvr-with-built-in-320gb-hdd",
    description: `Entry-level 4-channel DVR with 320GB storage included. Ready to record immediately.

Key Features:
- 4 camera channels
- 320GB HDD included
- Full HD recording
- Remote viewing
- H.265+ compression

Approximately 1 week recording at standard quality.

Applications: Small homes, starter systems, basic monitoring.`
  },
  {
    slug: "hilook-8-channel-turbo-hd-dvr",
    description: `8-channel DVR for medium surveillance systems. Supports Full HD cameras with efficient H.265+ compression.

Key Features:
- 8 camera channels
- Full HD 1080p recording
- H.265+ compression
- Remote app viewing
- Supports up to 6TB HDD

Storage sold separately.

Applications: Medium homes, small businesses, retail stores.`
  },
  {
    slug: "hikvision-16-channel-cctv-power-supply",
    description: `Professional 16-channel power distribution box for larger CCTV installations. Hikvision quality ensures reliable operation.

Key Features:
- 16 output channels
- Centralized power management
- LED indicators
- Fused protection
- Quality construction

Applications: 16-camera systems, commercial installations.`
  },
  {
    slug: "hikvision-4-channel-cctv-power-supply",
    description: `Compact 4-channel power supply for small CCTV systems. Reliable Hikvision quality for essential installations.

Key Features:
- 4 output channels
- Regulated 12V DC
- Fused outputs
- Compact design

Applications: 4-camera systems, home surveillance, small offices.`
  },
  {
    slug: "hikvision-8-channel-cctv-power-supply",
    description: `8-channel power distribution unit providing stable 12V DC to multiple cameras. Perfect for medium installations.

Key Features:
- 8 output channels
- Stable voltage output
- LED power indicator
- Individual fusing

Applications: 8-camera systems, medium commercial CCTV.`
  },
  {
    slug: "hilook-2mp-full-colour-vu-bullet-camera",
    description: `Full-color night vision bullet camera using ColorVu technology. Captures color video 24/7 regardless of lighting conditions.

Key Features:
- ColorVu technology
- 2MP Full HD
- Full color day and night
- IP67 weatherproof
- Built-in lighting

Never miss details with color footage at all times.

Applications: Parking areas, building perimeters, high-value zones.`
  },
  {
    slug: "hilook-2mp-hybrid-dual-light-camera",
    description: `Advanced hybrid camera combining IR and visible light for optimal night vision. Automatically switches between modes for best image quality.

Key Features:
- Dual light technology
- Smart mode switching
- 2MP Full HD
- Enhanced night vision
- IP67 rated

Intelligent switching provides the best possible image in any lighting condition.

Applications: Areas with variable lighting, entrances, outdoor monitoring.`
  },
  {
    slug: "rg59-cctv-cable-with-power-pair-100-m",
    description: `Combined video and power cable for efficient CCTV installations. Run one cable for both video signal and camera power.

Key Features:
- 100 meter roll
- RG59 coaxial for video
- 18AWG power wires
- Quality shielding
- Pre-packaged drum

Simplifies installation by combining video and power in one run.

Applications: Standard CCTV camera installations, retrofit systems.`
  },
  // Garage Door Parts
  {
    slug: "cable-drum-left",
    description: `Left-side cable drum for torsion spring garage door systems. Precision-engineered for even cable winding and balanced door operation.

Key Features:
- For left side installation
- Heavy-duty cast aluminum
- Precision cable grooves
- Balanced door operation
- Standard fitting

Essential component for garage door cable systems.

Applications: Sectional garage doors with torsion spring systems.`
  },
  {
    slug: "cable-drum-right",
    description: `Right-side cable drum for garage door torsion systems. Pairs with left drum for complete balanced operation.

Key Features:
- For right side installation
- Cast aluminum construction
- Precise cable tracking
- Standard dimensions

Always replace drums in pairs for optimal performance.

Applications: Torsion spring garage door systems.`
  },
  {
    slug: "centre-bearing-middle",
    description: `Central support bearing for torsion spring shafts. Provides stable rotation point for smooth door operation.

Key Features:
- Heavy-duty construction
- Supports torsion shaft
- Even load distribution
- Standard mounting

Essential for doors with long torsion shafts requiring center support.

Applications: Wide garage doors, commercial installations.`
  },
  {
    slug: "double-side-bearing-left",
    description: `Left-side bearing for garage door spring systems. Provides smooth shaft rotation and load support.

Key Features:
- Left side fitting
- Heavy-duty steel
- Smooth rotation
- Long service life

Quality bearings ensure quiet, reliable operation.

Applications: Sectional garage doors, torsion spring systems.`
  },
  {
    slug: "double-side-bearing-right",
    description: `Right-side bearing completing the bearing set for garage door systems. Matches left bearing for balanced operation.

Key Features:
- Right side fitting
- Matches left bearing
- Heavy-duty construction
- Standard dimensions

Replace bearings in pairs for even wear.

Applications: Garage door spring shaft support.`
  },
  {
    slug: "garage-door-steel-hinge-no-1",
    description: `First-position hinge connecting panels 1 and 2 of sectional garage doors. Heavy-duty steel construction for reliable performance.

Key Features:
- Hinge position No. 1
- Heavy-duty steel
- Smooth pivot action
- Standard mounting holes

Each panel joint requires the correct numbered hinge.

Applications: Sectional garage door panel connections.`
  },
  {
    slug: "garage-door-steel-hinge-no-2",
    description: `Second-position hinge for panels 2 and 3 of sectional doors. Precision engineered for proper alignment.

Key Features:
- Hinge position No. 2
- Steel construction
- Reliable pivot
- Standard installation

Correct hinge positioning ensures proper door folding.

Applications: Sectional garage doors.`
  },
  {
    slug: "garage-door-steel-hinge-no-3",
    description: `Third-position hinge connecting panels 3 and 4. Maintains smooth door operation through the bend.

Key Features:
- Hinge position No. 3
- Heavy-duty steel
- Precision alignment
- Long-lasting durability

Applications: Sectional garage door panel connections.`
  },
  {
    slug: "garage-door-steel-hinge-no-4",
    description: `Fourth-position hinge for panels 4 and 5. Ensures proper panel folding as door moves through track.

Key Features:
- Hinge position No. 4
- Steel construction
- Smooth articulation
- Standard fitting

Applications: Sectional garage doors with 5+ panels.`
  },
  {
    slug: "garage-door-steel-hinge-no-5",
    description: `Fifth-position hinge for panels 5 and 6. Required for taller sectional doors.

Key Features:
- Hinge position No. 5
- Heavy-duty construction
- Precision fit
- Reliable operation

Applications: Tall sectional garage doors.`
  },
  {
    slug: "garage-door-steel-hinge-no-6",
    description: `Sixth-position hinge for panels 6 and 7 on extra-tall sectional doors.

Key Features:
- Hinge position No. 6
- Steel durability
- Smooth pivot
- Commercial grade

Applications: Extra-tall sectional doors, commercial installations.`
  },
  {
    slug: "glosteel-garage-door-african-cream",
    description: `Premium Glosteel sectional garage door in elegant African Cream finish. South African quality with attractive natural color.

Key Features:
- African Cream color
- Sectional design
- High-quality steel panels
- Insulated construction
- Multiple size options

Available Sizes:
- 2450mm standard
- 2755mm
- 3055mm
- Custom sizes available

The warm cream finish complements both modern and traditional architecture.

Applications: Residential homes, estates, townhouse complexes.`
  },
  {
    slug: "glosteel-garage-door",
    description: `Modern Glosteel sectional door in sophisticated Charcoal Grey. Contemporary finish popular for modern home designs.

Key Features:
- Charcoal Grey finish
- Premium steel construction
- Sectional operation
- Insulated panels
- Durable coating

Available in standard and custom sizes to fit your opening.

Applications: Modern homes, contemporary architecture, commercial properties.`
  },
  {
    slug: "glosteel-garage-door-safari-brown",
    description: `Classic Safari Brown Glosteel door providing warm, natural aesthetics. The brown finish blends with traditional South African home styles.

Key Features:
- Safari Brown color
- Steel sectional panels
- Weather-resistant finish
- Multiple sizes
- Quality construction

Pairs beautifully with face brick and natural stone facades.

Applications: Traditional homes, bush lodges, game farms.`
  },
  {
    slug: "lifting-cables-tension",
    description: `High-strength lifting cables for tension-style garage door systems. Rated for repeated cycling under load.

Key Features:
- High tensile strength
- Galvanized construction
- Corrosion resistant
- Proper length for standard doors

Replace cables in pairs to maintain balanced operation.

Applications: Extension spring garage door systems.`
  },
  {
    slug: "lifting-cables-torsion",
    description: `Premium lifting cables for torsion spring garage doors. Engineered for smooth winding on cable drums.

Key Features:
- Torsion system compatible
- High-strength steel
- Proper drum winding
- Galvanized protection

Essential for safe torsion spring door operation.

Applications: Torsion spring garage door systems.`
  },
  {
    slug: "nylon-roller-heavy-duty",
    description: `Ultra-quiet nylon garage door roller with steel stem. Eliminates the noise of metal rollers.

Key Features:
- Nylon wheel for quiet operation
- Steel stem durability
- Reduces friction
- Long service life
- Fits standard tracks

Ideal upgrade for noisy metal rollers.

Applications: All sectional garage doors.`
  },
  {
    slug: "pulley-track-mount-for-garage-door",
    description: `Track-mounted pulley for extension spring cable systems. Guides lifting cables for smooth door operation.

Key Features:
- Track mounting design
- Smooth rotation
- Steel construction
- Standard fitting

Essential component for cable routing in extension spring systems.

Applications: Extension spring garage door systems.`
  },
  {
    slug: "top-roller-bracket-large",
    description: `Heavy-duty top roller bracket for large sectional garage doors. Supports rollers at the top panel corners.

Key Features:
- Heavy-duty steel
- Large door compatible
- Standard mounting
- Roller included

Essential for proper top panel support and tracking.

Applications: Large residential and commercial garage doors.`
  },
  // More Electric Fencing
  {
    slug: "nemtek-6mm-electric-fence-line-clamp",
    description: `Secure 6mm line clamp for electric fence wire connections. Creates reliable joints without affecting conductivity.

Key Features:
- 6mm wire compatibility
- Secure clamping
- Maintains conductivity
- Weather resistant

Use for joining fence wires and creating connections.

Applications: Wire splicing, fence repairs, new installations.`
  },
  {
    slug: "nemtek-6mm-electric-fence-line-clamps-50-pack",
    description: `Bulk pack of 50 line clamps for professional installers. Same reliable 6mm clamps in quantity.

Key Features:
- 50 clamps per pack
- 6mm wire size
- Contractor quantity
- Consistent quality

Enough for multiple fence installations or comprehensive repairs.

Applications: Professional installations, large projects.`
  },
  {
    slug: "nemtek-braided-stainless-steel-wire-304-1-2mm-800m-roll",
    description: `Premium 304 stainless steel braided wire for maximum conductivity and corrosion resistance. The ultimate fence wire for harsh environments.

Key Features:
- 304 stainless steel
- Braided construction
- 1.2mm diameter
- 800 meter roll
- Maximum conductivity
- Corrosion proof

Ideal for coastal areas and high-corrosion environments.

Applications: Coastal properties, industrial installations, premium residential.`
  },
  {
    slug: "nemtek-coach-screws-8x75mm-with-plugs-50-pack",
    description: `Heavy-duty coach screws with wall plugs for secure bracket mounting. 50-pack for professional installations.

Key Features:
- 8x75mm size
- Includes wall plugs
- Heavy-duty holding
- 50 sets per pack

For mounting heavy fence brackets to masonry.

Applications: Heavy bracket installation, energizer mounting.`
  },
  {
    slug: "nemtek-compression-spring-1-silver-5kg-black",
    description: `Single 5kg compression spring for electric fence tensioning. Maintains consistent wire tension in varying temperatures.

Key Features:
- 5kg tension rating
- Silver spring with black coating
- Galvanized steel
- Temperature compensating

Sold individually for repairs and small projects.

Applications: Residential fences, wire tensioning, repairs.`
  },
  {
    slug: "nemtek-electric-fence-warning-sign",
    description: `Official Nemtek electric fence warning sign meeting South African safety regulations. UV-resistant construction for long outdoor life.

Key Features:
- Nemtek branding
- Yellow high-visibility
- UV-resistant plastic
- Multilingual text
- Required by law

Install at regular intervals and all access points.

Applications: All electric fence installations (legally required).`
  },
  {
    slug: "nemtek-electric-fencing-double-pole-lightning-diverter",
    description: `Two-pole lightning protection for electric fence systems. Diverts lightning strikes away from energizer to protect equipment.

Key Features:
- Double pole protection
- Lightning surge diversion
- Protects energizer
- Easy installation

Essential protection for areas prone to lightning storms.

Applications: All electric fence installations in lightning-prone areas.`
  },
  {
    slug: "nemtek-energizer-magnetic-tag-with-holder",
    description: `Magnetic arming key for compatible Nemtek energizers. Provides secure on/off control without codes or switches.

Key Features:
- Magnetic activation
- Includes holder
- Secure arming control
- Quick access

Convenient alternative to keypad codes for trusted personnel.

Applications: Gate guard points, service access, maintenance.`
  },
  {
    slug: "nemtek-ht-cable-slimline-100m-black-copy",
    description: `High-tension fence cable in 100m roll for connecting energizer to fence. Black slimline design for discreet installation.

Key Features:
- 100 meter roll
- High-voltage rated
- Black UV-resistant sheath
- Slimline profile

Connects energizer to fence lines and between zones.

Applications: Energizer to fence connections, underground runs.`
  },
  {
    slug: "nemtek-ht-cable-slimline-30m-black",
    description: `Compact 30m roll of HT cable for smaller installations and repairs. Same quality as larger rolls.

Key Features:
- 30 meter roll
- High-voltage insulation
- Black finish
- Slimline design

Perfect for small installations or as backup stock.

Applications: Small fence systems, repairs, additions.`
  },
  {
    slug: "nemtek-ht-cable-slimline-50m-black",
    description: `Medium 50m roll of high-tension cable for typical residential installations.

Key Features:
- 50 meter roll
- HV insulation
- UV-resistant sheath
- Flexible installation

Right size for most home fence installations.

Applications: Residential installations, medium projects.`
  },
  {
    slug: "nemtek-hybrid-compression-spring-2-8kg-gold-black",
    description: `Single 8kg hybrid spring combining tensioner and compression spring. Gold series for enhanced durability.

Key Features:
- 8kg tension rating
- Hybrid tensioner design
- Gold premium series
- Adjustable tension

For heavier-duty fence lines and longer runs.

Applications: Commercial fences, long runs, heavy tension.`
  },
  {
    slug: "nemtek-merlin-m18s-single-zone-electric-fence-energizer-8-joule",
    description: `Powerful 8 Joule single-zone energizer for medium to large fence installations. The Nemtek Merlin delivers reliable performance.

Key Features:
- 8 Joule output
- Single zone monitoring
- LCD display
- Tamper detection
- Alarm outputs
- Remote arm/disarm

Suitable for fence lines up to 16km depending on conditions.

Applications: Large residential, commercial, agricultural fencing.`
  },
  {
    slug: "nemtek-original-ht-cable-100m-black-single-core",
    description: `Original Nemtek HT cable in 100m rolls. Single core construction for standard installations.

Key Features:
- 100 meter roll
- Original Nemtek quality
- Single core
- Black insulation

Industry-standard high-tension cable for energizer connections.

Applications: Standard fence installations, underground runs.`
  },
  {
    slug: "nemtek-sliding-gate-contact-bracket-heavy-duty-electric-fence-fitting",
    description: `Heavy-duty bracket for sliding gate electrical contacts. Provides reliable fence continuity through sliding gates.

Key Features:
- Heavy-duty construction
- For sliding gates
- Maintains fence power
- Weather resistant

Essential for integrating sliding gates with electric fences.

Applications: Sliding gate installations with electric fence.`
  },
  {
    slug: "nemtek-sliding-gate-contact-in-line-3-way",
    description: `3-way gate contact for complex gate configurations. Routes fence power through multiple paths.

Key Features:
- 3-way connection
- In-line mounting
- Sliding gate compatible
- Quality construction

For gates requiring multiple wire connections.

Applications: Complex gate setups, multi-wire gates.`
  },
  {
    slug: "nemtek-stealth-m28s-dual-zone-electric-fence-energizer-15-joule",
    description: `Professional 15 Joule dual-zone energizer for maximum security installations. The Nemtek Stealth provides independent monitoring of two fence zones.

Key Features:
- 15 Joule maximum output
- Dual zone monitoring
- Independent zone alarms
- LCD status display
- Multiple alarm outputs
- Advanced diagnostics

Ideal for properties requiring separate monitoring of different perimeter sections.

Applications: Estates, commercial properties, industrial sites with multiple perimeters.`
  },
  {
    slug: "nemtek-wizord-4i-electric-fence-energizer-4-joule",
    description: `Entry-level 4 Joule energizer perfect for residential and small commercial installations. The Wizord 4i offers reliable protection at an affordable price.

Key Features:
- 4 Joule output
- Single zone
- LED status indicators
- Alarm output
- 12V DC operation

Covers fence lines up to 8km in ideal conditions.

Applications: Residential homes, small businesses, starter installations.`
  },
  {
    slug: "stainless-steel-tension-spring-with-limiter",
    description: `Premium stainless steel spring with built-in limiter preventing over-tensioning. Sold individually.

Key Features:
- 304 stainless steel
- Integrated limiter
- Prevents wire damage
- Corrosion proof

Ideal for replacements and small projects.

Applications: Premium installations, coastal areas, repairs.`
  },
  {
    slug: "tt-d-bottom-bracket",
    description: `Left-side bottom roller bracket for sectional garage doors. Heavy-duty construction for reliable door operation.

Note: This is a garage door part, not electric fencing.

Key Features:
- Left side fitting
- Heavy-duty steel
- Supports bottom roller
- Standard mounting

Applications: Sectional garage door repair and installation.`
  },
  {
    slug: "tt-d-bottom-bracket-right",
    description: `Right-side bottom roller bracket matching the left bracket for complete installation.

Note: This is a garage door part, not electric fencing.

Key Features:
- Right side fitting
- Pairs with left bracket
- Heavy-duty steel
- Standard dimensions

Always replace bottom brackets in pairs for even wear.

Applications: Sectional garage doors.`
  },
  {
    slug: "tek-screws-12x25mm-100-pack",
    description: `Self-drilling tek screws for mounting fence brackets to steel. No pre-drilling required.

Key Features:
- 12x25mm size
- Self-drilling tip
- 100 screws per pack
- For thin steel mounting

Quick installation on steel surfaces.

Applications: Bracket mounting to steel frames, fencing on metal structures.`
  },
  {
    slug: "tek-screws-12x38mm-100",
    description: `Medium-length tek screws for thicker steel applications. Self-drilling for fast installation.

Key Features:
- 12x38mm length
- Self-drilling
- 100 per pack
- Thicker material capability

For mounting to structural steel and thicker metal.

Applications: Heavy bracket installation, industrial mounting.`
  },
  {
    slug: "tek-screws-12x65mm-100-pack",
    description: `Long tek screws for deep penetration into wood or thick steel. Self-drilling convenience in longer length.

Key Features:
- 12x65mm length
- Self-drilling
- 100 screws
- Maximum holding power

For mounting through thick materials or deep wood penetration.

Applications: Wood post mounting, thick steel brackets.`
  },
  // More Gate Motors and Accessories
  {
    slug: "gemini-slider-12v-7ah-full-kit-complete-gate-automation-solution",
    description: `Complete Gemini Slider gate motor kit including all components for installation. 12V 7Ah system with battery included.

Kit Includes:
- Gemini Slider motor
- 12V 7Ah battery
- Mounting bracket
- Remote control
- Installation hardware

Ready to install with everything needed for a complete gate automation.

Applications: Residential sliding gates up to 500kg.`
  },
  {
    slug: "gemini-gemlink-smart-device",
    description: `Smart connectivity device enabling app control for compatible Gemini gate motors. Control your gate from anywhere.

Key Features:
- Smartphone app control
- WiFi connectivity
- Works with Gemini motors
- Remote monitoring
- Access management

Add smart home functionality to your Gemini automation.

Applications: Existing Gemini gate motor upgrades, smart home integration.`
  },
  {
    slug: "gemini-hex-coupling-and-disc",
    description: `Replacement hex coupling and disc for Gemini gate motors. Essential component for motor-to-gearbox connection.

Key Features:
- OEM replacement part
- Proper fit guaranteed
- Quality construction
- Easy installation

Maintains proper power transmission from motor to gate.

Applications: Gemini gate motor repair and maintenance.`
  },
  {
    slug: "gemini-pcb-v-90",
    description: `Replacement control board (PCB) for Gemini gate motors version V.90. Restores full motor functionality.

Key Features:
- V.90 version compatibility
- Original specification
- Complete control functions
- Direct replacement

Use genuine parts for reliable operation.

Applications: Gemini motor repair, control board replacement.`
  },
  {
    slug: "centurion-d5-cp80-pcb",
    description: `Legacy CP80 control board for older Centurion D5 gate motors. Maintains operation of classic installations.

Note: This is a discontinued item for older systems.

Key Features:
- CP80 version
- For older D5 motors
- Full control functionality
- While stocks last

Essential for maintaining legacy D5 installations.

Applications: Older Centurion D5 motor repair.`
  },
  {
    slug: "gemini-steel-rack-2m",
    description: `2-meter galvanized steel rack for sliding gate automation. Meshes with motor pinion for gate movement.

Key Features:
- 2 meter length
- Galvanized steel
- Standard tooth pitch
- Quality construction

Install sufficient rack to cover full gate travel plus overlap.

Applications: All sliding gate motor installations.`
  },
  {
    slug: "centurion-photon-wireless-beams",
    description: `Wireless safety beams eliminating cable runs between gate posts. Ideal for retrofits and new installations.

Key Features:
- Wireless operation
- No trenching required
- Safety detection
- Easy installation
- Battery operated

Perfect when cable installation is impractical.

Applications: Gate safety, retrofit installations, difficult cable routes.`
  },
  {
    slug: "sentry-safety-wireless-gate-beams",
    description: `Sentry wireless safety beam system for gate obstruction detection. Prevents gate closure on vehicles and people.

Key Features:
- Wireless transmission
- Safety beam detection
- Prevents accidents
- Quick installation

Essential safety feature for all automated gates.

Applications: Gate motor safety systems, commercial entrances.`
  },
  {
    slug: "gemini-power-supply-12v-solar-compatible",
    description: `Versatile 12V power supply compatible with both mains and solar input. Powers Gemini motors from multiple sources.

Key Features:
- 12V DC output
- Mains power compatible
- Solar panel ready
- Battery charging
- Gemini compatible

Flexible power solution for various installation scenarios.

Applications: Gemini gate motors, solar installations, hybrid power systems.`
  },
  {
    slug: "gemini-anti-theft-bracket",
    description: `Security bracket protecting Gemini motor from theft and vandalism. Heavy-duty construction deters tampering.

Key Features:
- Heavy-duty steel
- Tamper resistant
- Easy installation
- Fits Gemini motors

Additional security for high-risk areas.

Applications: High-crime areas, commercial installations.`
  },
  {
    slug: "gemini-pcb-v-90-gemlink-smart-device",
    description: `Bundle combining Gemini V.90 PCB with Gemlink smart device. Complete upgrade for control and connectivity.

Package Includes:
- Gemini PCB V.90
- Gemlink smart device

Upgrade older Gemini motors with new control board and smartphone connectivity.

Applications: Gemini motor upgrades, smart home integration.`
  },
  {
    slug: "dts-60mm-radius-gate-wheels",
    description: `60mm gate wheels for sliding gate tracks. DTS quality ensures smooth, quiet operation.

Key Features:
- 60mm diameter
- Standard track fit
- Smooth rolling
- Durable construction

Replacement wheels restore smooth gate travel.

Applications: Sliding gate repair and maintenance.`
  },
  {
    slug: "dts-60mm-radius-gate-wheels-v-profile",
    description: `V-profile 60mm wheels for V-track sliding gates. The V shape provides stable tracking on V-rail systems.

Key Features:
- 60mm diameter
- V-profile design
- For V-track rails
- Stable operation

Specifically for V-track gate installations.

Applications: V-track sliding gate systems.`
  },
  {
    slug: "vector-vantage-cable-per-meter",
    description: `Multi-core cable for Centurion Vector and Vantage systems. Sold per meter for precise length ordering.

Key Features:
- Per meter pricing
- Multi-core construction
- Power and control signals
- Quality insulation

Order exact length needed for your installation.

Applications: Centurion Vector/Vantage installations, motor connections.`
  },
  {
    slug: "pcb-shaft-encoder",
    description: `Position feedback encoder providing accurate gate position sensing. Essential for precise motor control.

Key Features:
- Accurate position feedback
- Motor control integration
- Standard fitting
- Reliable operation

Enables accurate gate positioning and limit detection.

Applications: Gate motor systems requiring position feedback.`
  },
  // Intercom
  {
    slug: "e-t-nice-colour-video-intercom-gate-station",
    description: `Weatherproof gate station with color camera for E.T Nice video intercom systems. Clear video and audio communication.

Key Features:
- Color camera
- Weatherproof housing
- Audio and video
- Night vision
- Vandal resistant

See and speak with visitors before granting access.

Applications: Residential and commercial entrance points.`
  },
  {
    slug: "e-t-nice-7-monitor-only",
    description: `7-inch color monitor for E.T Nice video intercom systems. Clear display for visitor identification.

Key Features:
- 7 inch screen
- Color display
- Audio communication
- Gate release button
- Wall mount design

Pairs with E.T Nice gate station for complete system.

Applications: Indoor video intercom stations.`
  },
  // Garage Motors continued
  {
    slug: "e-t-drive-500-gate-motor-kit",
    description: `Complete sliding gate kit including E.T Drive 500 motor and all installation components.

Kit Includes:
- E.T Drive 500 motor
- Steel rack (4m)
- Battery
- Installation hardware
- Remote control

Everything needed for complete gate automation.

Applications: Residential gates up to 500kg.`
  },
  {
    slug: "elev8tor-4-button-garage-door-remote",
    description: `4-button remote for Elev8tor garage door systems. Control up to 4 different doors or automation systems.

Key Features:
- 4 channels
- Rolling code security
- Elev8tor compatible
- Compact design

Convenient multi-door control from one remote.

Applications: Multi-garage properties, mixed automation systems.`
  },
  {
    slug: "eazylift-garage-door-remote-4-button",
    description: `Multi-channel remote for Eazylift garage door openers. Controls up to 4 garage doors or gates.

Key Features:
- 4 button operation
- Code hopping security
- Eazylift compatible
- Easy programming

Versatile control for properties with multiple automated doors.

Applications: Eazylift systems, multi-door properties.`
  },
  // CCTV
  {
    slug: "bnc-male-screw-type-connector",
    description: `Tool-free BNC connector with screw-on design. No crimping required for quick installations and repairs.

Key Features:
- Screw-on installation
- No tools needed
- RG59/RG6 compatible
- Reliable connection

Perfect for field repairs and quick installations.

Applications: CCTV cable termination, repairs, temporary setups.`
  },
  {
    slug: "bnc-connector-crimp-type-for-rg59-2x-in-a-pack",
    description: `Professional crimp-type BNC connectors for RG59 cable. Pack of 2 for camera and DVR ends.

Key Features:
- Crimp installation
- RG59 compatible
- 75 ohm impedance
- 2 connectors per pack

Clean, reliable connections for permanent installations.

Applications: Professional CCTV installations.`
  },
  {
    slug: "network-cable-1000cm-cat6",
    description: `10-meter CAT6 network cable for IP camera and networking connections. Ready-made with RJ45 connectors.

Key Features:
- 10 meter length (1000cm)
- CAT6 rated
- Pre-terminated
- Gigabit capable

Convenient pre-made cable for quick connections.

Applications: IP cameras, network equipment, router connections.`
  },
  {
    slug: "100x100x70-mm-waterproof-pvc-electrical-junction-box",
    description: `Weatherproof junction box for outdoor electrical connections. IP65 rated for protection against water and dust.

Key Features:
- 100x100x70mm size
- IP65 waterproof
- PVC construction
- Multiple cable entries

Essential for outdoor CCTV, lighting, and gate motor connections.

Applications: Outdoor electrical connections, CCTV installations, gate motors.`
  },
  {
    slug: "wood-hinge-screws-85-in-a-pack",
    description: `Pack of 85 wood screws for garage door hinge installation. Correct size for standard hinge mounting.

Key Features:
- 85 screws per pack
- Hinge mounting size
- Wood compatible
- Enough for multiple hinges

Replacement screws for garage door maintenance.

Applications: Garage door hinge installation and repair.`
  },
  {
    slug: "pulley-spring-mount-for-garage-doors",
    description: `Spring-mounted pulley assembly for extension spring garage door systems. Provides proper cable routing.

Key Features:
- Spring mounting
- Cable guidance
- Smooth operation
- Standard fitting

Essential component for extension spring door systems.

Applications: Extension spring garage door cable routing.`
  }
];

async function updateDescriptions() {
  console.log("Starting final product description updates...\n");
  
  let updated = 0;
  let failed = 0;
  
  for (const item of finalDescriptions) {
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
