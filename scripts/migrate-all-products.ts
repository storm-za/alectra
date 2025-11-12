import { db } from "../server/db";
import { products, categories } from "../shared/schema";
import { eq } from "drizzle-orm";
import pLimit from "p-limit";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping from old website patterns to our database slugs
const CATEGORY_MAP: Record<string, string> = {
  'gate-motor': 'gate-motors',
  'battery': 'batteries',
  'remote': 'remotes',
  'solar': 'batteries', // Solar products -> Batteries for now
  'cctv': 'cctv',
  'camera': 'cctv',
  'intercom': 'intercoms',
  'gas': 'lp-gas',
  'garage': 'gate-motor-kits', // Garage motors are similar to gate kits
  'beam': 'electric-fencing',
  'pcb': 'gate-motor-kits',
  'charger': 'gate-motor-kits',
  'bracket': 'gate-motor-kits',
  'rack': 'gate-motor-kits',
  'door': 'gate-motor-kits',
  'cable': 'gate-motor-kits',
};

interface RawProduct {
  slug: string;
  name: string;
  price: string;
  compareAtPrice?: string;
  brand?: string;
  categoryHint: string;
  imageUrl: string;
  description: string;
}

// All 150+ products extracted from alectra.co.za
const RAW_PRODUCTS: RawProduct[] = [
  // Page 1 products
  { slug: "4k-solar-powered-security-camera", name: "4K Solar CCTV Camera", price: "1099", compareAtPrice: "1799", brand: "Andowl", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/andowl-4k-solar-cctv-camera.png?v=1761151419", description: "Experience next-level home and business security with the 4K Solar Powered Security Camera with WiFi and Night Vision. Designed for effortless protection, this camera combines crystal-clear 4K ultra high-definition video with the convenience of solar power, ensuring continuous operation without the need for constant charging or complicated wiring. Equipped with advanced night vision technology, this camera captures sharp, detailed footage even in complete darkness, giving you peace of mind 24 hours a day. Its built-in WiFi allows for real-time monitoring from your smartphone, tablet, or computer, no matter where you are." },
  { slug: "12v-1-4ah-battery", name: "12V 1.4Ah Battery", price: "135", compareAtPrice: "189", brand: "EPS", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/EPS1214_1.png?v=1732102140", description: "Reliable 12V 1.4Ah sealed lead-acid battery perfect for backup power supplies, alarm systems, gate motors." },
  { slug: "12v-2-4ah", name: "12V 2.4Ah Battery", price: "160", compareAtPrice: "199", brand: "Battery", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/Battery-12V-2.4AH-EACH-L-P05765-FRONT-scaled-1.png?v=1732102145", description: "High-capacity 12V 2.4Ah sealed lead-acid battery for extended run times." },
  { slug: "12v-7ah", name: "12V 7AH Battery", price: "250", compareAtPrice: "319", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/12v-7ah-battery-backup-power.jpg?v=1741694628", description: "The 12V 7Ah battery is the go-to power source for reliable and consistent performance." },
  { slug: "12v-7ah-lithium-battery", name: "12V 8AH LITHIUM BATTERY", price: "550", brand: "Lithium", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/lithium-battery-12v-8ah-alectra-solutions.png?v=1733234790", description: "Advanced 12V 8Ah lithium battery offering superior performance and longer lifespan." },
  { slug: "24v-3-5ah", name: "24V 3.5AH Battery", price: "485", compareAtPrice: "579", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/24v-battery-for-gate-or-garage-motor.png?v=1738318469", description: "High-performance 24V 3.5Ah battery designed for gate and garage motors." },
  { slug: "9kg-exchange", name: "9KG LP Gas", price: "280", categoryHint: "gas", imageUrl: "https://alectra.co.za/cdn/shop/files/9kg-lp-gas-exchange-refill.png?v=1739186237", description: "9kg LP Gas Exchange/Refill service for home and commercial use." },
  { slug: "19kg-exchange", name: "19KG LP Gas", price: "580", categoryHint: "gas", imageUrl: "https://alectra.co.za/cdn/shop/files/19kg-lp-gas-exchange-refill.png?v=1739186211", description: "19kg LP Gas Exchange/Refill service for medium to large households." },
  { slug: "48kg-exchange", name: "48KG LP Gas", price: "1399", categoryHint: "gas", imageUrl: "https://alectra.co.za/cdn/shop/files/48kg-lp-gas-exchange-refill.png?v=1739186275", description: "48kg LP Gas Exchange/Refill for commercial applications." },
  { slug: "centurion-d2-sliding-gate-motor", name: "Centurion D2 Sliding Gate Motor (discontinued)", price: "3999", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d2-sliding-gate-motor.png?v=1738318875", description: "Centurion D2 sliding gate motor. Discontinued model for residential gates." },
  { slug: "centurion-d3-smart-gate-motor", name: "Centurion D3 Smart Gate Motor (No remotes included)", price: "4399", compareAtPrice: "5299", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-smart-gate-motor.jpg?v=1738318991", description: "Centurion D3 Smart Gate Motor with advanced features and smart home integration." },
  { slug: "centurion-d3-smart-motor-only", name: "Centurion D3 Smart Gate Motor Kit", price: "4919", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/Untitleddesign_45.png?v=1738243578", description: "Complete Centurion D3 Smart Gate Motor Kit with all essential components." },
  { slug: "centurion-d3-smart-full-kit-no-anti-theft-bracket", name: "Centurion D3 Smart Gate Motor Full Kit No Anti-Theft Bracket", price: "5419", compareAtPrice: "5699", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-smart-full-kit-no-anti-theft-bracket.jpg?v=1737809659", description: "Centurion D3 Smart Full Kit without anti-theft bracket." },
  { slug: "centurion-d3-smart-full-kit-advanced-gate-automation-solution-1", name: "Centurion D3 Smart Gate Motor Full Kit", price: "6319", compareAtPrice: "6549", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-smart-full-kit-alectra-solutions.jpg?v=1737466423", description: "Complete Centurion D3 Smart gate automation solution with all accessories." },
  { slug: "centurion-d3-smart-pcb-12v", name: "Centurion D3 Smart PCB 12v", price: "1499", brand: "Centurion", categoryHint: "pcb", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-smart-pcb-12v.jpg?v=1736936241", description: "Replacement control board for Centurion D3 Smart gate motors." },
  { slug: "centurion-d3-d5-evo-smart-d6-smart-base-plate", name: "Centurion D3/D5 EVO Smart & D6 Smart Base Plate", price: "168", compareAtPrice: "239", brand: "Centurion", categoryHint: "bracket", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-d5-evo-d6-smart-base-plate.jpg?v=1736335798", description: "Universal base plate for Centurion D3, D5 EVO, and D6 Smart gate motors." },
  { slug: "centurion-d3-d5-evo-smart-anti-theft-bracket", name: "Centurion D3/D5 Evo Smart Anti-Theft Bracket", price: "899", compareAtPrice: "1299", brand: "Centurion", categoryHint: "bracket", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d3-d5-evo-smart-anti-theft-bracket.jpg?v=1736333974", description: "Anti-theft security bracket for Centurion D3 and D5 EVO Smart motors." },
  { slug: "centurion-d5-evo-smart-gate-motor", name: "Centurion D5 Evo Smart Gate Motor (No remotes included)", price: "5099", compareAtPrice: "6499", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor.jpg?v=1738319268", description: "Advanced Centurion D5 Evo Smart Gate Motor for gates up to 500kg." },
  { slug: "centurion-d5-evo-smart-motor-only", name: "Centurion D5 Evo Smart Gate Motor Kit", price: "5999", compareAtPrice: "6045", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor.png?v=1738244068", description: "Centurion D5 Evo Smart motor kit with essential components." },
  { slug: "centurion-d5-evo-smart-full-kit-advanced-gate-automation-solution-copy", name: "Centurion D5 Evo Smart Gate Motor Full Kit No Anti-Theft Bracket", price: "6659", compareAtPrice: "6999", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor-full-kit-steelrack.png?v=1739182995", description: "Full Centurion D5 EVO Smart kit without anti-theft bracket." },
  { slug: "centurion-d3-smart-full-kit-advanced-gate-automation-solution", name: "Centurion D5 Evo Smart Gate Motor Full Kit", price: "7399", compareAtPrice: "8599", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/alectra-solutions-d5-evo-smart-gate-motor-kit.png?v=1753261610", description: "Premium Centurion D5 Evo Smart full automation kit with all accessories." },
  { slug: "centurion-d5-evo-sliding-gate-motor", name: "Centurion D5 Evo Sliding Gate Motor (Discontinued)", price: "5999", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/Centurion-D5-Evo.png?v=1732102083", description: "Discontinued Centurion D5 Evo sliding gate motor model." },
  { slug: "centurion-d5-evo-full-kit", name: "CENTURION D5 EVO FULL KIT(Discontinued)", price: "8699", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-full-kit.png?v=1737808624", description: "Complete D5 EVO kit - discontinued model." },
  { slug: "centurion-d5-evo-main-cover", name: "Centurion D5 Evo Main Cover Replacement", price: "383", brand: "Centurion", categoryHint: "door", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-main-cover.jpg?v=1738319128", description: "Replacement main cover for Centurion D5 Evo gate motors." },
  { slug: "centurion-d5-d6-smart-anti-theft", name: "Centurion D5 Evo Anti-Theft Bracket(discontinued)", price: "1350", compareAtPrice: "1649", brand: "Centurion", categoryHint: "bracket", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-anti-theft-bracket.jpg?v=1736332896", description: "Anti-theft bracket for D5 Evo gate motors - discontinued." },
  { slug: "centurion-d5-cp80-pcb", name: "Centurion D5 CP80 PCB (Discontinued)", price: "1099", brand: "Centurion", categoryHint: "pcb", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-cp80-pcb.jpg?v=1736931875", description: "Discontinued CP80 PCB replacement board for D5 motors." },
  
  // Page 2 products  
  { slug: "centurion-d10-smart-turbo-gate-motor", name: "Centurion D10 Smart Turbo Gate Motor (No remotes included)", price: "9699", compareAtPrice: "10599", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/d10-smart-turbo-gate-motor.png?v=1738318839", description: "High-performance Centurion D10 Smart Turbo for heavy-duty gates." },
  { slug: "centurion-d10-smart-base-plate", name: "Centurion D10 Smart Base Plate", price: "204", brand: "Centurion", categoryHint: "bracket", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d10-smart-base-plate.jpg?v=1736336363", description: "Base plate for Centurion D10 Smart gate motor." },
  { slug: "centurion-d10-pcb-v2", name: "Centurion D10 PCB v2", price: "1949", compareAtPrice: "2399", brand: "Centurion", categoryHint: "pcb", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d10-pcb-v2.jpg?v=1736934080", description: "Version 2 circuit board for Centurion D10 gate motors." },
  { slug: "centurion-d10-charger", name: "Centurion D10 Charger", price: "949", compareAtPrice: "1250", brand: "Centurion", categoryHint: "charger", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d10-charger-24v.jpg?v=1736934702", description: "24V charger for Centurion D10 gate motor power supply." },
  { slug: "centurion-gate-motor-nylon-rack-2m", name: "Centurion Gate Motor Nylon Rack (2m)", price: "250", brand: "Centurion", categoryHint: "rack", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-nylon-rack-2m.jpg?v=1736337062", description: "2-meter nylon rack for quiet sliding gate operation." },
  { slug: "centurion-gate-motor-door-and-key", name: "Centurion Gate Motor Door and Key", price: "170", brand: "Centurion", categoryHint: "door", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-gate-motor-door-key.jpg?v=1737041626", description: "Replacement door and key set for Centurion gate motors." },
  { slug: "centurion-vantage-400-gate-motor", name: "Centurion Vantage 400 Gate Motor", price: "5499", compareAtPrice: "5979", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-vantage.jpg?v=1732102106", description: "Centurion Vantage 400 swing gate motor for residential use." },
  { slug: "centurion-vantage-500-gate-motor", name: "CENTURION VANTAGE 500 GATE MOTOR", price: "10799", compareAtPrice: "11899", brand: "Centurion", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-vantage-500-1.jpg?v=1732102107", description: "Heavy-duty Vantage 500 swing gate motor for large gates." },
  { slug: "centurion-vantage-400-500-smart-pcb", name: "Centurion Vantage 400/500 Smart PCB", price: "2799", brand: "Centurion", categoryHint: "pcb", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-vantage-400-500-smart-pcb.jpg?v=1737040808", description: "Smart PCB circuit board for Vantage 400/500 swing gate motors." },
  { slug: "centurion-g-speak-ultra-4-button", name: "Centurion G-Speak Ultra 4-button Intercom", price: "951", brand: "Centurion", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-g-speak_ultra-4-button-intercom.jpg?v=1738319440", description: "4-button G-Speak Ultra intercom system." },
  { slug: "centurion-g-speak-ultra", name: "Centurion G-Speak Ultra Intercom", price: "3999", brand: "Centurion", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/g-speak-ultra-intercom.jpg?v=1738319517", description: "Complete G-Speak Ultra intercom system for gate access." },
  { slug: "centurion-g-speak-ultra-upgrade-kit", name: "Centurion G-Speak Ultra Upgrade Kit Intercom", price: "2999", compareAtPrice: "3300", brand: "Centurion", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-g-speak-ultra-intercom.webp?v=1738319580", description: "Upgrade kit for existing G-Speak intercom systems." },
  { slug: "centurion-polophone", name: "Centurion POLOphone Intercom", price: "1327.49", brand: "Centurion", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-polophone.jpg?v=1732102151", description: "POLOphone intercom system for gate communication." },
  { slug: "absolute-4-button-remote", name: "Absolute 4 Button Remote", price: "270", brand: "Absolute", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/absolute-4-button-remote-automation.jpg?v=1736331886", description: "4-button remote for automated gate and garage systems." },
  { slug: "centurion-nova-1-button-remote", name: "Centurion Nova 1 Button Remote", price: "159", compareAtPrice: "199", brand: "Centurion", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-nova-1-button-remote.png?v=1738319645", description: "Single button Nova remote control." },
  { slug: "centurion-nova-1-button-remote-copy", name: "Centurion Nova 2 Button Remote", price: "185", compareAtPrice: "249", brand: "Centurion", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/Novaremotes-2_900x900_29daf0b5-3622-4573-9664-54e63d418197.png?v=1732102197", description: "2-button Nova remote for gate and garage automation." },
  { slug: "centurion-nova-4-button-remote", name: "Centurion Nova 4 Button Remote", price: "259", compareAtPrice: "349", brand: "Centurion", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/nova-4-button-remote-alectra-solutions.png?v=1755000227", description: "4-button Nova remote with multiple channel control." },
  { slug: "centurion-photon-smart-wireless-beams", name: "Centurion Photon Smart Wireless Beams", price: "899", compareAtPrice: "1699", brand: "Centurion", categoryHint: "beam", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-photon-smart-wireless-beams..jpg?v=1736931265", description: "Smart wireless perimeter security beams." },
  { slug: "centurion-photon-wireless-beams", name: "Centurion Photon Wireless Beams", price: "849", compareAtPrice: "1099", brand: "Centurion", categoryHint: "beam", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-photon-wireless-beams.jpg?v=1736931091", description: "Wireless infrared beams for gate safety." },
  { slug: "centurion-rdo-ii-roll-up-motor", name: "CENTURION RDO II ROLL-UP Complete Kit", price: "2899", compareAtPrice: "3299", brand: "Centurion", categoryHint: "garage", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-Roll-up-motor-2.jpg?v=1732102187", description: "Complete roll-up garage door motor kit." },
  { slug: "centurion-t10-sdo4-motor", name: "CENTURION SDO4 T10 Smart Kit", price: "3199", brand: "Centurion", categoryHint: "garage", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-sd04-t12-smart-kit-garage-motor.png?v=1746620067", description: "T10 smart sectional garage door motor kit." },
  { slug: "centurion-sdo4-t12-smart-kit", name: "CENTURION SDO4 T12 Smart Kit", price: "3399", brand: "Centurion", categoryHint: "garage", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-sd04-t12-smart-kit-garage-motor.png?v=1746620067", description: "T12 smart sectional garage door motor kit." },
  { slug: "gemini-sectional-garage-door-motor-kit", name: "Gemini Sectional Garage Door Motor Kit", price: "3799", compareAtPrice: "4069", brand: "Gemini", categoryHint: "garage", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-sectional-garage-door-motor-kit.jpg?v=1732102117", description: "Complete Gemini sectional garage door motor kit." },
  { slug: "dace-sprint-500-gate-motor", name: "Dace Sprint 500 Gate Motor (Discontinued)", price: "4199", brand: "Dace", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/Dace-Sprint-500-Gate-Motor.jpg?v=1732102088", description: "Discontinued Dace Sprint 500 sliding gate motor." },
  { slug: "dc-blue-advance-sectional-garage-motor-extrusion", name: "DC Blue Advance Sectional Garage Motor Kit + Extrusion", price: "4199", brand: "DC", categoryHint: "garage", imageUrl: "https://alectra.co.za/cdn/shop/files/dc-blue-advance-sectional-garage-motor.jpg?v=1736930360", description: "DC Blue Advance garage motor with extrusion rail." },
  { slug: "dc-blue-advance-garage-door-motor", name: "DC Blue Advance Sectional Garage Motor Only", price: "3399", brand: "DC", categoryHint: "garage", imageUrl: "https://alectra.co.za/cdn/shop/files/dc-blue-advance-sectional-garage-motor.jpg?v=1736930360", description: "DC Blue Advance garage motor unit only." },
  
  // Page 3 products
  { slug: "e-t-drive-500-gate-motor-kit", name: "E.T DRIVE 500 GATE MOTOR KIT BUNDLE", price: "6199", brand: "E.T", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/et-drive-500-gate-motor-kit-1.png?v=1739183823", description: "Complete E.T Drive 500 gate motor bundle with accessories." },
  { slug: "e-t-roll-up-advance-garage-door-motor-kit", name: "E.T Roll-up Advance Garage Door Motor Kit", price: "2799", compareAtPrice: "3020", brand: "E.T", categoryHint: "garage", imageUrl: "https://alectra.co.za/cdn/shop/files/E.T-Roll-up-Advance-Garage-Door-Motor-Kit.jpg?v=1732102116", description: "E.T roll-up garage door motor complete kit." },
  { slug: "eazylift-garage-door-remote-4-button", name: "Eazylift Garage Door Remote 4 Button", price: "330", brand: "Eazylift", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/eazylift-4-button-remote-automation.jpg?v=1736329998", description: "4-button Eazylift remote for garage automation." },
  { slug: "elev8tor-4-button-garage-door-remote", name: "Elev8tor 4 Button Garage Door Remote", price: "225", brand: "Elev8tor", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/elev8tor-4-button-remote-automation.jpg?v=1736331379", description: "Elev8tor 4-button garage door remote control." },
  { slug: "et-nice-drive-1000-gate-motor", name: "ET Nice Drive 1000 Gate Motor", price: "11899", compareAtPrice: "13049", brand: "E.T", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/ET-Nice-Drive_-1000-Gate-Motor.jpg?v=1732102081", description: "Heavy-duty ET Nice Drive 1000 for industrial gates." },
  { slug: "et-nice-drive-300-gate-motor", name: "ET Nice Drive 300 Gate Motor", price: "4399", brand: "E.T", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/ET-Nice-Drive-300-Gate-Motor.jpg?v=1732102079", description: "ET Nice Drive 300 sliding gate motor for residential use." },
  { slug: "et-nice-drive-500-gate-motor", name: "ET Nice Drive 500 Gate Motor", price: "6299", compareAtPrice: "6649", brand: "E.T", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/ET-Nice-Drive-500-Gate-Motor.jpg?v=1732102090", description: "Mid-range ET Nice Drive 500 gate motor." },
  { slug: "et-nice-drive-600-gate-motor", name: "ET Nice Drive 600 Gate Motor", price: "6199", compareAtPrice: "6799", brand: "E.T", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/ET-Nice-Drive-600-Gate-Motor.jpg?v=1732102104", description: "ET Nice Drive 600 heavy-duty gate motor." },
  { slug: "garador-elev8tor-garage-door-motor", name: "Garador Elev8tor Garage Door Motor Kit + Extrusion", price: "3599", compareAtPrice: "3950", brand: "Garador", categoryHint: "garage", imageUrl: "https://alectra.co.za/cdn/shop/files/Garador-Elev8tor-Garage-Door-Motor.jpg?v=1732102119", description: "Garador Elev8tor garage door motor with extrusion." },
  { slug: "gemini-1-button-remote", name: "Gemini 1 Button Remote", price: "149", compareAtPrice: "199", brand: "Gemini", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/Gemini-1-button-remote-automation.jpg?v=1736328201", description: "Single button Gemini remote control." },
  { slug: "gemini-4-button-remote", name: "Gemini 3 Button Gate/Garage Remote", price: "165", compareAtPrice: "259", brand: "Gemini", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-3-button-gate-garage-remote.png?v=1755000539", description: "3-button Gemini remote for gate and garage." },
  { slug: "gemini-slider-12v-7ah-full-kit-complete-gate-automation-solution-copy", name: "Gemini Slider 12V 7Ah Full Kit No Anti-Theft Bracket", price: "5249", compareAtPrice: "5599", brand: "Gemini", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-slider-12v-7ah-full-kit-alectra.png?v=1737463898", description: "Gemini Slider full kit without anti-theft bracket." },
  { slug: "gemini-sel-gate-motor", name: "Gemini 12V Gate Motor", price: "4499", compareAtPrice: "4799", brand: "Gemini", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-gate-motor-with-remotes-and-battery.png?v=1761073703", description: "Gemini 12V gate motor with remotes and battery included." },
  { slug: "gemini-slider-12v-7ah-full-kit-complete-gate-automation-solution", name: "Gemini Slider 12V 7Ah Full Kit", price: "5999", compareAtPrice: "6699", brand: "Gemini", categoryHint: "gate-motor", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-slider-12v-7ah-full-kit.png?v=1737463478", description: "Complete Gemini Slider 12V full kit with all accessories." },
  { slug: "gemini-anti-theft-bracket", name: "Gemini Anti-Theft Bracket", price: "849", brand: "Gemini", categoryHint: "bracket", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-anti-theft-bracket.jpg?v=1737041380", description: "Anti-theft bracket for Gemini gate motors." },
  { slug: "gemini-steel-rack-2m", name: "Gemini Steel Rack (2m)", price: "320", brand: "Gemini", categoryHint: "rack", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-steel-rack-2m.jpg?v=1736336747", description: "2-meter steel rack for Gemini sliding gates." },
  { slug: "glosteel-garage-door", name: "Glosteel Garage Door Charcoal Grey", price: "1899", compareAtPrice: "2100", brand: "Glosteel", categoryHint: "door", imageUrl: "https://alectra.co.za/cdn/shop/files/glosteel-garage-door-charcoal-grey.jpg?v=1740573517", description: "Glosteel charcoal grey garage door panel." },
  { slug: "kocom-intercom-system", name: "Kocom Intercom System", price: "747.50", brand: "Kocom", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/kocom-intercom_333ecf52-f53f-4ac8-9052-9aab03dda7c5.jpg?v=1732102159", description: "Kocom video intercom system for gate access." },
  { slug: "sentry-1-button-c-hop-433-nova-remote", name: "Sentry 1 Button c/hop 433 Nova Remote", price: "145", brand: "Sentry", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/sentry-1-button-remote-automation.jpg?v=1736328985", description: "Sentry single button remote control." },
  { slug: "sentry-3-button-c-hop-433-nova-remote-copy", name: "Sentry 3 Button c/hop 433 Nova Remote", price: "160", brand: "Sentry", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/sentry-3-button-remote-automation.jpg?v=1736329501", description: "Sentry 3-button remote control." },
  { slug: "sentry-4-button-c-hop-433-nova-remote", name: "Sentry 4 Button c/hop 433 Nova Remote", price: "175", brand: "Sentry", categoryHint: "remote", imageUrl: "https://alectra.co.za/cdn/shop/files/sentry-4-button-remote-automation.jpg?v=1736329721", description: "Sentry 4-button remote control." },
  { slug: "vector-vantage-cable-per-meter", name: "Vector / Vantage Cable (per meter)", price: "53", categoryHint: "cable", imageUrl: "https://alectra.co.za/cdn/shop/files/vantage-cable.jpg?v=1732102100", description: "Vector/Vantage cable sold per meter for gate motors." },
  { slug: "zartek-wireless-intercom-system", name: "Zartek Wireless Intercom System", price: "2335", brand: "Zartek", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/zartek-wireless-intercom-system.jpg?v=1732102158", description: "Zartek wireless intercom for gate communication." },
  { slug: "centurion-surge-and-lightning-protector", name: "Centurion Surge and Lightning Protector Filter Tube 10A kit for Gate Motor", price: "420", compareAtPrice: "499", brand: "Centurion", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-surge-and-lightning-protector.jpg?v=1739525361", description: "Surge and lightning protection for gate motors." },
  
  // Page 4 products - CCTV & Accessories
  { slug: "hilook-2mp-bullet-camera", name: "Hilook 2MP Bullet Camera", price: "240", brand: "Hilook", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-2mp-bullet-camera-analog.jpg?v=1741098423", description: "Full HD 1080p bullet camera with night vision." },
  { slug: "hilook-2mp-hybrid-dual-light-camera", name: "Hilook 2MP Hybrid Dual Light Camera", price: "299", brand: "Hilook", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-2mp-hybrid-dual-light-camera-analog.jpg?v=1741098580", description: "2MP hybrid dual light camera with full-color night vision." },
  { slug: "hilook-2mp-full-colour-vu-bullet-camera", name: "Hilook 2MP Full Colour Vu Bullet Camera", price: "449", brand: "Hilook", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-2mp-full-colour-vu-bullet-camera-analog.jpg?v=1741098822", description: "Full-color night vision bullet camera." },
  { slug: "hilook-2mp-dome-camera", name: "Hilook 2MP Dome Camera", price: "249", brand: "Hilook", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-2mp-dome-camera-analog.jpg?v=1741099098", description: "Full HD dome camera with weatherproof housing." },
  { slug: "hilook-2mp-full-colour-vu-dome-camera", name: "Hilook 2MP Full ColorVu Dome Camera", price: "399", compareAtPrice: "445", brand: "Hilook", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-2mp-full-colorvu-dome-camera-analog.jpg?v=1741099831", description: "24/7 full-color night vision dome camera." },
  { slug: "hilook-4-channel-turbo-hd-dvr", name: "Hilook 4 Channel Turbo HD DVR", price: "799", brand: "Hilook", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-4-channel-turbo-hd-dvr.png?v=1740045314", description: "4-channel 1080p CCTV recorder with remote viewing." },
  { slug: "hilook-4-channel-turbo-hd-dvr-with-built-in-320gb-hdd", name: "HiLook 4-Channel Turbo HD DVR with Built-in 320GB HDD", price: "1449", compareAtPrice: "1649", brand: "Hilook", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-4-channel-turbo-hd-dvr-320gb-hdd.png?v=1740226512", description: "4-channel DVR with 320GB storage included." },
  { slug: "hilook-8-channel-turbo-hd-dvr", name: "HiLook 8-Channel Turbo HD DVR", price: "999", brand: "Hilook", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-8-channel-turbo-hd-dvr-no-hdd.png?v=1740226850", description: "8-channel security recorder without HDD." },
  { slug: "hilook-8-channel-turbo-hd-dvr-with-built-in-512gb-hdd", name: "HiLook 8-Channel Turbo HD DVR with Built-in 512GB HDD", price: "1499", compareAtPrice: "1649", brand: "Hilook", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-8-channel-turbo-hd-dvr-512gb-hdd.png?v=1740227132", description: "8-channel DVR with 512GB storage." },
  { slug: "hilook-16-channel-turbo-hd-dvr-with-built-in-1tb-hdd", name: "HiLook 16-Channel Turbo HD DVR with Built-in 1TB HDD", price: "2399", brand: "Hilook", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/hilook-16-channel-turbo-hd-dvr-1tb-hdd.png?v=1740227296", description: "Professional 16-channel DVR with 1TB storage." },
  { slug: "andowl-q-s4max-8k-wifi-security-camera", name: "Andowl Q-S4MAX 8K WiFi Security Camera", price: "850", compareAtPrice: "1499", brand: "Andowl", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/andowl-q-s4max-8k-wifi-security-camera-12v.png?v=1740227436", description: "8K WiFi security camera with dual antennas." },
  { slug: "andowl-solar-smart-4g-camera-sim-card-powered-wireless-security", name: "Andowl Solar Smart 4G Camera", price: "1395", compareAtPrice: "1699", brand: "Andowl", categoryHint: "camera", imageUrl: "https://alectra.co.za/cdn/shop/files/andowl-solar-smart-4g-camera-simcard-wireless.png?v=1740227577", description: "Solar-powered 4G camera with SIM card support." },
  { slug: "hikvision-4-channel-cctv-power-supply", name: "Hikvision 4-Channel CCTV Power Supply", price: "229", compareAtPrice: "450", brand: "Hikvision", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/hikvision-4ch-cctv-power-supply.png?v=1740227809", description: "4-channel CCTV power distribution box." },
  { slug: "hikvision-8-channel-cctv-power-supply", name: "Hikvision 8-Channel CCTV Power Supply", price: "249", brand: "Hikvision", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/hikvision-8ch-cctv-power-supply.png?v=1740227950", description: "8-channel CCTV power supply unit." },
  { slug: "hikvision-16-channel-cctv-power-supply", name: "Hikvision 16-Channel CCTV Power Supply", price: "420", brand: "Hikvision", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/hikvision-16ch-cctv-power-supply.png?v=1740228119", description: "16-channel CCTV power supply." },
  { slug: "10a-9-channel-cctv-power-supply-with-metal-casing", name: "10A 9-Channel CCTV Power Supply with Metal Casing", price: "349", compareAtPrice: "429", categoryHint: "cctv", imageUrl: "https://alectra.co.za/cdn/shop/files/10a-9ch-cctv-power-supply-metal-casing.png?v=1740228269", description: "Metal cased 9-channel 10A CCTV power supply." },
  
  // Page 5 - More accessories
  { slug: "dts-60mm-radius-gate-wheels", name: "DTS 60mm Radius Gate Wheels", price: "210", brand: "DTS", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/dts-60mm-radius-gate-wheels.png?v=1740832762", description: "60mm radius gate wheels for sliding gates." },
  { slug: "dts-60mm-radius-gate-wheels-v-profile", name: "DTS 60mm Radius Gate Wheels V-Profile", price: "215", compareAtPrice: "349", brand: "DTS", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/dts-60mm-radius-gate-wheels-v-profile.png?v=1740833005", description: "V-profile 60mm radius gate wheels." },
  { slug: "glosteel-garage-door-safari-brown", name: "Glosteel Garage Door Safari Brown", price: "1899", compareAtPrice: "2100", brand: "Glosteel", categoryHint: "door", imageUrl: "https://alectra.co.za/cdn/shop/files/glosteel-garage-door-safari-brown.jpg?v=1740573517", description: "Glosteel safari brown garage door panel." },
  { slug: "glosteel-garage-door-african-cream", name: "Glosteel Garage Door African Cream", price: "1899", compareAtPrice: "2100", brand: "Glosteel", categoryHint: "door", imageUrl: "https://alectra.co.za/cdn/shop/files/glosteel-garage-door-african-cream.jpg?v=1740573517", description: "Glosteel African cream garage door panel." },
  { slug: "gemini-gemlink-smart-device", name: "Gemini Gemlink Smart Device", price: "749", compareAtPrice: "849", brand: "Gemini", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-gemlink-smart-device-bluetooth-wifi-module.jpg?v=1741686001", description: "Bluetooth/WiFi module for remote gate control." },
  { slug: "centurion-12v-7-2ah-battery", name: "Centurion Gate Motor Battery 12V 7AH CP4C2-28W", price: "375", compareAtPrice: "450", brand: "Centurion", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-12v-7-2ah-battery-backup-power.jpg?v=1741694178", description: "Centurion 12V 7.2Ah battery for gate motors." },
  { slug: "12v-8ah-gel-battery", name: "Gate Motor Gel Battery 12V 8Ah", price: "325", compareAtPrice: "399", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/12v-8ah-gel-battery-backup-power.jpg?v=1741694372", description: "Maintenance-free gel battery for gate motors." },
  { slug: "gemini-12v-7-2ah-battery", name: "Gemini Gate Motor Battery 12V 7.2Ah", price: "299", brand: "Gemini", categoryHint: "battery", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-12v-7-2ah-battery-backup-power-shop.jpg?v=1741693997", description: "Gemini 12V 7.2Ah battery for gate motors and alarms." },
  
  // Page 6 - Final products
  { slug: "sentry-safety-wireless-gate-beams", name: "Sentry Safety Wireless Gate Beams", price: "499", brand: "Sentry", categoryHint: "beam", imageUrl: "https://alectra.co.za/cdn/shop/files/sentry-safety-wireless-gate-beams.jpg?v=1742051081", description: "Wireless infrared safety beams for gates." },
  { slug: "e-t-nice-7-monitor-only", name: "E.T Nice 7\" Monitor Only", price: "1860", compareAtPrice: "1999", brand: "E.T", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/et-nice-7-inch-monitor-only.jpg?v=1742051490", description: "7-inch monitor for E.T Nice intercom system." },
  { slug: "e-t-nice-colour-video-intercom-gate-station", name: "E.T Nice Colour Video Intercom Gate Station", price: "999", brand: "E.T", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/et-nice-colour-video-intercom-gate-station.jpg?v=1742051810", description: "Color video intercom gate station." },
  { slug: "e-t-nice-7-monitor-intercom-gate-station-full-kit", name: "E.T Nice 7\" Monitor & Intercom Gate Station Full Kit", price: "3060", brand: "E.T", categoryHint: "intercom", imageUrl: "https://alectra.co.za/cdn/shop/files/et-nice-7-inch-monitor-intercom-gate-station-full-kit.jpg?v=1742052017", description: "Complete 7-inch monitor and gate station intercom kit." },
  { slug: "gemini-pcb-v-90", name: "Gemini PCB V.90", price: "815", brand: "Gemini", categoryHint: "pcb", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-pcb-v90-gate-motor-control-board.jpg?v=1742205317", description: "V.90 control board for Gemini gate motors." },
  { slug: "gemini-power-supply-12v-solar-compatible", name: "Gemini Power Supply 12V Solar Compatible", price: "415", compareAtPrice: "699", brand: "Gemini", categoryHint: "charger", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-12v-solar-compatible-power-supply.jpg?v=1742205666", description: "Solar compatible 12V power supply for gate automation." },
  { slug: "gemini-pcb-v-90-gemlink-smart-device", name: "Gemini PCB V.90 + Gemlink Smart Device", price: "1531", compareAtPrice: "1999", brand: "Gemini", categoryHint: "pcb", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-pcb-v90-gemlink-smart-device.jpg?v=1742205896", description: "PCB V.90 with Bluetooth & WiFi smart device combo." },
  { slug: "pcb-shaft-encoder", name: "PCB Shaft Encoder", price: "46", categoryHint: "pcb", imageUrl: "https://alectra.co.za/cdn/shop/files/pcb-shaft-encoder-wireless.jpg?v=1743682310", description: "Wireless shaft encoding pickup circuit board." },
  { slug: "gemini-hex-coupling-and-disc", name: "Gemini HEX Coupling and Disc", price: "50", brand: "Gemini", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-hex-coupling-disc.png?v=1743682990", description: "Heavy-duty motor coupling for gate automation." },
  { slug: "nemtek-electric-fence-aluminium-ferrules-6mm-100-pack", name: "Nemtek Electric Fence Aluminium Ferrules – 6mm (100 Pack)", price: "69", brand: "Nemtek", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/nemtek-electric-fence-aluminium-ferrules-6mm-100pack.png?v=1744889394", description: "100-pack 6mm aluminium ferrules for electric fencing." },
  { slug: "nemtek-spring-hook-large-tail-2mm-50-pack", name: "Nemtek Spring Hook Large Tail 2mm 50 Pack", price: "69", brand: "Nemtek", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/nemtek-spring-hook-large-tail-2mm-50-pack.png?v=1744889974", description: "50-pack spring hooks for electric fence installation." },
  { slug: "stainless-steel-tension-springs-with-limiters-50-pack", name: "Stainless Steel Tension Springs With Limiters - 50 Pack", price: "220", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/stainless-steel-tension-springs-with-limiters-50-pack.jpg?v=1744890854", description: "50-pack stainless steel tension springs with limiters." },
  { slug: "nemtek-compression-spring-1-silver-5kg-black-50-box", name: "Nemtek Compression Spring 1 Silver 5kg Black - 50 Box", price: "220", brand: "Nemtek", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/nemtek-compression-spring-1-silver-5kg-black-50-box.jpg?v=1744896025", description: "Box of 50 compression springs for electric fencing." },
  { slug: "nemtek-hybrid-compression-spring-2-8kg-gold-black-50-pack", name: "Nemtek Hybrid Compression Spring 2 (8kg Gold) Black – 50 Pack", price: "400", brand: "Nemtek", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/nemtek-hybrid-compression-spring-8kg-gold-black-50-pack.jpg?v=1745061773", description: "50-pack 8kg hybrid compression springs." },
  { slug: "nemtek-electric-fence-high-voltage-timed-warning-light-blue", name: "Nemtek Electric Fence High Voltage Timed Warning Light – Blue", price: "140", brand: "Nemtek", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/nemtek-electric-fence-high-voltage-timed-blue-warning-light.png?v=1756305699", description: "Blue LED warning light for electric fences." },
  { slug: "jva-high-voltage-electric-fence-warning-light-red-led", name: "JVA High Voltage Electric Fence Warning Light – Red LED", price: "120", brand: "JVA", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/jva-red-electric-fence-warning-light-led.png?v=1756305616", description: "Red LED warning light for electric fence systems." },
  { slug: "jva-high-voltage-fence-warning-light-blue-led", name: "JVA High Voltage Fence Warning Light – Blue LED", price: "120", brand: "JVA", categoryHint: "accessories", imageUrl: "https://alectra.co.za/cdn/shop/files/jva-blue-electric-fence-warning-light-led.png?v=1756298160", description: "Blue LED warning light for electric fences." },
];

// Helper function to determine category from hints
function getCategorySlug(hint: string): string {
  const normalized = hint.toLowerCase();
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return 'gate-motor-kits'; // Default fallback to existing category
}

// Download image with retry logic
async function downloadImage(url: string, slug: string): Promise<string | null> {
  const imageDir = path.join(__dirname, '..', 'attached_assets', 'products');
  
  // Ensure directory exists
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  // Extract file extension from URL
  const ext = url.includes('.png') ? '.png' : url.includes('.jpg') ? '.jpg' : '.png';
  const filename = `${slug}${ext}`;
  const filepath = path.join(imageDir, filename);

  // Skip if already downloaded
  if (fs.existsSync(filepath)) {
    console.log(`  ✓ Cached: ${filename}`);
    return `attached_assets/products/${filename}`;
  }

  try {
    const response = await fetch(url.split('?')[0]); // Remove query params
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    
    console.log(`  ✓ Downloaded: ${filename}`);
    return `attached_assets/products/${filename}`;
  } catch (error) {
    console.error(`  ✗ Failed: ${slug} - ${error}`);
    return null;
  }
}

// Main migration function
async function migrateProducts() {
  console.log('🚀 Starting Alectra Products Migration\n');

  // Step 1: Get category IDs
  console.log('📂 Resolving category IDs...');
  const categoryMap = new Map<string, string>();
  
  const allCategories = await db.select().from(categories);
  for (const cat of allCategories) {
    categoryMap.set(cat.slug, cat.id);
  }
  console.log(`  Found ${categoryMap.size} categories\n`);

  // Step 2: Download images with concurrency limit
  console.log('📥 Downloading product images (max 5 concurrent)...');
  const limit = pLimit(5);
  
  const downloadPromises = RAW_PRODUCTS.map(product =>
    limit(() => downloadImage(product.imageUrl, product.slug))
  );
  
  const downloadedImages = await Promise.all(downloadPromises);
  const successfulDownloads = downloadedImages.filter(img => img !== null).length;
  console.log(`  Downloaded: ${successfulDownloads}/${RAW_PRODUCTS.length} images\n`);

  // Step 3: Prepare products for database insertion
  console.log('🔄 Preparing products for insertion...');
  const productsToInsert = [];
  
  for (let i = 0; i < RAW_PRODUCTS.length; i++) {
    const raw = RAW_PRODUCTS[i];
    const localImage = downloadedImages[i];
    
    const categorySlug = getCategorySlug(raw.categoryHint);
    const categoryId = categoryMap.get(categorySlug) || categoryMap.get('gate-motor-kits')!;

    // Generate unique SKU using index to ensure no duplicates
    const sku = `ALEC-${String(i + 1).padStart(4, '0')}-${raw.slug.toUpperCase().replace(/-/g, '_').substring(0, 30)}`;
    
    // Ensure brand is provided
    const brand = raw.brand || 'Alectra';
    
    // Use first image as main imageUrl
    const imageUrl = localImage || 'attached_assets/placeholder.png';

    productsToInsert.push({
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      price: raw.price,
      categoryId,
      imageUrl,
      images: localImage ? [localImage] : [],
      brand,
      sku,
      stock: 100,
      featured: false,
    });
  }

  // Step 4: Bulk insert in batches
  console.log('💾 Inserting products into database...');
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const batch = productsToInsert.slice(i, i + BATCH_SIZE);
    
    try {
      await db.insert(products).values(batch);
      inserted += batch.length;
      console.log(`  Inserted batch: ${inserted}/${productsToInsert.length}`);
    } catch (error) {
      console.error(`  Error inserting batch:`, error);
    }
  }

  console.log('\n✅ Migration Complete!');
  console.log(`   Products: ${inserted}/${RAW_PRODUCTS.length}`);
  console.log(`   Images: ${successfulDownloads}/${RAW_PRODUCTS.length}`);
  console.log(`   Categories: ${categoryMap.size}`);
}

// Run migration
migrateProducts()
  .then(() => {
    console.log('\n✓ Success! All products migrated.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });
