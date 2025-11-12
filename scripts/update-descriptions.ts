import { db } from "../server/db";
import { products } from "../shared/schema";
import { eq } from "drizzle-orm";

// Full product descriptions matching old alectra.co.za website
const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  // Solar & CCTV
  "4k-solar-powered-security-camera": "Experience next-level home and business security with the 4K Solar Powered Security Camera with WiFi and Night Vision. Designed for effortless protection, this camera combines crystal-clear 4K ultra high-definition video with the convenience of solar power, ensuring continuous operation without the need for constant charging or complicated wiring. Equipped with advanced night vision technology, this camera captures sharp, detailed footage even in complete darkness, giving you peace of mind 24 hours a day. Its built-in WiFi allows for real-time monitoring from your smartphone, tablet, or computer, no matter where you are.",
  
  // Batteries
  "12v-1-4ah-battery": "Reliable 12V 1.4Ah sealed lead-acid battery perfect for backup power supplies, alarm systems, gate motors, UPS devices, and more. This maintenance-free battery ensures consistent performance and long service life.",
  "12v-7ah": "The 12V 7Ah battery is the go-to power source for reliable and consistent performance in critical systems. Built with sealed lead-acid (SLA) technology, this maintenance-free battery is perfect for backup power supplies, alarm systems, gate motors, UPS devices, emergency lighting, and more.",
  "12v-7ah-lithium-battery": "Advanced 12V 8Ah lithium battery offering superior performance and longer lifespan compared to traditional lead-acid batteries. Lightweight, maintenance-free design with faster charging times. Perfect for gate motors, solar systems, and security applications.",
  "12v-2-4ah": "High-capacity 12V 2.4Ah sealed lead-acid battery designed for extended run times in gate motors, alarm systems, and backup power applications. This maintenance-free battery provides reliable performance with excellent charge retention.",
  "24v-3-5ah": "High-performance 24V 3.5Ah battery specifically designed for gate and garage motors requiring 24-volt power systems. Perfect for heavy-duty gate motors and commercial installations. Features maintenance-free operation and long service life.",
  "centurion-12v-7-2ah-battery": "Centurion Gate Motor Battery 12V 7.2Ah CP4C2-28W designed specifically for Centurion gate motor systems. This genuine replacement battery ensures optimal compatibility and performance with your gate automation system.",
  "12v-8ah-gel-battery": "Gate Motor Gel Battery 12V 8Ah featuring advanced gel cell technology for superior performance and longevity. Ideal for gate motors, solar systems, and security applications. Gel technology provides better performance in high-temperature conditions.",
  "gemini-12v-7-2ah-battery": "Gemini Gate Motor Battery 12V 7.2Ah designed for reliable backup power in Gemini gate automation systems. This battery ensures your gate continues to operate during power failures and load shedding.",
  
  // LP Gas
  "9kg-exchange": "9kg LP Gas Exchange/Refill service for home and commercial use. Convenient gas bottle exchange for cooking, heating, and other household applications. Safe and reliable propane gas supply suitable for stoves, geysers, and space heaters.",
  "19kg-exchange": "19kg LP Gas Exchange/Refill service perfect for medium to large households and businesses. Ideal for extended cooking needs, commercial kitchens, and heating applications.",
  "48kg-exchange": "48kg LP Gas Exchange/Refill for commercial and industrial applications. Industrial-grade gas cylinder for heavy-use commercial kitchens, manufacturing, and business operations.",
  
  // Centurion Gate Motors
  "centurion-d3-smart-gate-motor": "Centurion D3 Smart Gate Motor with advanced features and smart home integration capabilities. This sliding gate motor offers reliable automation for gates up to 400kg. Features include adjustable speeds, obstacle detection, battery backup support, and app compatibility.",
  "centurion-d5-evo-smart-gate-motor": "Advanced Centurion D5 Evo Smart Gate Motor designed for gates up to 500kg. This premium motor features enhanced power and reliability for larger residential and light commercial applications with smart technology integration.",
  "centurion-d10-smart-turbo-gate-motor": "High-performance Centurion D10 Smart Turbo Gate Motor engineered for heavy-duty applications and gates up to 1000kg. This industrial-grade motor delivers exceptional power and reliability for demanding commercial installations.",
  "centurion-d2-sliding-gate-motor": "Centurion D2 sliding gate motor - discontinued model that served as a reliable automation solution for residential sliding gates up to 400kg. While discontinued, replacement parts and service support may still be available.",
  "centurion-d3-smart-motor-only": "Complete Centurion D3 Smart Gate Motor Kit with all essential components for gate automation. Designed for gates up to 400kg with smart technology integration and battery backup ready configuration.",
  "centurion-d3-smart-full-kit-no-anti-theft-bracket": "Centurion D3 Smart Full Kit without anti-theft bracket, including motor, rack, battery, and remote controls. This comprehensive kit provides everything needed for professional gate automation except the anti-theft bracket.",
  "centurion-d3-smart-full-kit-advanced-gate-automation-solution-1": "Complete Centurion D3 Smart gate automation solution with all accessories for professional installation. This premium full kit includes motor, steel rack, battery, remotes, safety beams, and anti-theft bracket.",
  "centurion-d5-evo-smart-motor-only": "Centurion D5 Evo Smart motor kit with essential components for gate automation up to 500kg. Features enhanced power delivery, smart technology integration, and compatibility with full Centurion accessory range.",
  "centurion-d5-evo-smart-full-kit-advanced-gate-automation-solution-copy": "Full Centurion D5 EVO Smart kit without anti-theft bracket for gates up to 500kg. This comprehensive package includes motor, steel rack, battery, remote controls, and safety accessories.",
  "centurion-d3-smart-full-kit-advanced-gate-automation-solution": "Premium Centurion D5 Evo Smart full automation kit with all accessories including anti-theft bracket. Complete system for professional gate automation up to 500kg with smart home integration.",
  "centurion-d5-evo-sliding-gate-motor": "Discontinued Centurion D5 Evo sliding gate motor model that provided reliable automation for residential gates up to 500kg. Superseded by the D5 Evo Smart model with enhanced features.",
  "centurion-d5-evo-full-kit": "Complete D5 EVO kit - discontinued model that included motor, rack, battery, and accessories for gates up to 500kg. While no longer in production, it remains a reliable system with available service support.",
  "centurion-d5-evo-main-cover": "Replacement main cover for Centurion D5 Evo gate motors. This genuine Centurion part protects the motor electronics from weather and environmental damage.",
  "centurion-d5-d6-smart-anti-theft": "Centurion D5 Evo Anti-Theft Bracket - discontinued security accessory for D5 Evo gate motors. This bracket provided additional security by making motor removal more difficult.",
  "centurion-d5-cp80-pcb": "Discontinued CP80 PCB replacement control board for D5 motors. Essential for maintaining older D5 motor installations.",
  
  // Centurion Parts & Accessories
  "centurion-d3-smart-pcb-12v": "Replacement control board for Centurion D3 Smart gate motors. This genuine 12V PCB is the main electronic control system managing motor operations, safety features, and smart technology integration.",
  "centurion-d3-d5-evo-smart-d6-smart-base-plate": "Universal base plate compatible with Centurion D3, D5 EVO, and D6 Smart gate motors. Provides stable installation foundation for proper motor alignment and operation.",
  "centurion-d3-d5-evo-smart-anti-theft-bracket": "Anti-theft security bracket for Centurion D3 and D5 EVO Smart motors. This heavy-duty bracket makes unauthorized motor removal extremely difficult.",
  "centurion-d10-smart-base-plate": "Base plate specifically designed for Centurion D10 Smart gate motors. Essential for proper alignment and secure mounting of industrial-grade gate automation.",
  "centurion-d10-pcb-v2": "Version 2 circuit board for Centurion D10 gate motors. This upgraded PCB features enhanced control systems and improved reliability for heavy-duty gate automation.",
  "centurion-d10-charger": "24V charger specifically designed for Centurion D10 gate motor power supply and battery charging. Ensures optimal charging performance and battery longevity.",
  "centurion-gate-motor-nylon-rack-2m": "2-meter nylon rack for quiet sliding gate operation with Centurion motors. Durable construction resists wear and requires minimal maintenance. Easy to install and cut to required length.",
  "centurion-gate-motor-door-and-key": "Replacement door and key set for Centurion gate motors. Provides secure access to motor controls and battery compartment.",
  
  // Centurion Vantage Swing Gates
  "centurion-vantage-400-gate-motor": "Centurion Vantage 400 swing gate motor designed for residential swing gate automation. Suitable for gates up to 400kg per leaf with reliable articulated arm operation.",
  "centurion-vantage-500-gate-motor": "Heavy-duty Vantage 500 swing gate motor for large swing gates up to 500kg per leaf. Features enhanced power delivery, adjustable force control, and comprehensive safety features.",
  "centurion-vantage-400-500-smart-pcb": "Smart PCB circuit board compatible with Vantage 400/500 swing gate motors. Enables app control, remote monitoring, and integration with smart home systems.",
  
  // Centurion Intercoms
  "centurion-g-speak-ultra-4-button": "Centurion G-Speak Ultra 4-button intercom system for gate access control. Features clear audio quality and weather-resistant construction. Integrates seamlessly with Centurion gate motors.",
  "centurion-g-speak-ultra": "Complete Centurion G-Speak Ultra intercom system for gate communication and access control. Provides clear two-way audio communication with weather-proof construction.",
  "centurion-g-speak-ultra-upgrade-kit": "Upgrade kit for existing G-Speak intercom systems to G-Speak Ultra functionality. Easy installation using existing wiring.",
  "centurion-polophone": "Centurion POLOphone intercom system for reliable gate communication. Simple operation with durable construction for South African conditions.",
  
  // Centurion Remotes
  "centurion-nova-4-button-remote": "4-button Nova remote control with multiple channel capability for controlling gate motors, garage doors, and automated systems. Uses advanced code-hopping technology for enhanced security.",
  "centurion-nova-1-button-remote": "Single button Nova remote control for simple gate motor operation. Compact remote with code-hopping technology for enhanced security.",
  "centurion-nova-1-button-remote-copy": "2-button Nova remote for controlling gate and garage automation or multiple gates. Features advanced code-hopping security technology.",
  
  // Centurion Safety
  "centurion-photon-smart-wireless-beams": "Smart wireless perimeter security beams with advanced features. Wireless operation eliminates installation wiring. Compatible with Centurion smart gate systems.",
  "centurion-photon-wireless-beams": "Wireless infrared safety beams for gate obstruction detection. Easy installation without trenching or wiring between beams.",
  
  // Centurion Garage Motors
  "centurion-rdo-ii-roll-up-motor": "Complete roll-up garage door motor kit from Centurion. This RDO II system automates roll-up style garage doors with reliable performance. Includes motor, remote control, and mounting hardware.",
  "centurion-t10-sdo4-motor": "T10 smart sectional garage door motor kit with modern features. Features smart technology integration, soft start/stop, and obstacle detection.",
  "centurion-sdo4-t12-smart-kit": "T12 smart sectional garage door motor kit with enhanced power for heavier doors. Features smart home integration and comprehensive safety features.",
  "centurion-surge-and-lightning-protector": "Surge and lightning protection filter tube (10A kit) for gate motors. Protects expensive electronics from power surges and lightning strikes.",
  
  // Gemini Products
  "gemini-slider-12v-7ah-full-kit": "Complete Gemini Slider 12V full kit with all accessories needed for professional gate automation installation. Includes motor, steel rack, battery, two remotes, safety beams, and mounting hardware for gates up to 400kg.",
  "gemini-sectional-garage-door-motor-kit": "Complete Gemini sectional garage door motor kit for automated garage access. Includes motor, rail, remote control, and all installation hardware. Features obstacle detection and soft start/stop.",
  "gemini-1-button-remote": "Single button Gemini remote control for simple gate or garage automation. Compact remote with reliable signal transmission and long battery life.",
  "gemini-4-button-remote": "3-button Gemini remote for controlling multiple gate and garage systems. Versatile remote can operate up to three different automated systems.",
  "gemini-slider-12v-7ah-full-kit-complete-gate-automation-solution-copy": "Gemini Slider full kit without anti-theft bracket for gates up to 400kg. Comprehensive package includes motor, rack, battery, remotes, and safety accessories.",
  "gemini-sel-gate-motor": "Gemini 12V gate motor complete package with remotes and battery included. Ready-to-install kit provides reliable automation for sliding gates up to 400kg.",
  "gemini-anti-theft-bracket": "Anti-theft bracket specifically designed for Gemini gate motors. Heavy-duty construction provides enhanced protection in high-risk areas.",
  "gemini-steel-rack-2m": "2-meter steel rack for Gemini sliding gates. Durable construction provides reliable gate movement and long service life.",
  "gemini-pcb-v-90": "V.90 control board for Gemini gate motors. Genuine replacement PCB ensures compatibility and optimal performance.",
  "gemini-power-supply-12v-solar-compatible": "Solar compatible 12V power supply for Gemini gate automation. Designed to work with both standard AC power and solar panels.",
  "gemini-pcb-v-90-gemlink-smart-device": "PCB V.90 with Bluetooth & WiFi smart device combo package. Enables smartphone control, remote monitoring, and smart home integration.",
  "gemini-gemlink-smart-device": "Bluetooth/WiFi module for remote Gemini gate control. Adds app-based control to compatible Gemini gate motors.",
  "gemini-hex-coupling-and-disc": "Heavy-duty motor coupling for Gemini gate automation. Genuine replacement part ensures proper fit and function.",
  
  // E.T Nice Products
  "e-t-drive-500-gate-motor-kit": "Complete E.T Drive 500 gate motor bundle with accessories for gates up to 500kg. Includes motor, rack, battery, and installation hardware.",
  "e-t-roll-up-advance-garage-door-motor-kit": "E.T roll-up garage door motor complete kit for automated access. Includes motor, remote control, and all mounting hardware.",
  "et-nice-drive-1000-gate-motor": "Heavy-duty ET Nice Drive 1000 for industrial gates up to 1000kg. Designed for high-frequency use with extended duty cycle.",
  "et-nice-drive-300-gate-motor": "ET Nice Drive 300 sliding gate motor for residential use up to 300kg. Cost-effective solution for home automation with standard safety functions.",
  "et-nice-drive-500-gate-motor": "Mid-range ET Nice Drive 500 gate motor for gates up to 500kg. Suits most residential and light commercial applications.",
  "et-nice-drive-600-gate-motor": "ET Nice Drive 600 heavy-duty gate motor for gates up to 600kg. Suitable for high-frequency use with enhanced safety systems.",
  "e-t-nice-7-monitor-only": "7-inch monitor for E.T Nice intercom system. Replacement or additional monitor provides clear video display for gate intercom communication.",
  "e-t-nice-colour-video-intercom-gate-station": "Color video intercom gate station for E.T Nice systems. Outdoor unit provides two-way audio and video communication with indoor monitors.",
  "e-t-nice-7-monitor-intercom-gate-station-full-kit": "Complete 7-inch monitor and gate station intercom kit from E.T Nice. Full system includes indoor monitor, outdoor gate station, and connection hardware.",
  
  // Other Garage Motors
  "garador-elev8tor-garage-door-motor": "Garador Elev8tor garage door motor kit with extrusion rail. Sectional garage door opener provides reliable automation with smooth operation.",
  "dc-blue-advance-sectional-garage-motor-extrusion": "DC Blue Advance garage motor with extrusion rail for sectional doors. Features modern design with reliable performance and safety features.",
  "dc-blue-advance-garage-door-motor": "DC Blue Advance garage motor unit only without rail. Provides reliable sectional door automation when paired with appropriate rail system.",
  "dace-sprint-500-gate-motor": "Discontinued Dace Sprint 500 sliding gate motor for gates up to 500kg. While no longer in production, service support may still be available.",
  
  // Additional Remotes
  "eazylift-garage-door-remote-4-button": "4-button Eazylift remote for garage automation systems. Multi-function remote can control up to 4 different garage doors or gates.",
  "elev8tor-4-button-garage-door-remote": "Elev8tor 4-button garage door remote control for multi-door operation. Operates up to 4 different Elev8tor garage door systems.",
  "absolute-4-button-remote": "4-button Absolute remote for automated gate and garage systems. Multi-channel remote provides control for up to 4 different automation systems.",
  "sentry-1-button-c-hop-433-nova-remote": "Sentry single button remote control with code-hopping security on 433MHz frequency. Nova-compatible remote provides simple one-button operation.",
  "sentry-3-button-c-hop-433-nova-remote-copy": "Sentry 3-button remote control with code-hopping technology. Operates up to 3 different automation systems on 433MHz frequency.",
  "sentry-4-button-c-hop-433-nova-remote": "Sentry 4-button remote control with advanced code-hopping security. Controls up to 4 different gate or garage systems.",
  
  // Additional Intercoms
  "kocom-intercom-system": "Kocom video intercom system for gate access control. Reliable system provides clear audio and video communication between gate and house.",
  "zartek-wireless-intercom-system": "Zartek wireless intercom for gate communication without wiring. Battery-powered system eliminates installation wiring requirements.",
  
  // CCTV Products
  "hilook-2mp-bullet-camera": "Full HD 1080p bullet camera with advanced night vision capabilities up to 20 meters. Features a weatherproof IP67-rated housing suitable for outdoor installation in South African conditions.",
  "hilook-2mp-hybrid-dual-light-camera": "2MP hybrid dual light camera with full-color night vision capabilities. Combines infrared and white light illumination for superior nighttime images.",
  "hilook-2mp-full-colour-vu-bullet-camera": "Full-color night vision bullet camera with 24/7 color recording. This 2MP camera uses advanced sensor technology for color images in near darkness.",
  "hilook-2mp-dome-camera": "Full HD dome camera with weatherproof housing for versatile installation. Vandal-resistant dome design suitable for indoor and outdoor use.",
  "hilook-2mp-full-colour-vu-dome-camera": "24/7 full-color night vision dome camera with advanced imaging. Captures color video day and night using ColorVu technology.",
  "hilook-4-channel-turbo-hd-dvr": "4-channel 1080p CCTV recorder with remote viewing capability. Supports up to 4 cameras with Full HD recording and smartphone app access.",
  "hilook-4-channel-turbo-hd-dvr-with-built-in-320gb-hdd": "4-channel DVR with 320GB storage included for extended recording. Complete recorder solution with pre-installed hard drive ready for immediate use.",
  "hilook-8-channel-turbo-hd-dvr": "8-channel security recorder without HDD for custom storage solutions. Supports up to 8 cameras with Full HD recording and advanced video management.",
  "hilook-8-channel-turbo-hd-dvr-with-built-in-512gb-hdd": "8-channel DVR with 512GB storage for comprehensive surveillance. Manages up to 8 Full HD cameras with extended recording times.",
  "hilook-16-channel-turbo-hd-dvr-with-built-in-1tb-hdd": "Professional 16-channel DVR with 1TB storage for large installations. Ideal for commercial and industrial security applications.",
  "andowl-q-s4max-8k-wifi-security-camera": "8K WiFi security camera with dual antenna system for enhanced connectivity. Premium camera delivers ultra-high resolution video with advanced features.",
  "andowl-solar-smart-4g-camera-sim-card-powered-wireless": "Solar-powered 4G camera with SIM card support for remote locations. Completely wireless camera operates independently without WiFi or power wiring.",
  "hikvision-4-channel-cctv-power-supply": "4-channel CCTV power distribution box from Hikvision. Centralized power supply provides regulated power to up to 4 security cameras.",
  "hikvision-8-channel-cctv-power-supply": "8-channel CCTV power supply unit for medium camera installations. Provides stable power to 8 cameras from single connection.",
  "hikvision-16-channel-cctv-power-supply": "16-channel CCTV power supply for large surveillance systems. Professional power distribution unit supports up to 16 security cameras.",
  "10a-9-channel-cctv-power-supply-with-metal-casing": "Metal cased 9-channel 10A CCTV power supply with enhanced durability. Heavy-duty metal housing protects against environmental factors.",
  
  // Accessories
  "dts-60mm-radius-gate-wheels": "60mm radius gate wheels for smooth sliding gate operation. Durable wheels support gate weight while ensuring smooth rolling motion.",
  "dts-60mm-radius-gate-wheels-v-profile": "V-profile 60mm radius gate wheels for V-track systems. Specialized wheels fit V-shaped track profiles providing stable gate movement.",
  "glosteel-garage-door": "Glosteel charcoal grey garage door panel. High-quality door panel features durable construction with modern charcoal grey finish.",
  "glosteel-garage-door-safari-brown": "Glosteel safari brown garage door panel with premium finish. Attractive door panel provides durability and aesthetic appeal.",
  "glosteel-garage-door-african-cream": "Glosteel African cream garage door panel for light, neutral appearance. Quality door panel features durable construction with attractive cream finish.",
  "vector-vantage-cable-per-meter": "Vector/Vantage cable sold per meter for gate motor installations. Specialized cable handles power and control signals for gate automation.",
  "pcb-shaft-encoder": "Wireless shaft encoding pickup circuit board for gate motors. Sensor component provides position feedback for accurate gate control.",
  "sentry-safety-wireless-gate-beams": "Wireless infrared safety beams for gate obstruction detection. Photocells prevent gate closure when objects are detected in path.",
  
  // Electric Fencing
  "nemtek-electric-fence-aluminium-ferrules-6mm-100-pack": "100-pack of 6mm aluminium ferrules for electric fence wire connections. Ferrules provide secure, corrosion-resistant wire terminations.",
  "nemtek-spring-hook-large-tail-2mm-50-pack": "50-pack spring hooks with large tail for electric fence installation. 2mm hooks securely attach fence wire to insulators and posts.",
  "stainless-steel-tension-springs-with-limiters-50-pack": "50-pack stainless steel tension springs with limiters for electric fencing. Springs maintain proper wire tension while preventing over-stretching.",
  "nemtek-compression-spring-1-silver-5kg-black-50-box": "Box of 50 compression springs (5kg tension) for electric fencing. Nemtek springs maintain consistent wire tension across fence runs.",
  "nemtek-hybrid-compression-spring-2-8kg-gold-black-50-pack": "50-pack 8kg hybrid compression springs (gold series) for heavy-duty electric fences. Rated for 8kg loads with professional-grade construction.",
  "nemtek-electric-fence-high-voltage-timed-warning-light-blue": "Blue LED warning light for electric fence high-voltage indication. Timed flashing light alerts to energized fence status.",
  "jva-high-voltage-electric-fence-warning-light-red-led": "Red LED warning light for electric fence safety signage. High-visibility light indicates energized fence status to prevent accidental contact.",
  "jva-high-voltage-fence-warning-light-blue-led": "Blue LED warning light for electric fence high-voltage alert. Bright LED provides clear visual indication of live electric fence.",
};

async function updateDescriptions() {
  console.log('🔄 Updating product descriptions...\n');
  
  let updated = 0;
  const total = Object.keys(PRODUCT_DESCRIPTIONS).length;
  
  for (const [slug, description] of Object.entries(PRODUCT_DESCRIPTIONS)) {
    try {
      await db
        .update(products)
        .set({ description })
        .where(eq(products.slug, slug));
      
      updated++;
      console.log(`✓ Updated: ${slug}`);
    } catch (error) {
      console.error(`✗ Failed: ${slug} -`, error);
    }
  }
  
  console.log(`\n✅ Updated ${updated}/${total} product descriptions`);
  process.exit(0);
}

updateDescriptions().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
