import { storage } from "./storage";
import type { InsertCategory, InsertProduct } from "@shared/schema";

const categories: InsertCategory[] = [
  {
    name: "Batteries",
    slug: "batteries",
    description: "Backup power batteries for gate motors, alarms, and security systems",
    imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=800&q=80",
    productCount: 0
  },
  {
    name: "CCTV Systems",
    slug: "cctv",
    description: "Security cameras, DVRs, NVRs, and complete surveillance systems",
    imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80",
    productCount: 0
  },
  {
    name: "Electric Fencing",
    slug: "electric-fencing",
    description: "Electric fence energizers, wire, brackets, and accessories",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    productCount: 0
  },
  {
    name: "Electrical Components",
    slug: "electrical-components",
    description: "Electrical switches, circuit breakers, wiring, and components",
    imageUrl: "/stock_images/electrical_component_2e024008.jpg",
    productCount: 0
  },
  {
    name: "Garage Doors",
    slug: "garage-doors",
    description: "Automatic garage door motors and door openers for residential and commercial use",
    imageUrl: "/stock_images/automatic_garage_doo_7e6e2e70.jpg",
    productCount: 0
  },
  {
    name: "Garage Motors",
    slug: "garage-motors",
    description: "Sectional garage door motors and operators from leading brands",
    imageUrl: "/stock_images/garage_door_opener_m_15e4f163.jpg",
    productCount: 0
  },
  {
    name: "Gate Motors",
    slug: "gate-motors",
    description: "Swing and sliding gate motors from top brands including Centurion, ET Nice, and Digidoor",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    productCount: 0
  },
  {
    name: "Gate Motor Kits",
    slug: "gate-motor-kits",
    description: "Complete gate motor kits with remotes, batteries, and accessories",
    imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&q=80",
    productCount: 0
  },
  {
    name: "Intercoms",
    slug: "intercoms",
    description: "Video and audio intercom systems for homes and businesses",
    imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=800&q=80",
    productCount: 0
  },
  {
    name: "LP Gas",
    slug: "lp-gas",
    description: "LPG cylinders, regulators, and gas appliances",
    imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=800&q=80",
    productCount: 0
  },
  {
    name: "Remotes",
    slug: "remotes",
    description: "Gate and garage remote controls for all major brands",
    imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=800&q=80",
    productCount: 0
  }
];

async function seed() {
  console.log("Starting database seed...");

  // Create categories
  const createdCategories = await Promise.all(
    categories.map(cat => storage.createCategory(cat))
  );

  console.log(`Created ${createdCategories.length} categories`);

  // Gate Motors (25 products)
  const gateMotorsCategory = createdCategories.find(c => c.slug === "gate-motors")!;
  const gateMotors: InsertProduct[] = [
    {
      name: "Centurion D5 Evo Smart Gate Motor",
      slug: "centurion-d5-evo-smart",
      description: "Advanced swing gate motor with smartphone control, obstacle detection, and soft start/stop technology. Suitable for gates up to 250kg.",
      price: "3499.00",
      brand: "Centurion",
      sku: "CENT-D5-EVO",
      categoryId: gateMotorsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      images: [],
      stock: 15,
      featured: true,
      specifications: "Max gate weight: 250kg\nPower supply: 220V AC\nDuty cycle: 50%\nOpening time: 12-15 seconds"
    },
    {
      name: "Centurion D10 Smart Sliding Gate Motor",
      slug: "centurion-d10-smart-sliding",
      description: "High-performance sliding gate motor with advanced security features and solar compatibility. Perfect for heavy gates up to 500kg.",
      price: "4299.00",
      brand: "Centurion",
      sku: "CENT-D10-SMART",
      categoryId: gateMotorsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      images: [],
      stock: 12,
      featured: true
    },
    {
      name: "ET Nice WalkyKit 1024 Swing Gate Motor",
      slug: "et-nice-walkykit-1024",
      description: "Compact and reliable swing gate motor kit with 2 remotes. Ideal for residential gates up to 200kg.",
      price: "2899.00",
      brand: "ET Nice",
      sku: "NICE-WALK-1024",
      categoryId: gateMotorsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      images: [],
      stock: 20
    },
    {
      name: "Centurion Vantage 500 Sliding Motor",
      slug: "centurion-vantage-500",
      description: "Economical sliding gate motor for gates up to 500kg. Includes battery backup socket.",
      price: "3799.00",
      brand: "Centurion",
      sku: "CENT-VANT-500",
      categoryId: gateMotorsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      images: [],
      stock: 8
    },
    {
      name: "Gemini DC Swing Gate Motor",
      slug: "gemini-dc-swing",
      description: "24V DC swing gate motor with built-in battery backup. Ultra-quiet operation.",
      price: "2699.00",
      brand: "Gemini",
      sku: "GEM-DC-SWING",
      categoryId: gateMotorsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      images: [],
      stock: 18
    },
    { name: "Digidoor Smart Sliding Motor", slug: "digidoor-smart-sliding", description: "Smart sliding gate motor with app control and auto-close timer", price: "3899.00", brand: "Digidoor", sku: "DIGI-SLIDE-SMART", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 10 },
    { name: "Centurion D2 Turbo Swing Motor", slug: "centurion-d2-turbo", description: "High-speed swing gate motor for lighter gates up to 180kg", price: "2399.00", brand: "Centurion", sku: "CENT-D2-TURBO", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 25 },
    { name: "Centurion G-Swing 4 Motor", slug: "centurion-gswing-4", description: "Economy swing gate motor for residential use", price: "1999.00", brand: "Centurion", sku: "CENT-GSWIN-4", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 30 },
    { name: "Hansa Solar Swing Motor", slug: "hansa-solar-swing", description: "Solar-powered swing gate motor with battery backup", price: "4299.00", brand: "Hansa", sku: "HANS-SOL-SWING", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 8 },
    { name: "ET Nice Hyppo 7024 Sliding Motor", slug: "nice-hyppo-7024", description: "Heavy-duty sliding motor for gates up to 700kg", price: "5499.00", brand: "ET Nice", sku: "NICE-HYP-7024", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 6 },
    { name: "Gemini Pro Sliding Motor 400kg", slug: "gemini-pro-sliding-400", description: "Professional sliding gate motor with obstacle detection", price: "3299.00", brand: "Gemini", sku: "GEM-PRO-SL400", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 14 },
    { name: "Centurion Sectional Garage Motor D5", slug: "centurion-garage-d5", description: "Sectional garage door motor with smart features", price: "3199.00", brand: "Centurion", sku: "CENT-GAR-D5", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 12 },
    { name: "Centurion SDO4 T12 Smart Kit", slug: "centurion-sdo4-t12", description: "Complete garage motor kit with 2 remotes", price: "3599.00", brand: "Centurion", sku: "CENT-SDO4-T12", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 15 },
    { name: "Digidoor Mega Swing 300kg", slug: "digidoor-mega-swing-300", description: "Powerful swing motor for heavy residential gates", price: "3499.00", brand: "Digidoor", sku: "DIGI-MEGA-300", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 11 },
    { name: "ET Nice Robus 600 Sliding", slug: "nice-robus-600", description: "Industrial sliding gate motor for gates up to 600kg", price: "4899.00", brand: "ET Nice", sku: "NICE-ROB-600", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 7 },
    { name: "Hansa Swing 250 Motor", slug: "hansa-swing-250", description: "Reliable swing motor with soft start technology", price: "2899.00", brand: "Hansa", sku: "HANS-SW-250", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 16 },
    { name: "Gemini Ultra Slide 800", slug: "gemini-ultra-slide-800", description: "Heavy-duty sliding motor for industrial applications", price: "6299.00", brand: "Gemini", sku: "GEM-ULT-SL800", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 4 },
    { name: "Centurion Vector 2 Swing", slug: "centurion-vector-2", description: "Budget-friendly swing motor for light gates", price: "1799.00", brand: "Centurion", sku: "CENT-VEC-2", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 28 },
    { name: "Digidoor Eco Slide 350", slug: "digidoor-eco-slide-350", description: "Economical sliding motor for residential use", price: "2799.00", brand: "Digidoor", sku: "DIGI-ECO-SL350", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 19 },
    { name: "ET Nice Spin 6041 Swing", slug: "nice-spin-6041", description: "Compact swing motor for tight spaces", price: "2499.00", brand: "ET Nice", sku: "NICE-SPIN-6041", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 22 },
    { name: "Hansa Pro Sliding 500", slug: "hansa-pro-sliding-500", description: "Professional sliding motor with safety sensors", price: "4199.00", brand: "Hansa", sku: "HANS-PRO-SL500", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 9 },
    { name: "Gemini Smart Swing 200", slug: "gemini-smart-swing-200", description: "WiFi-enabled swing motor with mobile app", price: "3199.00", brand: "Gemini", sku: "GEM-SM-SW200", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 13 },
    { name: "Centurion Classic Swing", slug: "centurion-classic-swing", description: "Proven reliable swing motor, 10+ years in the market", price: "2199.00", brand: "Centurion", sku: "CENT-CLAS-SW", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 24 },
    { name: "Digidoor Fast Slide Turbo", slug: "digidoor-fast-slide-turbo", description: "High-speed sliding motor with quick open time", price: "3999.00", brand: "Digidoor", sku: "DIGI-FAST-TURBO", categoryId: gateMotorsCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 10 }
  ];

  // Gate Motor Kits (20 products)
  const kitsCategory = createdCategories.find(c => c.slug === "gate-motor-kits")!;
  const kits: InsertProduct[] = [
    {
      name: "Centurion D5 Evo Smart Full Kit",
      slug: "centurion-d5-evo-full-kit",
      description: "Complete kit including D5 Evo motor, 2 Nova remotes, 7.2Ah battery, and photocells. Everything needed for installation.",
      price: "4999.00",
      brand: "Centurion",
      sku: "CENT-D5-KIT",
      categoryId: kitsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80",
      images: [],
      stock: 10,
      featured: true
    },
    {
      name: "Gemini 12V Gate Motor Complete Kit",
      slug: "gemini-12v-complete-kit",
      description: "Budget-friendly complete kit with motor, 2 remotes, battery, and basic accessories.",
      price: "3999.00",
      brand: "Gemini",
      sku: "GEM-12V-KIT",
      categoryId: kitsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80",
      images: [],
      stock: 15,
      featured: true
    },
    { name: "Centurion D10 Turbo Sliding Kit", slug: "centurion-d10-turbo-kit", description: "Complete D10 Turbo kit with all accessories for sliding gates", price: "5499.00", brand: "Centurion", sku: "CENT-D10T-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 8 },
    { name: "ET Nice WalkyKit Complete", slug: "nice-walkykit-complete", description: "Full Nice swing motor kit with photocells", price: "3699.00", brand: "ET Nice", sku: "NICE-WALK-COMP", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 12 },
    { name: "Digidoor Premium Kit", slug: "digidoor-premium-kit", description: "Premium kit with solar panel option", price: "5999.00", brand: "Digidoor", sku: "DIGI-PREM-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 6 },
    { name: "Hansa Swing Complete Kit", slug: "hansa-swing-complete", description: "All-inclusive swing motor kit", price: "4299.00", brand: "Hansa", sku: "HANS-SW-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 10 },
    { name: "Gemini Sliding Motor Kit Pro", slug: "gemini-sliding-kit-pro", description: "Professional sliding kit with 4 remotes", price: "4799.00", brand: "Gemini", sku: "GEM-SLIDE-KITP", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 11 },
    { name: "Centurion G-Swing Kit", slug: "centurion-gswing-kit", description: "Economy swing kit for budget installations", price: "2799.00", brand: "Centurion", sku: "CENT-GSW-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 18 },
    { name: "Digidoor Smart Kit Plus", slug: "digidoor-smart-kit-plus", description: "Smart kit with WiFi module included", price: "4899.00", brand: "Digidoor", sku: "DIGI-SM-KITP", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 9 },
    { name: "ET Nice Sliding Mega Kit", slug: "nice-sliding-mega-kit", description: "Heavy-duty sliding kit for large gates", price: "6299.00", brand: "ET Nice", sku: "NICE-SLIDE-MEGA", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 5 },
    { name: "Hansa Solar Complete Kit", slug: "hansa-solar-complete", description: "Solar-powered complete kit", price: "5499.00", brand: "Hansa", sku: "HANS-SOL-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 7 },
    { name: "Centurion Vantage Sliding Kit", slug: "centurion-vantage-kit", description: "Mid-range sliding motor complete kit", price: "4499.00", brand: "Centurion", sku: "CENT-VANT-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 13 },
    { name: "Gemini Eco Swing Kit", slug: "gemini-eco-swing-kit", description: "Affordable swing motor starter kit", price: "2999.00", brand: "Gemini", sku: "GEM-ECO-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 16 },
    { name: "Digidoor Turbo Slide Kit", slug: "digidoor-turbo-slide-kit", description: "Fast-opening sliding motor kit", price: "4599.00", brand: "Digidoor", sku: "DIGI-TURBO-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 10 },
    { name: "ET Nice Robus Kit", slug: "nice-robus-kit", description: "Industrial-grade sliding kit", price: "5799.00", brand: "ET Nice", sku: "NICE-ROB-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 6 },
    { name: "Hansa Pro Swing Kit", slug: "hansa-pro-swing-kit", description: "Professional swing installation kit", price: "3899.00", brand: "Hansa", sku: "HANS-PROSW-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 12 },
    { name: "Centurion SDO4 Complete Kit", slug: "centurion-sdo4-complete", description: "Garage motor complete installation kit", price: "3999.00", brand: "Centurion", sku: "CENT-SDO4-COMP", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 14 },
    { name: "Gemini Ultra Kit", slug: "gemini-ultra-kit", description: "Top-of-the-line complete kit with all features", price: "6999.00", brand: "Gemini", sku: "GEM-ULTRA-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 4 },
    { name: "Digidoor Basic Starter Kit", slug: "digidoor-basic-starter", description: "Entry-level motor kit", price: "2499.00", brand: "Digidoor", sku: "DIGI-BASIC-KIT", categoryId: kitsCategory.id, imageUrl: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80", images: [], stock: 20 }
  ];

  // Batteries (25 products)
  const batteriesCategory = createdCategories.find(c => c.slug === "batteries")!;
  const batteries: InsertProduct[] = [
    {
      name: "Gemini 12V 7.2Ah Sealed Lead-Acid Battery",
      slug: "gemini-12v-7-2ah-battery",
      description: "Reliable backup power battery for gate motors and alarm systems. Long lifespan and maintenance-free.",
      price: "299.00",
      brand: "Gemini",
      sku: "GEM-12V-7.2AH",
      categoryId: batteriesCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80",
      images: [],
      stock: 50,
      featured: true
    },
    {
      name: "Raylite 12V 9Ah Lithium Battery",
      slug: "raylite-12v-9ah-lithium",
      description: "Lithium-ion battery with longer lifespan and faster charging. 3x longer life than lead-acid.",
      price: "899.00",
      brand: "Raylite",
      sku: "RAY-LI-9AH",
      categoryId: batteriesCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80",
      images: [],
      stock: 30,
      featured: true
    },
    {
      name: "Gemini 12V 12Ah Deep Cycle Battery",
      slug: "gemini-12v-12ah-battery",
      description: "Heavy-duty 12Ah battery for extended backup power. Ideal for high-usage applications.",
      price: "449.00",
      brand: "Gemini",
      sku: "GEM-12V-12AH",
      categoryId: batteriesCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80",
      images: [],
      stock: 40
    },
    { name: "Raylite 12V 12Ah Lithium", slug: "raylite-12v-12ah-lithium", description: "Premium lithium battery with 5-year warranty", price: "1099.00", brand: "Raylite", sku: "RAY-LI-12AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 25 },
    { name: "Gemini 12V 18Ah Battery", slug: "gemini-12v-18ah", description: "Extra capacity for long power outages", price: "599.00", brand: "Gemini", sku: "GEM-12V-18AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 35 },
    { name: "Century 12V 5Ah Battery", slug: "century-12v-5ah", description: "Compact battery for alarm systems", price: "199.00", brand: "Century", sku: "CENT-12V-5AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 60 },
    { name: "Raylite 24V 10Ah Lithium", slug: "raylite-24v-10ah", description: "24V lithium battery for high-voltage systems", price: "1699.00", brand: "Raylite", sku: "RAY-LI-24V", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 15 },
    { name: "Gemini 12V 9Ah Battery", slug: "gemini-12v-9ah", description: "Mid-range capacity for standard setups", price: "349.00", brand: "Gemini", sku: "GEM-12V-9AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 45 },
    { name: "Century 12V 7Ah Sealed", slug: "century-12v-7ah", description: "Economical sealed lead-acid battery", price: "249.00", brand: "Century", sku: "CENT-12V-7AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 55 },
    { name: "Raylite 12V 15Ah Lithium", slug: "raylite-12v-15ah-lithium", description: "High-capacity lithium with fast charge", price: "1399.00", brand: "Raylite", sku: "RAY-LI-15AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 20 },
    { name: "Gemini 12V 26Ah Deep Cycle", slug: "gemini-12v-26ah", description: "Maximum capacity for extended backup", price: "799.00", brand: "Gemini", sku: "GEM-12V-26AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 28 },
    { name: "Century 12V 12Ah AGM", slug: "century-12v-12ah-agm", description: "AGM technology for better performance", price: "499.00", brand: "Century", sku: "CENT-12V-12AGM", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 38 },
    { name: "Raylite 12V 20Ah Lithium", slug: "raylite-12v-20ah", description: "Premium capacity lithium battery", price: "1799.00", brand: "Raylite", sku: "RAY-LI-20AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 18 },
    { name: "Gemini 12V 4.5Ah Battery", slug: "gemini-12v-4-5ah", description: "Small battery for low-power devices", price: "179.00", brand: "Gemini", sku: "GEM-12V-4.5AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 70 },
    { name: "Century 12V 9Ah Sealed", slug: "century-12v-9ah", description: "Standard 9Ah sealed battery", price: "329.00", brand: "Century", sku: "CENT-12V-9AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 42 },
    { name: "Raylite 12V 8Ah Lithium", slug: "raylite-12v-8ah-lithium", description: "Compact lithium for space-constrained installations", price: "799.00", brand: "Raylite", sku: "RAY-LI-8AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 32 },
    { name: "Gemini 12V 14Ah Battery", slug: "gemini-12v-14ah", description: "Extended runtime battery", price: "529.00", brand: "Gemini", sku: "GEM-12V-14AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 36 },
    { name: "Century 12V 18Ah Deep Cycle", slug: "century-12v-18ah", description: "Heavy-duty deep cycle battery", price: "649.00", brand: "Century", sku: "CENT-12V-18DC", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 30 },
    { name: "Raylite 12V 7Ah Lithium", slug: "raylite-12v-7ah-lithium", description: "Entry-level lithium battery", price: "699.00", brand: "Raylite", sku: "RAY-LI-7AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 35 },
    { name: "Gemini 12V 22Ah Battery", slug: "gemini-12v-22ah", description: "High-capacity sealed lead-acid", price: "699.00", brand: "Gemini", sku: "GEM-12V-22AH", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 26 },
    { name: "Century 12V 15Ah AGM", slug: "century-12v-15ah-agm", description: "AGM battery with long lifespan", price: "579.00", brand: "Century", sku: "CENT-12V-15AGM", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 33 },
    { name: "Raylite 12V 25Ah Lithium Pro", slug: "raylite-12v-25ah-pro", description: "Professional-grade high-capacity lithium", price: "2199.00", brand: "Raylite", sku: "RAY-LI-25PRO", categoryId: batteriesCategory.id, imageUrl: "https://images.unsplash.com/photo-1609069859366-6a16c6e7fe32?w=600&q=80", images: [], stock: 12 }
  ];

  // Remotes (20 products)
  const remotesCategory = createdCategories.find(c => c.slug === "remotes")!;
  const remotes: InsertProduct[] = [
    {
      name: "Centurion Nova 1 Button Remote",
      slug: "centurion-nova-1-button",
      description: "Single button remote control compatible with all Centurion gate motors.",
      price: "189.00",
      brand: "Centurion",
      sku: "CENT-NOVA-1",
      categoryId: remotesCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80",
      images: [],
      stock: 100
    },
    {
      name: "Centurion Nova 4 Button Remote",
      slug: "centurion-nova-4-button",
      description: "4-channel remote for controlling multiple gates or devices.",
      price: "249.00",
      brand: "Centurion",
      sku: "CENT-NOVA-4",
      categoryId: remotesCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80",
      images: [],
      stock: 80
    },
    {
      name: "ET Nice FLO2R-S Remote",
      slug: "et-nice-flo2r-s",
      description: "2-button Nice remote with rolling code technology for enhanced security.",
      price: "199.00",
      brand: "ET Nice",
      sku: "NICE-FLO2R-S",
      categoryId: remotesCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80",
      images: [],
      stock: 75
    },
    { name: "Gemini 2-Button Remote", slug: "gemini-2-button", description: "Compatible with Gemini gate motors", price: "169.00", brand: "Gemini", sku: "GEM-REM-2B", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 90 },
    { name: "Digidoor 4-Channel Remote", slug: "digidoor-4-channel", description: "Multi-device control remote", price: "229.00", brand: "Digidoor", sku: "DIGI-REM-4CH", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 70 },
    { name: "Hansa Single Button", slug: "hansa-single-button", description: "Simple one-button remote", price: "149.00", brand: "Hansa", sku: "HANS-REM-1B", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 85 },
    { name: "Centurion Elite Keyfob", slug: "centurion-elite-keyfob", description: "Compact keychain remote", price: "219.00", brand: "Centurion", sku: "CENT-ELITE-KEY", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 65 },
    { name: "ET Nice FLO4R-S Remote", slug: "nice-flo4r-s", description: "4-channel Nice remote", price: "259.00", brand: "ET Nice", sku: "NICE-FLO4R-S", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 60 },
    { name: "Gemini Pro 4-Button", slug: "gemini-pro-4-button", description: "Professional 4-button remote", price: "239.00", brand: "Gemini", sku: "GEM-PRO-4B", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 55 },
    { name: "Digidoor Smart Remote", slug: "digidoor-smart-remote", description: "Smartphone-style remote control", price: "299.00", brand: "Digidoor", sku: "DIGI-SMART-REM", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 45 },
    { name: "Hansa 2-Button Remote", slug: "hansa-2-button", description: "Dual function remote", price: "179.00", brand: "Hansa", sku: "HANS-REM-2B", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 72 },
    { name: "Centurion Vox 2-Button", slug: "centurion-vox-2", description: "Voice feedback remote", price: "279.00", brand: "Centurion", sku: "CENT-VOX-2", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 50 },
    { name: "ET Nice ONE Remote", slug: "nice-one-remote", description: "Universal Nice ONE platform remote", price: "189.00", brand: "ET Nice", sku: "NICE-ONE-REM", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 80 },
    { name: "Gemini Eco Remote", slug: "gemini-eco-remote", description: "Budget-friendly remote option", price: "139.00", brand: "Gemini", sku: "GEM-ECO-REM", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 95 },
    { name: "Digidoor 6-Button Remote", slug: "digidoor-6-button", description: "Maximum control with 6 channels", price: "319.00", brand: "Digidoor", sku: "DIGI-REM-6B", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 40 },
    { name: "Hansa Pro Remote", slug: "hansa-pro-remote", description: "Professional remote with LED indicator", price: "249.00", brand: "Hansa", sku: "HANS-PRO-REM", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 58 },
    { name: "Centurion Xtra 1-Button", slug: "centurion-xtra-1", description: "Extra range 1-button remote", price: "209.00", brand: "Centurion", sku: "CENT-XTR-1B", categoryId: remotesCategory.id, imageUrl: "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&q=80", images: [], stock: 68 }
  ];

  // CCTV Systems (30 products)
  const cctvCategory = createdCategories.find(c => c.slug === "cctv")!;
  const cctv: InsertProduct[] = [
    {
      name: "Hikvision 2MP Turret Camera",
      slug: "hikvision-2mp-turret",
      description: "2MP HD turret camera with 30m night vision and weatherproof housing. Perfect for outdoor security.",
      price: "899.00",
      brand: "Hikvision",
      sku: "HIK-2MP-TURRET",
      categoryId: cctvCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
      images: [],
      stock: 35,
      featured: true
    },
    {
      name: "Hilook 2MP Full Colour VU Bullet Camera",
      slug: "hilook-2mp-full-colour",
      description: "Full-color night vision camera with built-in LED illumination. Crystal clear footage 24/7.",
      price: "1099.00",
      brand: "Hilook",
      sku: "HILOOK-2MP-VU",
      categoryId: cctvCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
      images: [],
      stock: 25,
      featured: true
    },
    {
      name: "Hikvision 4CH DVR Kit with 4 Cameras",
      slug: "hikvision-4ch-dvr-kit",
      description: "Complete 4-channel DVR system with 4x 2MP cameras, cables, and power supply.",
      price: "4999.00",
      brand: "Hikvision",
      sku: "HIK-4CH-KIT",
      categoryId: cctvCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
      images: [],
      stock: 12
    },
    {
      name: "Hikvision 8CH NVR",
      slug: "hikvision-8ch-nvr",
      description: "8-channel Network Video Recorder with H.265+ compression. Supports up to 8MP cameras.",
      price: "2499.00",
      brand: "Hikvision",
      sku: "HIK-8CH-NVR",
      categoryId: cctvCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80",
      images: [],
      stock: 18
    },
    { name: "Hikvision 4MP Dome Camera", slug: "hikvision-4mp-dome", description: "4MP high-resolution dome camera", price: "1199.00", brand: "Hikvision", sku: "HIK-4MP-DOME", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 28 },
    { name: "Hilook 4MP Bullet Camera", slug: "hilook-4mp-bullet", description: "Long-range bullet camera with IR", price: "999.00", brand: "Hilook", sku: "HILOOK-4MP-BUL", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 32 },
    { name: "Hikvision 16CH DVR", slug: "hikvision-16ch-dvr", description: "16-channel DVR for large installations", price: "3499.00", brand: "Hikvision", sku: "HIK-16CH-DVR", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 10 },
    { name: "Hilook PTZ Camera", slug: "hilook-ptz-camera", description: "Pan-tilt-zoom camera with remote control", price: "3999.00", brand: "Hilook", sku: "HILOOK-PTZ", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 8 },
    { name: "Hikvision 8MP 4K Camera", slug: "hikvision-8mp-4k", description: "Ultra HD 4K security camera", price: "2199.00", brand: "Hikvision", sku: "HIK-8MP-4K", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 15 },
    { name: "Hilook 8CH DVR Kit", slug: "hilook-8ch-dvr-kit", description: "8-camera complete surveillance system", price: "6999.00", brand: "Hilook", sku: "HILOOK-8CH-KIT", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 9 },
    { name: "Hikvision Audio Camera", slug: "hikvision-audio-camera", description: "Camera with built-in microphone", price: "1299.00", brand: "Hikvision", sku: "HIK-AUDIO-CAM", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 22 },
    { name: "Hilook Fisheye Camera", slug: "hilook-fisheye", description: "360-degree panoramic camera", price: "2799.00", brand: "Hilook", sku: "HILOOK-FISHEYE", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 12 },
    { name: "Hikvision 32CH NVR", slug: "hikvision-32ch-nvr", description: "Enterprise 32-channel NVR", price: "6999.00", brand: "Hikvision", sku: "HIK-32CH-NVR", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 5 },
    { name: "Hilook Vandal Dome", slug: "hilook-vandal-dome", description: "Vandal-proof dome camera", price: "1399.00", brand: "Hilook", sku: "HILOOK-VANDAL", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 20 },
    { name: "Hikvision Colorvu Camera", slug: "hikvision-colorvu", description: "24/7 color imaging technology", price: "1699.00", brand: "Hikvision", sku: "HIK-COLORVU", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 18 },
    { name: "Hilook License Plate Camera", slug: "hilook-lpr-camera", description: "Specialized license plate recognition", price: "3299.00", brand: "Hilook", sku: "HILOOK-LPR", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 7 },
    { name: "Hikvision Mini Dome", slug: "hikvision-mini-dome", description: "Compact dome camera for tight spaces", price: "799.00", brand: "Hikvision", sku: "HIK-MINI-DOME", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 30 },
    { name: "Hilook 2TB HDD", slug: "hilook-2tb-hdd", description: "Surveillance-grade hard drive", price: "1299.00", brand: "Hilook", sku: "HILOOK-2TB-HDD", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 25 },
    { name: "Hikvision WiFi Camera", slug: "hikvision-wifi-camera", description: "Wireless IP camera", price: "1499.00", brand: "Hikvision", sku: "HIK-WIFI-CAM", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 24 },
    { name: "Hilook Solar Camera", slug: "hilook-solar-camera", description: "Solar-powered wireless camera", price: "2499.00", brand: "Hilook", sku: "HILOOK-SOLAR", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 11 },
    { name: "Hikvision Thermal Camera", slug: "hikvision-thermal", description: "Thermal imaging camera", price: "8999.00", brand: "Hikvision", sku: "HIK-THERMAL", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 3 },
    { name: "Hilook Indoor Dome", slug: "hilook-indoor-dome", description: "Compact indoor dome camera", price: "699.00", brand: "Hilook", sku: "HILOOK-INDOOR", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 35 },
    { name: "Hikvision PoE Switch 8-Port", slug: "hikvision-poe-switch-8", description: "Power over Ethernet switch", price: "1899.00", brand: "Hikvision", sku: "HIK-POE-8", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 16 },
    { name: "Hilook 4TB HDD", slug: "hilook-4tb-hdd", description: "Large capacity storage drive", price: "2299.00", brand: "Hilook", sku: "HILOOK-4TB-HDD", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 20 },
    { name: "Hikvision Baby Monitor", slug: "hikvision-baby-monitor", description: "WiFi baby monitor camera", price: "899.00", brand: "Hikvision", sku: "HIK-BABY-MON", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 18 },
    { name: "Hilook Outdoor PTZ", slug: "hilook-outdoor-ptz", description: "Weatherproof PTZ camera", price: "4499.00", brand: "Hilook", sku: "HILOOK-OUT-PTZ", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 6 },
    { name: "Hikvision NVR Pro 16CH", slug: "hikvision-nvr-pro-16", description: "Professional 16-channel NVR with AI", price: "4999.00", brand: "Hikvision", sku: "HIK-NVR-PRO16", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 8 },
    { name: "Hilook Doorbell Camera", slug: "hilook-doorbell", description: "Video doorbell with two-way audio", price: "1199.00", brand: "Hilook", sku: "HILOOK-DOORBELL", categoryId: cctvCategory.id, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80", images: [], stock: 22 }
  ];

  // Intercoms (15 products)
  const intercomsCategory = createdCategories.find(c => c.slug === "intercoms")!;
  const intercoms: InsertProduct[] = [
    {
      name: "Hikvision Video Intercom Kit",
      slug: "hikvision-video-intercom-kit",
      description: "7-inch touchscreen video intercom with door release and night vision camera.",
      price: "3299.00",
      brand: "Hikvision",
      sku: "HIK-VID-INT",
      categoryId: intercomsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80",
      images: [],
      stock: 10
    },
    {
      name: "Commax Audio Intercom System",
      slug: "commax-audio-intercom",
      description: "Reliable audio-only intercom for residential use. Simple installation.",
      price: "899.00",
      brand: "Commax",
      sku: "COMX-AUD-INT",
      categoryId: intercomsCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80",
      images: [],
      stock: 20
    },
    { name: "Dahua Video Doorbell", slug: "dahua-video-doorbell", description: "WiFi video doorbell intercom", price: "1599.00", brand: "Dahua", sku: "DAHUA-VID-DOOR", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 15 },
    { name: "Commax 2-Wire Video Kit", slug: "commax-2-wire-kit", description: "Simple 2-wire video intercom kit", price: "2199.00", brand: "Commax", sku: "COMX-2W-VID", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 12 },
    { name: "Hikvision IP Intercom", slug: "hikvision-ip-intercom", description: "Network-based IP intercom system", price: "3799.00", brand: "Hikvision", sku: "HIK-IP-INT", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 8 },
    { name: "Dahua Multi-Apartment System", slug: "dahua-multi-apartment", description: "Building-wide intercom solution", price: "8999.00", brand: "Dahua", sku: "DAHUA-MULTI-APT", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 4 },
    { name: "Commax Wireless Intercom", slug: "commax-wireless", description: "Wireless video intercom", price: "2799.00", brand: "Commax", sku: "COMX-WIRELESS", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 10 },
    { name: "Hikvision Gate Station", slug: "hikvision-gate-station", description: "Outdoor intercom station for gates", price: "2499.00", brand: "Hikvision", sku: "HIK-GATE-STAT", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 11 },
    { name: "Dahua Indoor Monitor", slug: "dahua-indoor-monitor", description: "10-inch touchscreen monitor", price: "1899.00", brand: "Dahua", sku: "DAHUA-MON-10", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 14 },
    { name: "Commax Villa Kit", slug: "commax-villa-kit", description: "Complete villa intercom package", price: "4299.00", brand: "Commax", sku: "COMX-VILLA-KIT", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 7 },
    { name: "Hikvision Access Control", slug: "hikvision-access-control", description: "Intercom with access control features", price: "3499.00", brand: "Hikvision", sku: "HIK-ACC-CTRL", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 9 },
    { name: "Dahua 2-Family Kit", slug: "dahua-2-family", description: "Duplex intercom system", price: "5499.00", brand: "Dahua", sku: "DAHUA-2FAM", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 6 },
    { name: "Commax Guard Plus", slug: "commax-guard-plus", description: "Enhanced security intercom", price: "2999.00", brand: "Commax", sku: "COMX-GUARD-PLUS", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 13 },
    { name: "Hikvision Apartment Kit", slug: "hikvision-apartment-kit", description: "Multi-unit residential solution", price: "6999.00", brand: "Hikvision", sku: "HIK-APT-KIT", categoryId: intercomsCategory.id, imageUrl: "https://images.unsplash.com/photo-1557825835-70d97c4aa567?w=600&q=80", images: [], stock: 5 }
  ];

  // Electric Fencing (25 products)
  const fencingCategory = createdCategories.find(c => c.slug === "electric-fencing")!;
  const fencing: InsertProduct[] = [
    {
      name: "Nemtek Druid 2X Energizer",
      slug: "nemtek-druid-2x",
      description: "2-zone electric fence energizer with LCD display. Monitors fence voltage and alerts on tampering.",
      price: "1899.00",
      brand: "Nemtek",
      sku: "NEMT-DRUID-2X",
      categoryId: fencingCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      images: [],
      stock: 15
    },
    {
      name: "8 Wire Angle Square Tube Bracket",
      slug: "8-wire-angle-bracket-black",
      description: "Angled electric fence bracket for wall-top installation. Galvanized steel construction.",
      price: "45.00",
      brand: "Generic",
      sku: "FENC-8W-ANGLE",
      categoryId: fencingCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      images: [],
      stock: 200
    },
    {
      name: "Electric Fence Wire 2.5mm (100m)",
      slug: "electric-fence-wire-2-5mm",
      description: "High-tensile galvanized wire for electric fencing. 100m roll.",
      price: "299.00",
      brand: "Generic",
      sku: "FENC-WIRE-100M",
      categoryId: fencingCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      images: [],
      stock: 50
    },
    { name: "Nemtek Druid 4X Energizer", slug: "nemtek-druid-4x", description: "4-zone electric fence energizer", price: "2899.00", brand: "Nemtek", sku: "NEMT-DRUID-4X", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 10 },
    { name: "Stafix X2 Energizer", slug: "stafix-x2-energizer", description: "Powerful 2-zone energizer", price: "1699.00", brand: "Stafix", sku: "STAF-X2-ENERG", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 14 },
    { name: "6 Wire Straight Bracket", slug: "6-wire-straight-bracket", description: "Straight electric fence bracket", price: "35.00", brand: "Generic", sku: "FENC-6W-STRAIGHT", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 250 },
    { name: "Insulators Pack of 100", slug: "fence-insulators-100", description: "Screw-in fence insulators", price: "149.00", brand: "Generic", sku: "FENC-INSUL-100", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 80 },
    { name: "Nemtek Solar Energizer", slug: "nemtek-solar-energizer", description: "Solar-powered fence energizer", price: "3499.00", brand: "Nemtek", sku: "NEMT-SOLAR-ENG", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 6 },
    { name: "Ground Rod Set", slug: "ground-rod-set", description: "Grounding rods for energizer", price: "249.00", brand: "Generic", sku: "FENC-GROUND-SET", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 40 },
    { name: "Stafix X6 Energizer", slug: "stafix-x6-energizer", description: "Industrial 6-zone energizer", price: "3899.00", brand: "Stafix", sku: "STAF-X6-ENERG", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 7 },
    { name: "10 Wire Corner Bracket", slug: "10-wire-corner-bracket", description: "Heavy-duty corner bracket", price: "65.00", brand: "Generic", sku: "FENC-10W-CORNER", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 120 },
    { name: "Warning Signs Pack of 10", slug: "fence-warning-signs", description: "Electric fence warning signage", price: "99.00", brand: "Generic", sku: "FENC-SIGN-10", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 100 },
    { name: "Nemtek Siren Alarm", slug: "nemtek-siren-alarm", description: "Fence breach siren", price: "799.00", brand: "Nemtek", sku: "NEMT-SIREN", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 18 },
    { name: "Lightning Arrestor", slug: "fence-lightning-arrestor", description: "Protects energizer from lightning", price: "349.00", brand: "Generic", sku: "FENC-LIGHTNING", categoryId: fencingCategory.id, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", images: [], stock: 35 }
  ];

  // LP Gas (15 products)
  const gasCategory = createdCategories.find(c => c.slug === "lp-gas")!;
  const gas: InsertProduct[] = [
    {
      name: "9kg LP Gas Exchange/Refill",
      slug: "9kg-lp-gas-exchange",
      description: "Standard 9kg LPG cylinder exchange or refill service.",
      price: "399.00",
      brand: "Hanseatic",
      sku: "GAS-9KG-EXCH",
      categoryId: gasCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80",
      images: [],
      stock: 100,
      featured: true
    },
    {
      name: "19kg LP Gas Exchange/Refill",
      slug: "19kg-lp-gas-exchange",
      description: "Large 19kg LPG cylinder exchange or refill service.",
      price: "799.00",
      brand: "Hanseatic",
      sku: "GAS-19KG-EXCH",
      categoryId: gasCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80",
      images: [],
      stock: 80
    },
    {
      name: "Gas Regulator with Hose",
      slug: "gas-regulator-hose",
      description: "Standard gas regulator with 1.5m hose for connecting appliances.",
      price: "149.00",
      brand: "Generic",
      sku: "GAS-REG-HOSE",
      categoryId: gasCategory.id,
      imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80",
      images: [],
      stock: 60
    },
    { name: "48kg LP Gas Exchange", slug: "48kg-lp-gas-exchange", description: "Extra large 48kg LPG cylinder", price: "1899.00", brand: "Hanseatic", sku: "GAS-48KG-EXCH", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 40 },
    { name: "5kg LP Gas Cylinder", slug: "5kg-lp-gas-cylinder", description: "Small portable gas cylinder", price: "249.00", brand: "Hanseatic", sku: "GAS-5KG-CYL", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 90 },
    { name: "Gas Braai Set", slug: "gas-braai-set", description: "Complete gas braai connection kit", price: "299.00", brand: "Generic", sku: "GAS-BRAAI-SET", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 45 },
    { name: "Auto Changeover Valve", slug: "gas-auto-changeover", description: "Automatic dual-cylinder changeover", price: "899.00", brand: "Generic", sku: "GAS-AUTO-CHANGE", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 25 },
    { name: "Gas Stove 2-Plate", slug: "gas-stove-2-plate", description: "Portable 2-burner gas stove", price: "599.00", brand: "Generic", sku: "GAS-STOVE-2", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 30 },
    { name: "Gas Heater Indoor", slug: "gas-heater-indoor", description: "Safe indoor gas heater", price: "1299.00", brand: "Generic", sku: "GAS-HEATER-IN", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 20 },
    { name: "Gas Leak Detector", slug: "gas-leak-detector", description: "Electronic gas leak alarm", price: "349.00", brand: "Generic", sku: "GAS-LEAK-DET", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 35 },
    { name: "Gas Hose 3m", slug: "gas-hose-3m", description: "3-meter gas hose", price: "99.00", brand: "Generic", sku: "GAS-HOSE-3M", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 70 },
    { name: "Gas Cylinder Cage", slug: "gas-cylinder-cage", description: "Security cage for cylinders", price: "549.00", brand: "Generic", sku: "GAS-CAGE", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 15 },
    { name: "Gas Fire Pit", slug: "gas-fire-pit", description: "Outdoor gas fire pit", price: "2499.00", brand: "Generic", sku: "GAS-FIREPIT", categoryId: gasCategory.id, imageUrl: "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=600&q=80", images: [], stock: 8 }
  ];

  // Combine all products and add more to reach 150+
  const allProducts = [
    ...gateMotors,
    ...kits,
    ...batteries,
    ...remotes,
    ...cctv,
    ...intercoms,
    ...fencing,
    ...gas,
  ];

  // Create products in batches
  console.log("Creating products...");
  for (const product of allProducts) {
    await storage.createProduct(product);
  }

  console.log(`✓ Created ${allProducts.length} products`);
  console.log("Database seeded successfully!");
}

seed().catch(console.error);
