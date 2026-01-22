import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState, useEffect, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ChevronLeft, ChevronRight, Search, X, Filter, ChevronDown, ChevronUp, MapPin, ChevronDownIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Product, Category } from "@shared/schema";

// Brand banners for gate-motors category
import centurionBanner from "@assets/optimized/centurion-banner.webp";
import geminiBanner from "@assets/optimized/gemini-banner.webp";
import dtsBanner from "@assets/optimized/dts-banner.webp";

interface BrandSection {
  brand: string;
  banner: string | null;
  products: Product[];
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
  slug?: string;
}

export default function CategoryPage({ onAddToCart, slug: propSlug }: CategoryPageProps) {
  const [, categoryParams] = useRoute("/category/:slug");
  const [, collectionsParams] = useRoute("/collections/:slug");
  const slug = propSlug || categoryParams?.slug || collectionsParams?.slug;
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 24;

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", slug],
    enabled: !!slug,
  });

  const { data: brands } = useQuery<string[]>({
    queryKey: ["/api/brands"],
  });

  // Check if we should use brand sections layout (gate-motors without filters)
  const shouldUseBrandSections = slug === 'gate-motors' && !search && brand === 'all' && priceRange[0] === 0 && priceRange[1] === 10000;

  const buildQueryKey = () => {
    const queryParams = new URLSearchParams();
    if (slug) queryParams.append("categorySlug", slug);
    if (search) queryParams.append("search", search);
    if (brand && brand !== "all") queryParams.append("brand", brand);
    if (priceRange[0] > 0) queryParams.append("minPrice", priceRange[0].toString());
    if (priceRange[1] < 10000) queryParams.append("maxPrice", priceRange[1].toString());
    if (sortBy) queryParams.append("sort", sortBy);
    
    // For gate-motors brand sections, fetch all products (no pagination)
    if (shouldUseBrandSections) {
      queryParams.append("limit", "500"); // Fetch all products for brand sections
    } else {
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
    }
    
    const queryString = queryParams.toString();
    return queryString ? `/api/products?${queryString}` : `/api/products?page=${page}&limit=${limit}`;
  };

  const { data, isLoading: productsLoading } = useQuery<ProductsResponse>({
    queryKey: [buildQueryKey()],
    enabled: !!slug,
  });

  const products = data?.products;
  const pagination = data?.pagination;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setBrand("all");
    setPriceRange([0, 10000]);
    setSortBy("name-asc");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [search, brand, priceRange, sortBy]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const hasActiveFilters = search || (brand && brand !== "all") || priceRange[0] > 0 || priceRange[1] < 10000;
  const isLoading = categoryLoading || productsLoading;

  // FAQ data for all categories
  const categoryFAQs: Record<string, Array<{question: string, answer: string}>> = {
    'gate-motors': [
      {
        question: "What size gate motor do I need for my sliding gate?",
        answer: "The motor size depends on your gate's weight: For gates up to 300kg, a Centurion D3 or ET Nice Drive 300 is ideal. Gates 300-500kg need a D5 Evo Smart or ET Nice Drive 500. For heavy gates 500-800kg, choose a Centurion D6 Smart. Extra-heavy gates 800kg+ require a Centurion D10 Smart. Always add 20% extra capacity for safety margin."
      },
      {
        question: "Which is better: Centurion or Gemini gate motors?",
        answer: "Both are excellent South African brands. Centurion motors (D3, D5, D6, D10) offer advanced smart features, battery backup, and integration with home automation. They're ideal for frequent use and premium installations. Gemini motors are more budget-friendly while still reliable, making them perfect for residential properties with standard requirements. For commercial or high-traffic gates, Centurion is recommended."
      },
      {
        question: "Do gate motors work during load shedding?",
        answer: "Yes! All our gate motors include or support battery backup systems. Centurion Smart motors have built-in battery charging and can operate for 50+ cycles during power outages. We recommend a 7Ah battery for residential use and 18Ah for commercial applications to ensure uninterrupted access during load shedding."
      },
      {
        question: "How long does gate motor installation take?",
        answer: "Professional installation typically takes 3-5 hours for a standard sliding gate motor. This includes mounting the motor, laying the rack, electrical connections, programming remotes, and safety testing. Swing gate motor installation usually takes 4-6 hours as it requires precise alignment. We recommend professional installation to ensure warranty validity."
      },
      {
        question: "What's included in a gate motor full kit?",
        answer: "Our full kits include everything for installation: the motor unit, 4-6 meters of nylon/steel rack, mounting hardware, 2 remote controls, anti-theft bracket, battery (where specified), and installation manual. Premium kits also include battery backup systems and extended warranties. Motor-only options are available if you already have existing infrastructure."
      },
      {
        question: "Can I control my gate motor from my phone?",
        answer: "Yes! Centurion Smart motors are compatible with the Centurion Smart app, allowing you to open/close your gate, monitor status, and receive alerts from anywhere. You'll need a Centurion Smart Hub (sold separately) to enable smartphone control. This also integrates with home automation systems like Google Home and Amazon Alexa."
      }
    ],
    'batteries': [
      {
        question: "What size battery do I need for my gate motor?",
        answer: "For residential gate motors, a 7Ah battery provides approximately 50-100 cycles during load shedding. For commercial properties with frequent use, we recommend an 18Ah battery for extended backup. Centurion D-series motors use 12V batteries. Always check your motor's specifications for exact requirements."
      },
      {
        question: "How long do gate motor batteries last?",
        answer: "Quality sealed lead-acid batteries typically last 2-3 years with proper maintenance. Battery life depends on cycling frequency, temperature, and charging conditions. We recommend replacing batteries every 2-3 years preventatively to ensure reliable load shedding backup."
      },
      {
        question: "What's the difference between 7Ah and 18Ah batteries?",
        answer: "The Ah (Ampere-hour) rating indicates capacity. A 7Ah battery is standard for residential gates with moderate use - providing 50-100 cycles. An 18Ah battery offers extended backup for commercial properties or frequent cycling, providing 150+ operations during power outages."
      },
      {
        question: "Can I use car batteries for my gate motor?",
        answer: "No, car batteries are not recommended for gate motors. Gate motors require deep-cycle sealed lead-acid (SLA) or gel batteries designed for repeated discharge cycles. Car batteries are designed for high cranking power, not deep discharge, and will fail prematurely in gate motor applications."
      },
      {
        question: "How do I know when to replace my gate motor battery?",
        answer: "Signs of battery failure include: the gate moving slower than usual, the motor beeping or showing low battery warnings, the gate not completing full cycles during load shedding, or the battery being more than 3 years old. Test your battery during load shedding to check its performance."
      },
      {
        question: "Do you deliver batteries nationwide?",
        answer: "Yes, we deliver batteries throughout South Africa via The Courier Guy. Batteries are carefully packaged to prevent damage during transit. Free delivery on orders over R1000. Express delivery available for urgent requirements."
      }
    ],
    'cctv-cameras': [
      {
        question: "What resolution CCTV camera do I need?",
        answer: "For most residential and business applications, 2MP (1080p) cameras provide excellent clarity. 4MP cameras offer enhanced detail for identifying faces and license plates at greater distances. 8MP (4K) cameras are ideal for large areas requiring maximum detail. ColorVu cameras provide full-color night vision for superior low-light performance."
      },
      {
        question: "What's the difference between HiLook and Hikvision cameras?",
        answer: "Both brands are from the same manufacturer. Hikvision is the premium line with advanced features, longer warranties, and commercial-grade durability. HiLook offers excellent value for residential and small business use with essential features at lower prices. Both brands are fully compatible with each other."
      },
      {
        question: "How many cameras do I need for my property?",
        answer: "A typical home needs 4-8 cameras: cover all entry points (front door, back door, garage), driveway, and perimeter. Businesses usually need 8-16+ cameras depending on size. Our 4-channel, 8-channel, and 16-channel DVR kits are sized for these common requirements."
      },
      {
        question: "Do CCTV cameras work during load shedding?",
        answer: "CCTV systems require power to operate. We recommend pairing your CCTV system with a UPS (Uninterruptible Power Supply) or connecting to a backup power system. Some cameras support PoE (Power over Ethernet) which can be backed up through a single UPS for the network switch."
      },
      {
        question: "What storage capacity do I need for CCTV recording?",
        answer: "A 1TB hard drive stores approximately 10-14 days of footage from 4 cameras at 1080p with motion detection recording. For continuous recording or more cameras, consider 2TB-4TB drives. We recommend keeping at least 30 days of footage for security purposes."
      },
      {
        question: "Can I view my CCTV cameras from my phone?",
        answer: "Yes! All our Hikvision and HiLook DVRs support remote viewing via the Hik-Connect app. View live footage, playback recordings, and receive motion alerts from anywhere with an internet connection. Setup requires a stable internet connection at the installation site."
      }
    ],
    'electric-fencing': [
      {
        question: "Is electric fencing legal in South Africa?",
        answer: "Yes, electric fencing is legal in South Africa when installed according to SANS 10222-3 standards. Requirements include warning signs every 10 meters, maximum 10,000V output, proper earth spike installation, and registration with your local municipality. We recommend professional installation for compliance."
      },
      {
        question: "What energizer size do I need for my fence?",
        answer: "Energizer sizing depends on fence length and vegetation contact. A 1 Joule energizer suits up to 1km of fence with minimal vegetation. 2-4 Joules handles 1-3km with moderate vegetation. 5+ Joules is recommended for longer perimeters or heavy vegetation contact. Our Nemtek and JVA energizers are sized for various applications."
      },
      {
        question: "How many Joules do I need for security fencing?",
        answer: "For effective security deterrent: residential properties typically need 1-2 Joules for perimeters under 500m. Medium properties (500m-1km) need 2-4 Joules. Large properties or commercial installations need 4-8 Joules. Higher Joules provide better performance through vegetation and longer fence runs."
      },
      {
        question: "What maintenance does electric fencing require?",
        answer: "Regular maintenance includes: weekly visual inspection for vegetation contact, monthly testing with a fence tester, trimming vegetation touching the fence, checking wire tension, inspecting insulators for damage, and testing the backup battery. Professional servicing is recommended annually."
      },
      {
        question: "Do electric fence energizers work during load shedding?",
        answer: "Yes, most quality energizers include built-in battery backup. Nemtek and JVA energizers can operate for 8-24+ hours on battery during power outages, depending on the model. The battery charges automatically when power returns. We recommend testing your backup regularly."
      },
      {
        question: "What's the difference between monitored and unmonitored energizers?",
        answer: "Unmonitored energizers provide a deterrent shock but don't alert you to tampering. Monitored energizers detect fence breaches, voltage drops, and power failures, sending alerts to keypads or security companies. For high-security applications, monitored systems with zone detection are recommended."
      }
    ],
    'garage-door-parts': [
      {
        question: "How do I know what size springs I need for my garage door?",
        answer: "Garage door springs are sized by door weight and height. Common residential doors use springs rated for 70-100kg. Measure your door's dimensions and weight, or count the number of spring coils. We stock springs for Digidoor, Hansa, and standard sectional doors. Contact us with your door specifications for the correct match."
      },
      {
        question: "How long do garage door springs last?",
        answer: "Quality torsion springs typically last 10,000-15,000 cycles (approximately 7-10 years of normal use). Extension springs last 5,000-10,000 cycles. Signs of wear include squeaking, uneven door movement, visible gaps in spring coils, or the door becoming heavy to lift manually."
      },
      {
        question: "Can I replace garage door springs myself?",
        answer: "We strongly recommend professional installation for garage door springs. Torsion springs are under extreme tension and can cause serious injury if handled incorrectly. Extension springs are safer but still require proper knowledge. Professional installation ensures correct tensioning and safe operation."
      },
      {
        question: "What garage door remotes are compatible with my system?",
        answer: "Most South African garage doors use Digidoor or ET Nice/Centurion systems. Digidoor doors require Digidoor remotes or compatible universal remotes. Check your motor brand and frequency (usually 433MHz or 403MHz). We stock remotes for all major brands and can help identify the correct remote for your system."
      },
      {
        question: "Why is my garage door making grinding noises?",
        answer: "Grinding noises usually indicate: worn rollers needing replacement, dry hinges requiring lubrication, misaligned tracks, or worn gears in the motor. Regular lubrication with silicone spray on rollers, hinges, and springs prevents most noise issues. Replace nylon rollers every 5-7 years."
      },
      {
        question: "How often should I service my garage door?",
        answer: "We recommend servicing your garage door annually. This includes lubricating all moving parts, checking spring tension, inspecting cables for wear, testing safety features, and adjusting track alignment. Regular maintenance extends the life of your door and motor significantly."
      }
    ],
    'garage-motors': [
      {
        question: "What size garage motor do I need?",
        answer: "Garage door motor sizing is based on door weight. Standard single doors (under 100kg) work with most residential motors. Double doors or heavier sectional doors may need motors with higher lifting capacity. ET Nice and Centurion motors handle most residential applications. Check your door weight or contact us for recommendations."
      },
      {
        question: "Can I automate my existing garage door?",
        answer: "Yes! Most sectional and roll-up garage doors can be automated. You'll need a compatible motor, mounting brackets, and possibly a trolley arm depending on the door type. Tip-up doors require different motor types. Send us photos of your door for specific recommendations."
      },
      {
        question: "Do garage motors work during load shedding?",
        answer: "Yes, most garage motors include or support battery backup. ET Nice and Centurion motors have built-in battery charging circuits. A backup battery allows 20-50+ operations during power outages. We recommend a 7Ah battery for residential use to ensure access during load shedding."
      },
      {
        question: "What's the difference between sectional and roll-up door motors?",
        answer: "Sectional door motors use a trolley system that moves along a rail mounted on the ceiling. Roll-up door motors mount directly to the door tube and roll it up. Each type requires specific motors designed for that mechanism. We stock motors for both types."
      },
      {
        question: "How long do garage motors last?",
        answer: "Quality garage motors typically last 10-15 years with proper maintenance. Factors affecting lifespan include usage frequency, door weight, maintenance, and environmental conditions. Regular lubrication and annual servicing significantly extend motor life."
      },
      {
        question: "Can I add smartphone control to my garage motor?",
        answer: "Yes! Centurion and ET Nice motors can be connected to smartphone apps with the right accessories. Centurion requires a Smart Hub for app control. Some newer models have built-in WiFi connectivity. This allows you to open/close your garage and receive alerts from anywhere."
      }
    ],
    'intercoms': [
      {
        question: "What's the difference between wired and wireless intercoms?",
        answer: "Wired intercoms offer reliable, interference-free communication but require cable installation between units. Wireless intercoms are easier to install but may experience interference in some environments. For new installations, we recommend wired systems for reliability. Wireless suits retrofits where wiring is impractical."
      },
      {
        question: "Can intercoms integrate with my gate motor?",
        answer: "Yes! Most intercoms can trigger gate motors through a relay connection. Centurion and ET Nice gate motors have intercom integration terminals. This allows you to open the gate directly from the intercom handset or video screen when visitors call."
      },
      {
        question: "What's the range of wireless intercoms?",
        answer: "Wireless intercom range varies by model and environment. Typical ranges are 100-300 meters in open areas, reduced to 30-100 meters through walls. For larger properties, look for models with repeaters or consider wired installation for guaranteed reliability."
      },
      {
        question: "Do video intercoms work at night?",
        answer: "Yes, quality video intercoms include infrared (IR) LEDs for night vision. This allows you to see visitors clearly even in complete darkness. Some premium models feature color night vision or integrated lighting. All our video intercoms include night vision capability."
      },
      {
        question: "Can I answer my intercom from my phone?",
        answer: "Yes, smart intercoms with WiFi connectivity allow smartphone answering. See live video, communicate with visitors, and unlock gates remotely. This is perfect for when you're away from home or can't reach the handset. Requires stable WiFi at the installation point."
      },
      {
        question: "How many handsets can I have on one system?",
        answer: "Most intercom systems support 2-4 indoor handsets for different rooms. This allows you to answer calls from your bedroom, kitchen, or office. Additional handsets can often be added to expand coverage. Check specific model specifications for maximum handset capacity."
      }
    ],
    'lp-gas-exchange': [
      {
        question: "How does the gas cylinder exchange work?",
        answer: "Simply order a full gas cylinder and we'll deliver it to your door in Pretoria. Leave your empty cylinder out for collection. If you don't have an empty to exchange, a cylinder deposit applies. We handle the safe exchange so you always have a certified, inspected cylinder."
      },
      {
        question: "What sizes of LP gas cylinders do you offer?",
        answer: "We stock 9kg and 19kg LP gas cylinders, the most common sizes for South African households. 9kg cylinders are perfect for braais and portable heaters. 19kg cylinders suit gas stoves, larger heaters, and regular cooking use."
      },
      {
        question: "Is LP gas delivery available nationwide?",
        answer: "No, LP gas delivery is available in Pretoria only due to safety regulations for transporting pressurized cylinders. We offer same-day delivery for orders placed before 12:00, or next-business-day for later orders. A flat R50 delivery fee applies within Pretoria."
      },
      {
        question: "How do I know when my gas cylinder is running low?",
        answer: "Signs your cylinder is running low: flame height decreases, yellow instead of blue flames, appliances take longer to heat, or you can lift the cylinder easily (a 9kg cylinder weighs approximately 17kg when full). We recommend ordering your refill before completely running out."
      },
      {
        question: "Is it safe to store LP gas cylinders at home?",
        answer: "Yes, when stored correctly. Keep cylinders upright, outdoors or in well-ventilated areas, away from ignition sources and direct sunlight. Never store cylinders indoors, in enclosed spaces, or near electrical equipment. Check regulators and hoses regularly for wear."
      },
      {
        question: "Do you sell braai accessories with LP gas?",
        answer: "Yes! We stock braai briquettes, firelighters, and other accessories alongside our LP gas offering. Our 4kg braai briquettes are perfect for your next braai. These items can be delivered with your gas order for convenience."
      }
    ],
    'remotes': [
      {
        question: "How do I know which remote is compatible with my gate motor?",
        answer: "Remote compatibility depends on your motor brand and frequency. Centurion gates use Centurion remotes (Nova, Smart series). ET Nice gates use ET Nice remotes. Check the label on your existing remote or motor for the brand and frequency (usually 433MHz). We can help identify the correct remote if you provide motor details."
      },
      {
        question: "How do I program a new remote to my gate motor?",
        answer: "Programming methods vary by brand: Centurion remotes use the 'learn' button on the motor controller - press learn, then press the remote button. ET Nice uses similar procedures. Full programming instructions are included with each remote. Contact us if you need assistance."
      },
      {
        question: "Why has my remote stopped working?",
        answer: "Common causes include: dead battery (most common - try replacing first), remote de-synced from motor (reprogram the remote), damaged remote (water or physical damage), or motor receiver fault. Try a known working remote to determine if the issue is the remote or motor."
      },
      {
        question: "Can I use one remote for multiple gates/doors?",
        answer: "Yes! Most remotes have 2-4 buttons that can be programmed to different devices. Use button 1 for your gate, button 2 for your garage, etc. Program each button to the respective motor independently. This is convenient for properties with multiple access points."
      },
      {
        question: "What's the range of gate remotes?",
        answer: "Standard remotes have 30-50 meter range, sufficient for most residential use. Long-range remotes can reach 100+ meters for large properties. Range can be affected by interference, obstacles, and battery condition. If range seems reduced, try replacing the battery first."
      },
      {
        question: "Do you stock replacement remote cases and batteries?",
        answer: "Yes, we stock remote batteries and complete replacement remotes. For worn or damaged remotes, it's often more reliable to replace the entire unit rather than just the case. New remotes include fresh batteries and full warranty."
      }
    ]
  };

  // Get FAQ for current category
  const currentFAQ = slug ? categoryFAQs[slug] || [] : [];

  // Legacy reference for backwards compatibility
  const gateMotorsFAQ = [
    {
      question: "What size gate motor do I need for my sliding gate?",
      answer: "The motor size depends on your gate's weight: For gates up to 300kg, a Centurion D3 or ET Nice Drive 300 is ideal. Gates 300-500kg need a D5 Evo Smart or ET Nice Drive 500. For heavy gates 500-800kg, choose a Centurion D6 Smart. Extra-heavy gates 800kg+ require a Centurion D10 Smart. Always add 20% extra capacity for safety margin."
    },
    {
      question: "Which is better: Centurion or Gemini gate motors?",
      answer: "Both are excellent South African brands. Centurion motors (D3, D5, D6, D10) offer advanced smart features, battery backup, and integration with home automation. They're ideal for frequent use and premium installations. Gemini motors are more budget-friendly while still reliable, making them perfect for residential properties with standard requirements. For commercial or high-traffic gates, Centurion is recommended."
    },
    {
      question: "Do gate motors work during load shedding?",
      answer: "Yes! All our gate motors include or support battery backup systems. Centurion Smart motors have built-in battery charging and can operate for 50+ cycles during power outages. We recommend a 7Ah battery for residential use and 18Ah for commercial applications to ensure uninterrupted access during load shedding."
    },
    {
      question: "How long does gate motor installation take?",
      answer: "Professional installation typically takes 3-5 hours for a standard sliding gate motor. This includes mounting the motor, laying the rack, electrical connections, programming remotes, and safety testing. Swing gate motor installation usually takes 4-6 hours as it requires precise alignment. We recommend professional installation to ensure warranty validity."
    },
    {
      question: "What's included in a gate motor full kit?",
      answer: "Our full kits include everything for installation: the motor unit, 4-6 meters of nylon/steel rack, mounting hardware, 2 remote controls, anti-theft bracket, battery (where specified), and installation manual. Premium kits also include battery backup systems and extended warranties. Motor-only options are available if you already have existing infrastructure."
    },
    {
      question: "Can I control my gate motor from my phone?",
      answer: "Yes! Centurion Smart motors are compatible with the Centurion Smart app, allowing you to open/close your gate, monitor status, and receive alerts from anywhere. You'll need a Centurion Smart Hub (sold separately) to enable smartphone control. This also integrates with home automation systems like Google Home and Amazon Alexa."
    }
  ];

  // Category SEO content configuration
  const categorySEO: Record<string, { title: string, description: string, schemaName: string, schemaDescription: string }> = {
    'gate-motors': {
      title: "Gate Motors South Africa | Centurion, Gemini & ET Nice | Best Prices",
      description: "Shop gate motors from R2,499. Centurion D3, D5, D6, D10 Smart motors. Gemini & ET Nice sliding gate motors. Full kits with battery backup. Free delivery over R1000. Load shedding ready.",
      schemaName: "Gate Motors South Africa - Sliding & Swing Gate Automation",
      schemaDescription: "Shop premium gate motors from Centurion, Gemini & ET Nice. Sliding gate motors, swing gate openers, full installation kits with battery backup. Free delivery on orders over R1000."
    },
    'batteries': {
      title: "Gate Motor Batteries South Africa | 7Ah & 18Ah Backup Batteries | Alectra",
      description: "Buy gate motor batteries online. 7Ah & 18Ah sealed lead-acid batteries for Centurion, ET Nice & Gemini motors. Load shedding backup power. Nationwide delivery. Best prices guaranteed.",
      schemaName: "Gate Motor & Security System Batteries",
      schemaDescription: "High-quality backup batteries for gate motors and security systems. 7Ah and 18Ah sealed lead-acid batteries with nationwide delivery."
    },
    'cctv-cameras': {
      title: "CCTV Cameras & Security Systems South Africa | Hikvision & HiLook | Alectra",
      description: "Shop CCTV cameras and DVR kits from Hikvision & HiLook. 2MP, 4MP & 4K security cameras with night vision. Complete surveillance systems with remote phone viewing. Free delivery over R1000.",
      schemaName: "CCTV Cameras & Security Surveillance Systems",
      schemaDescription: "Professional CCTV cameras and security systems from Hikvision and HiLook. Complete DVR kits, IP cameras, and surveillance solutions for homes and businesses."
    },
    'electric-fencing': {
      title: "Electric Fencing South Africa | Nemtek & JVA Energizers | Alectra",
      description: "Buy electric fence energizers and accessories. Nemtek & JVA energizers from 1-8 Joules. Complete fencing kits with insulators, wire & warning signs. SANS compliant. Nationwide delivery.",
      schemaName: "Electric Fencing & Security Perimeter Solutions",
      schemaDescription: "Professional electric fencing solutions from Nemtek and JVA. Energizers, insulators, fencing wire, and complete perimeter security systems for South African properties."
    },
    'garage-door-parts': {
      title: "Garage Door Parts & Spares South Africa | Springs, Rollers & Remotes | Alectra",
      description: "Shop garage door parts and spares. Torsion springs, rollers, hinges, cables & remotes for Digidoor, Hansa & sectional doors. Quality replacement parts with nationwide delivery.",
      schemaName: "Garage Door Parts, Spares & Accessories",
      schemaDescription: "Quality garage door replacement parts and spares. Springs, rollers, hinges, cables, and remotes for all major garage door brands in South Africa."
    },
    'garage-motors': {
      title: "Garage Door Motors South Africa | ET Nice & Centurion | Alectra",
      description: "Buy garage door motors online. ET Nice & Centurion automation for sectional and roll-up doors. Battery backup for load shedding. Full installation kits available. Free delivery over R1000.",
      schemaName: "Garage Door Motors & Automation Systems",
      schemaDescription: "Premium garage door motors from ET Nice and Centurion. Automation solutions for sectional and roll-up doors with battery backup and smartphone control."
    },
    'intercoms': {
      title: "Intercoms South Africa | Video & Audio Door Entry Systems | Alectra",
      description: "Shop intercoms and video door entry systems. Wired & wireless options with gate motor integration. See visitors on screen or smartphone. Night vision included. Nationwide delivery.",
      schemaName: "Intercoms & Video Door Entry Systems",
      schemaDescription: "Quality intercom systems for homes and businesses. Video and audio door entry with gate motor integration, night vision, and smartphone connectivity."
    },
    'lp-gas-exchange': {
      title: "LP Gas Delivery Pretoria | 9kg & 19kg Cylinder Exchange | Alectra",
      description: "LP Gas cylinder delivery in Pretoria. 9kg & 19kg gas bottles with same-day delivery. Easy cylinder exchange service. R50 flat delivery fee. Order before 12:00 for same-day delivery.",
      schemaName: "LP Gas Cylinder Delivery & Exchange - Pretoria",
      schemaDescription: "Convenient LP Gas cylinder delivery and exchange service in Pretoria. 9kg and 19kg cylinders with same-day delivery for orders before noon."
    },
    'remotes': {
      title: "Gate & Garage Remotes South Africa | Centurion, ET Nice & Digidoor | Alectra",
      description: "Buy gate and garage door remotes online. Centurion Nova, ET Nice, Digidoor & universal remotes. Easy programming. All frequencies in stock. Nationwide delivery available.",
      schemaName: "Gate Motor & Garage Door Remote Controls",
      schemaDescription: "Replacement remote controls for gate motors and garage doors. Compatible with Centurion, ET Nice, Digidoor and other major South African brands."
    }
  };

  // Get SEO content for current category
  const currentSEO = slug ? categorySEO[slug] : null;

  // Category intro content for SEO
  const categoryIntros: Record<string, { title: string, content: string }> = {
    'gate-motors': {
      title: "Premium Gate Motors for South African Homes",
      content: "Find the perfect <strong>gate motor</strong> for your home or business. We stock South Africa's leading brands including <strong>Centurion</strong> (D3, D5, D6, D10 Smart), <strong>Gemini</strong>, and <strong>ET Nice</strong> sliding gate motors. All our gate motors are <strong>load shedding ready</strong> with battery backup options, ensuring your property stays secure during power outages. Choose from motor-only units or complete installation kits with rack, remotes, and anti-theft brackets."
    },
    'batteries': {
      title: "Reliable Backup Batteries for Security Systems",
      content: "Keep your <strong>gate motor</strong> and security systems running during <strong>load shedding</strong> with our quality backup batteries. We stock <strong>7Ah</strong> and <strong>18Ah</strong> sealed lead-acid batteries compatible with <strong>Centurion</strong>, <strong>ET Nice</strong>, <strong>Gemini</strong>, and other major brands. Our batteries are designed for deep-cycle use, providing reliable backup power for 50-150+ gate operations during power outages."
    },
    'cctv-cameras': {
      title: "Professional CCTV Systems for Home & Business",
      content: "Protect your property with professional <strong>CCTV cameras</strong> from <strong>Hikvision</strong> and <strong>HiLook</strong>. Our range includes <strong>2MP</strong>, <strong>4MP</strong>, and <strong>4K</strong> cameras with night vision, motion detection, and remote smartphone viewing. Complete <strong>DVR kits</strong> available with 4, 8, and 16 channels. All cameras include the <strong>Hik-Connect app</strong> for viewing footage from anywhere."
    },
    'electric-fencing': {
      title: "Electric Fencing Solutions for Perimeter Security",
      content: "Secure your perimeter with professional <strong>electric fencing</strong> from <strong>Nemtek</strong> and <strong>JVA</strong>. Our energizers range from <strong>1 Joule</strong> for small residential properties to <strong>8+ Joules</strong> for commercial installations. All systems include <strong>battery backup</strong> for load shedding protection. We stock complete fencing kits with insulators, wire, warning signs, and installation accessories."
    },
    'garage-door-parts': {
      title: "Quality Garage Door Parts & Spares",
      content: "Find replacement parts for all major <strong>garage door</strong> brands including <strong>Digidoor</strong>, <strong>Hansa</strong>, and standard sectional doors. We stock <strong>torsion springs</strong>, <strong>rollers</strong>, <strong>hinges</strong>, <strong>cables</strong>, and <strong>remote controls</strong>. Quality components ensure smooth, quiet operation and extend the life of your garage door system."
    },
    'garage-motors': {
      title: "Garage Door Motors & Automation",
      content: "Automate your garage door with quality motors from <strong>ET Nice</strong> and <strong>Centurion</strong>. Our motors work with <strong>sectional</strong> and <strong>roll-up</strong> garage doors, featuring <strong>battery backup</strong> for reliable operation during <strong>load shedding</strong>. Full installation kits include motors, brackets, and remotes. Add smartphone control with optional smart accessories."
    },
    'intercoms': {
      title: "Video & Audio Intercom Systems",
      content: "Enhance your property security with our <strong>intercom</strong> systems. Choose from <strong>video</strong> and <strong>audio</strong> options, <strong>wired</strong> and <strong>wireless</strong> models. See visitors clearly with <strong>night vision</strong> cameras and unlock your gate directly from the handset. Many models support <strong>smartphone apps</strong> for remote answering when you're away from home."
    },
    'lp-gas-exchange': {
      title: "Convenient LP Gas Delivery in Pretoria",
      content: "Order <strong>LP Gas</strong> cylinders with convenient <strong>same-day delivery</strong> in <strong>Pretoria</strong>. We offer <strong>9kg</strong> and <strong>19kg</strong> cylinder sizes with easy exchange service. Leave your empty cylinder out, and we'll swap it for a full one. R50 flat delivery fee. Orders before 12:00 delivered same day. Stock up on braai essentials including <strong>briquettes</strong> and accessories."
    },
    'remotes': {
      title: "Gate & Garage Remote Controls",
      content: "Find the right <strong>remote control</strong> for your gate motor or garage door. We stock remotes for <strong>Centurion</strong> (Nova, Smart series), <strong>ET Nice</strong>, <strong>Digidoor</strong>, and universal options. Most remotes support <strong>multi-button programming</strong> so you can control your gate and garage from one device. Easy self-programming with full instructions included."
    }
  };

  // Get intro content for current category
  const currentIntro = slug ? categoryIntros[slug] : null;

  // Category buying guides
  const categoryBuyingGuides: Record<string, { title: string, content: string, points: string[] }> = {
    'gate-motors': {
      title: "Gate Motor Buying Guide",
      content: "Choosing the right gate motor ensures reliable, secure access to your property for years to come. Here's what to consider when shopping for a sliding gate motor or swing gate motor in South Africa:",
      points: [
        "<strong>Gate Weight:</strong> Measure your gate's weight to select an appropriately powered motor. Undersized motors fail prematurely.",
        "<strong>Usage Frequency:</strong> High-traffic commercial properties need heavy-duty motors like the Centurion D10.",
        "<strong>Battery Backup:</strong> Essential for load shedding - all our motors support backup batteries.",
        "<strong>Smart Features:</strong> Centurion Smart motors offer app control, status monitoring, and home automation integration.",
        "<strong>Warranty:</strong> We offer manufacturer warranties on all gate motors. Professional installation is recommended."
      ]
    },
    'batteries': {
      title: "Battery Selection Guide",
      content: "Choosing the right battery ensures reliable backup power during load shedding:",
      points: [
        "<strong>Capacity (Ah):</strong> 7Ah for residential use (50-100 cycles), 18Ah for commercial or frequent use (150+ cycles).",
        "<strong>Voltage:</strong> Most gate motors use 12V batteries. Check your motor specifications.",
        "<strong>Battery Type:</strong> Sealed lead-acid (SLA) or gel batteries are ideal for gate motors - never use car batteries.",
        "<strong>Replacement Timing:</strong> Replace batteries every 2-3 years for optimal performance.",
        "<strong>Testing:</strong> Regularly test your battery during load shedding to ensure it's functioning properly."
      ]
    },
    'cctv-cameras': {
      title: "CCTV Buying Guide",
      content: "Selecting the right CCTV system protects your property effectively:",
      points: [
        "<strong>Resolution:</strong> 2MP (1080p) for standard use, 4MP for detail, 8MP (4K) for large areas.",
        "<strong>Coverage:</strong> Plan camera positions to cover entry points, driveway, and perimeter with overlap.",
        "<strong>Night Vision:</strong> All cameras should include IR or ColorVu for 24/7 recording.",
        "<strong>Storage:</strong> 1TB per 4 cameras for 10-14 days. Consider 2-4TB for longer retention.",
        "<strong>Remote Access:</strong> Ensure your DVR supports app-based viewing for peace of mind when away."
      ]
    },
    'electric-fencing': {
      title: "Electric Fencing Buying Guide",
      content: "Effective electric fencing provides both deterrent and detection:",
      points: [
        "<strong>Energizer Size:</strong> Match Joule output to fence length and vegetation contact. More Joules = better performance.",
        "<strong>Legal Compliance:</strong> Ensure installation meets SANS 10222-3 standards with proper signage and registration.",
        "<strong>Battery Backup:</strong> Essential for security during power outages - most energizers include backup.",
        "<strong>Monitoring:</strong> Consider monitored systems with zone detection for high-security applications.",
        "<strong>Maintenance:</strong> Regular vegetation clearing and annual servicing maintains optimal performance."
      ]
    },
    'garage-door-parts': {
      title: "Garage Door Parts Guide",
      content: "Maintaining your garage door extends its lifespan and ensures safe operation:",
      points: [
        "<strong>Springs:</strong> Match spring type and weight rating to your door. Professional installation recommended for safety.",
        "<strong>Rollers:</strong> Replace worn rollers every 5-7 years. Nylon rollers are quieter than steel.",
        "<strong>Lubrication:</strong> Use silicone spray on springs, hinges, and rollers monthly for smooth operation.",
        "<strong>Cables:</strong> Inspect for fraying and replace immediately if damaged - cables are under high tension.",
        "<strong>Remotes:</strong> Keep spare remotes and replace batteries annually for reliable operation."
      ]
    },
    'garage-motors': {
      title: "Garage Motor Buying Guide",
      content: "Choosing the right garage motor ensures reliable daily operation:",
      points: [
        "<strong>Door Type:</strong> Sectional doors use rail-mount motors. Roll-up doors need tube-mount motors.",
        "<strong>Door Weight:</strong> Standard residential motors handle doors up to 100kg. Heavy doors need higher capacity.",
        "<strong>Battery Backup:</strong> Essential for access during load shedding - most motors support 7Ah batteries.",
        "<strong>Smart Features:</strong> Consider WiFi-enabled motors for smartphone control and notifications.",
        "<strong>Noise Level:</strong> Belt-drive motors are quieter than chain-drive for bedrooms above garages."
      ]
    },
    'intercoms': {
      title: "Intercom Buying Guide",
      content: "Selecting the right intercom system enhances security and convenience:",
      points: [
        "<strong>Wired vs Wireless:</strong> Wired systems are more reliable. Wireless suits retrofits where cabling is impractical.",
        "<strong>Video Quality:</strong> Look for cameras with night vision and wide-angle lenses for clear visitor identification.",
        "<strong>Gate Integration:</strong> Ensure compatibility with your gate motor brand for one-button gate opening.",
        "<strong>Multiple Handsets:</strong> Consider systems supporting 2-4 indoor units for different rooms.",
        "<strong>Smart Features:</strong> WiFi models allow smartphone answering when you're away from home."
      ]
    },
    'lp-gas-exchange': {
      title: "LP Gas Ordering Guide",
      content: "Tips for convenient LP Gas ordering and safe handling:",
      points: [
        "<strong>Cylinder Size:</strong> 9kg for occasional braais and portable heaters. 19kg for regular cooking and heating.",
        "<strong>Delivery:</strong> Order before 12:00 for same-day delivery. Later orders delivered next business day.",
        "<strong>Exchange:</strong> Have your empty cylinder ready for exchange. Deposit applies if no empty available.",
        "<strong>Safety:</strong> Store cylinders upright, outdoors, away from ignition sources and direct sunlight.",
        "<strong>Running Low:</strong> Order refill before completely empty to avoid interruption."
      ]
    },
    'remotes': {
      title: "Remote Control Buying Guide",
      content: "Choosing and programming the right remote for your system:",
      points: [
        "<strong>Compatibility:</strong> Match the remote to your motor brand and frequency (433MHz or 403MHz).",
        "<strong>Multi-Button:</strong> Most remotes have 2-4 buttons for controlling multiple gates and garages.",
        "<strong>Battery Life:</strong> Keep spare batteries and replace when range decreases noticeably.",
        "<strong>Programming:</strong> Follow included instructions - most motors have a 'learn' button for easy pairing.",
        "<strong>Spares:</strong> Always have backup remotes in case of loss or malfunction."
      ]
    }
  };

  // Get buying guide for current category
  const currentBuyingGuide = slug ? categoryBuyingGuides[slug] : null;

  // FAQ section titles
  const faqTitles: Record<string, string> = {
    'gate-motors': "Frequently Asked Questions About Gate Motors",
    'batteries': "Frequently Asked Questions About Backup Batteries",
    'cctv-cameras': "Frequently Asked Questions About CCTV Systems",
    'electric-fencing': "Frequently Asked Questions About Electric Fencing",
    'garage-door-parts': "Frequently Asked Questions About Garage Door Parts",
    'garage-motors': "Frequently Asked Questions About Garage Motors",
    'intercoms': "Frequently Asked Questions About Intercoms",
    'lp-gas-exchange': "Frequently Asked Questions About LP Gas",
    'remotes': "Frequently Asked Questions About Remote Controls"
  };

  const currentFAQTitle = slug ? faqTitles[slug] || `Frequently Asked Questions About ${category?.name}` : "";

  // Create structured data for all categories with FAQ
  const categoryStructuredData = (slug && currentSEO && currentFAQ.length > 0) ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `https://alectra.co.za/collections/${slug}`,
        "name": currentSEO.schemaName,
        "description": currentSEO.schemaDescription,
        "url": `https://alectra.co.za/collections/${slug}`,
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://alectra.co.za/#website",
          "name": "Alectra Solutions",
          "url": "https://alectra.co.za"
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://alectra.co.za" },
            { "@type": "ListItem", "position": 2, "name": category?.name || "Category", "item": `https://alectra.co.za/collections/${slug}` }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": currentFAQ.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      },
      {
        "@type": "ItemList",
        "itemListElement": (products ?? []).slice(0, 10).map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": product.name,
            "url": `https://alectra.co.za/products/${product.slug}`,
            "image": product.imageUrl?.startsWith('http') ? product.imageUrl : `https://alectra.co.za/${(product.imageUrl || '').replace(/^\/+/, '')}`,
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "ZAR",
              "availability": (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          }
        }))
      }
    ]
  } : null;

  // Brand banners configuration for gate-motors category
  // Centurion, Gemini, and DTS have banners
  // DTS section will also include all remaining products
  const brandBanners: Record<string, string> = {
    "Centurion": centurionBanner,
    "Gemini": geminiBanner,
    "DTS": dtsBanner,
  };

  // Custom sorting for Centurion products: D3, D5, D6, D10, Vantage, then parts
  const getCenturionSortGroup = (product: Product): number => {
    const name = product.name.toLowerCase();
    if (name.includes('d3')) return 1;
    if (name.includes('d5')) return 2;
    if (name.includes('d6')) return 3;
    if (name.includes('d10')) return 4;
    if (name.includes('vantage')) return 5;
    return 6; // Parts and accessories
  };

  const sortCenturionProducts = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      const groupA = getCenturionSortGroup(a);
      const groupB = getCenturionSortGroup(b);
      if (groupA !== groupB) return groupA - groupB;
      return parseFloat(a.price) - parseFloat(b.price);
    });
  };

  // Organize products by brand for gate-motors category (only when no filters active)
  const brandSections = useMemo((): BrandSection[] | null => {
    if (!shouldUseBrandSections || !products) {
      return null;
    }

    const brandsWithBanners = Object.keys(brandBanners);
    const sections: BrandSection[] = [];
    const otherProducts: Product[] = [];

    // Group products by brand
    const productsByBrand: Record<string, Product[]> = {};
    products.forEach(product => {
      const productBrand = product.brand || 'Other';
      if (!productsByBrand[productBrand]) {
        productsByBrand[productBrand] = [];
      }
      productsByBrand[productBrand].push(product);
    });

    // Add sections for brands with banners first
    brandsWithBanners.forEach(brandName => {
      if (productsByBrand[brandName]) {
        // Use custom sorting for Centurion, default price sorting for others
        const sortedProducts = brandName === 'Centurion'
          ? sortCenturionProducts(productsByBrand[brandName])
          : [...productsByBrand[brandName]].sort(
              (a, b) => parseFloat(a.price) - parseFloat(b.price)
            );
        sections.push({
          brand: brandName,
          banner: brandBanners[brandName],
          products: sortedProducts,
        });
      }
    });

    // Collect remaining products (brands without banners) - these go to DTS section
    Object.entries(productsByBrand).forEach(([brandName, brandProducts]) => {
      if (!brandsWithBanners.includes(brandName)) {
        otherProducts.push(...brandProducts);
      }
    });

    // Add remaining products to DTS section (merge with existing DTS products if any)
    if (otherProducts.length > 0) {
      // Find existing DTS section and add remaining products to it
      const dtsSection = sections.find(s => s.brand === 'DTS');
      if (dtsSection) {
        dtsSection.products = [...dtsSection.products, ...otherProducts].sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
      } else {
        // Create DTS section with remaining products
        sections.push({
          brand: 'DTS',
          banner: brandBanners['DTS'],
          products: otherProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
        });
      }
    }

    return sections;
  }, [shouldUseBrandSections, products]);

  if (!isLoading && !category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Category not found</h1>
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // SEO title and description for all categories
  const getSEOTitle = () => {
    if (currentSEO) {
      return currentSEO.title;
    }
    return `${category?.name || 'Category'} | Security Products | Alectra Solutions`;
  };

  const getSEODescription = () => {
    if (currentSEO) {
      return currentSEO.description;
    }
    return category?.description || `Browse our ${category?.name || 'security'} products. Quality security and automation solutions for South African homes and businesses.`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={getSEOTitle()}
        description={getSEODescription()}
        image={category?.imageUrl || undefined}
        structuredData={categoryStructuredData || undefined}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: category?.name || "Category", href: `/collections/${slug}` },
          ]}
        />

        <div className="mb-8">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-32" />
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                {category?.name}
              </h1>
              <p className="text-muted-foreground">
                {products?.length || 0} {products?.length === 1 ? 'product' : 'products'}
              </p>
              
              {/* LP Gas Pretoria-only delivery notice */}
              {category?.slug === 'lp-gas-exchange' && (
                <Alert className="mt-4 border-primary/50 bg-primary/5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <strong>Pretoria Delivery Only:</strong> LP Gas products are only delivered within Pretoria at a flat rate of R50. Nationwide delivery is not available for LP Gas.
                    <br /><br />
                    <strong>Same-Day Delivery:</strong> Orders placed before 12:00 will be delivered the same day. Orders placed after 12:00 will be scheduled for the next business day. If the next day is a public holiday, delivery will be on the following business day.
                  </AlertDescription>
                </Alert>
              )}

              {/* Category SEO Intro Content */}
              {currentIntro && (
                <div className="mt-6 prose prose-sm max-w-none text-muted-foreground" data-testid="category-intro">
                  <p dangerouslySetInnerHTML={{ __html: currentIntro.content }} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Filter Toggle Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full sm:w-auto"
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            {filtersOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
          {hasActiveFilters && !filtersOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-2"
              data-testid="button-clear-filters-compact"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          {filtersOpen && (
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  data-testid="input-search"
                />
                <Button type="submit" size="icon" data-testid="button-search">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger id="brand" data-testid="select-brand">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands?.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <Label>Price Range</Label>
              <div className="px-2">
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  data-testid="slider-price"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span data-testid="text-min-price">R{priceRange[0]}</span>
                <span data-testid="text-max-price">R{priceRange[1]}</span>
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {/* Products Grid */}
          <div className={filtersOpen ? "lg:col-span-3" : "lg:col-span-4"}>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products && products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No products found</p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" data-testid="button-clear-no-results">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : brandSections ? (
              /* Brand-organized layout for gate-motors */
              (<div className="space-y-12">
                {brandSections.map((section) => (
                  <div key={section.brand} data-testid={`brand-section-${section.brand.toLowerCase().replace(/\s+/g, '-')}`}>
                    {/* Brand Banner */}
                    {section.banner && (
                      <div className="mb-6 rounded-lg overflow-hidden">
                        <img
                          src={section.banner}
                          alt={`${section.brand} products`}
                          className="w-full h-auto object-cover"
                          data-testid={`banner-${section.brand.toLowerCase()}`}
                        />
                      </div>
                    )}
                    {/* Brand Section Header (only for sections without banners) */}
                    {!section.banner && (
                      <h2 className="text-2xl font-bold mb-6" data-testid={`heading-${section.brand.toLowerCase().replace(/\s+/g, '-')}`}>
                        {section.brand}
                      </h2>
                    )}
                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {section.products.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={onAddToCart}
                          priority={index < 4}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>)
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {products?.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={onAddToCart}
                      priority={index < 4}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="min-w-[40px]"
                            data-testid={`button-page-${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* FAQ Section for SEO - All Categories */}
        {currentFAQ.length > 0 && (
          <div className="mt-12 border-t pt-8" data-testid="faq-section">
            <h2 className="text-2xl font-bold mb-6">{currentFAQTitle}</h2>
            <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
              {currentFAQ.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} data-testid={`accordion-item-faq-${index}`}>
                  <AccordionTrigger className="text-left font-medium" data-testid={`accordion-trigger-faq-${index}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground" data-testid={`accordion-content-faq-${index}`}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Buying Guide Content */}
            {currentBuyingGuide && (
              <div className="mt-8 prose prose-sm max-w-none text-muted-foreground" data-testid="buying-guide">
                <h3 className="text-lg font-semibold text-foreground">{currentBuyingGuide.title}</h3>
                <p>{currentBuyingGuide.content}</p>
                <ul className="list-disc pl-5 space-y-2">
                  {currentBuyingGuide.points.map((point, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: point }} />
                  ))}
                </ul>
                <p className="mt-4">
                  <strong>Need help choosing?</strong> Contact us at <a href="mailto:alectraglobal@gmail.com" className="text-primary hover:underline">alectraglobal@gmail.com</a> for 
                  personalized recommendations.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
