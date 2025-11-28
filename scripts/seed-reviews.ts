import { db } from "../server/db";
import { products, productReviews, categories } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Realistic South African names - expanded list
const firstNames = [
  "Thabo", "Sipho", "Nomsa", "Lerato", "Andries", "Johan", "Susan", "Linda",
  "Patrick", "Mary", "David", "Sarah", "Michael", "Jennifer", "Peter", "Lisa",
  "Johannes", "Maria", "Pieter", "Anna", "Nkosi", "Zanele", "Trevor", "Michelle",
  "Ruben", "Chantal", "Marco", "Nicole", "Ayanda", "Themba", "Precious", "Lucky",
  "Willem", "Elsa", "Francois", "Annemarie", "Bongani", "Thandiwe", "Marius", "Cornelia",
  "Kagiso", "Palesa", "Hendrik", "Marietjie", "Sibusiso", "Nokuthula", "Gerhard", "Antoinette",
  "Tshepo", "Refilwe", "Andre", "Beatrix", "Mpho", "Dineo", "Stefan", "Wilma",
  "Sifiso", "Nomvula", "Kobus", "Aletta", "Lwazi", "Busisiwe", "Danie", "Sanette",
  "Mandla", "Lindiwe", "Christiaan", "Mariaan", "Vuyo", "Ntombi", "Frikkie", "Hannelie",
  "Jabu", "Zandile", "Henk", "Petra", "Thabiso", "Kgomotso", "Piet", "Anita",
  "Kabelo", "Puleng", "Nico", "Magda", "Senzo", "Mbali", "Ernst", "Elaine",
  "Buntu", "Xoliswa", "Neels", "Sonja", "Jabulani", "Bongiwe", "Louis", "Ronel"
];

const lastNames = [
  "van der Merwe", "Botha", "Naidoo", "Mthembu", "Smith", "Williams", "Jones",
  "Dlamini", "Khumalo", "Nel", "Visser", "Steyn", "van Zyl", "Pillay", "Chetty",
  "Govender", "Mbatha", "Molefe", "Radebe", "Tshabalala", "du Plessis", "Fourie",
  "Pretorius", "van Wyk", "Nkosi", "Mahlangu", "Mokoena", "Bester", "Coetzee",
  "Jacobs", "Jansen", "Kruger", "Louw", "Malan", "Swanepoel", "van Rensburg",
  "Venter", "Vermeulen", "Zulu", "Ndlovu", "Shabalala", "Sithole", "Ngcobo",
  "Zwane", "Cele", "Mkhize", "Buthelezi", "Mabaso", "Zungu", "Gumede", "Nyathi"
];

// Generic positive reviews (no product mention) - 5 stars - LARGE POOL
const fiveStarGeneric = [
  "Absolutely brilliant! Couldn't be happier with this purchase.",
  "Exceeded all my expectations. Top quality stuff.",
  "This is exactly what I was looking for. Perfect!",
  "Outstanding quality and great value for money.",
  "Very impressed with the build quality.",
  "Works flawlessly. Highly recommended!",
  "Best purchase I've made this year.",
  "Professional grade equipment at a fair price.",
  "Arrived quickly and works perfectly.",
  "No complaints whatsoever. Five stars deserved.",
  "Really happy with this. Would buy again.",
  "Exactly as described. Very pleased.",
  "Great product and fast delivery from Alectra.",
  "Quality is superb. Worth every rand.",
  "Perfect condition and works great.",
  "Fantastic quality, better than expected.",
  "Very satisfied customer here!",
  "Alectra delivered again. Great product.",
  "Would definitely recommend to friends.",
  "Everything I hoped for and more.",
  "Top notch quality all round.",
  "Does exactly what it should. Love it.",
  "Brilliant purchase. Very happy.",
  "Can't fault it. Excellent product.",
  "Really impressed with the quality.",
  "Super happy with my purchase!",
  "Great value. Works perfectly.",
  "Exactly what I needed. Thanks Alectra!",
  "Quality speaks for itself here.",
  "Very well made and reliable.",
  "Impressed with how well this works.",
  "Perfect addition to my setup. Love it.",
  "Best value I've found anywhere.",
  "Excellent build. Very sturdy.",
  "Works like a charm. Very pleased.",
  "This exceeded my expectations completely.",
  "Top quality from Alectra as always.",
  "Brilliant. Just brilliant.",
  "Money well spent on this one.",
  "Fantastic purchase. No regrets.",
  "Works great in all conditions.",
  "Very reliable. Haven't had any issues.",
  "Outstanding. Would buy again.",
  "Perfect fit and works beautifully.",
  "Really pleased with this purchase.",
  "A+ quality. Very impressed.",
  "Excellent craftsmanship throughout.",
  "Just what the doctor ordered!",
  "Top marks from me. Great product.",
  "Couldn't ask for better quality."
];

// Generic positive reviews - 4 stars - LARGE POOL
const fourStarGeneric = [
  "Good solid product. Does the job well.",
  "Happy with this purchase. Works great.",
  "Good quality for the price.",
  "Works as expected. Would recommend.",
  "Solid product. Minor things but overall good.",
  "Good value. Doing its job nicely.",
  "Pretty happy with this purchase.",
  "Works well. Delivery was quick too.",
  "Does what it says on the box.",
  "Nice product. Good build quality.",
  "Satisfied with this. Works properly.",
  "Good purchase. Would buy from Alectra again.",
  "Quality is good. No major issues.",
  "Works fine. Happy overall.",
  "Decent product at a fair price.",
  "Good stuff. Minor improvements possible.",
  "Does the job. Can't complain really.",
  "Solid choice. Working well so far.",
  "Happy customer. Good product.",
  "Works nicely. Recommended.",
  "Good product overall. Would recommend.",
  "Meets expectations. Works well.",
  "Decent buy. Happy with it.",
  "Good quality construction.",
  "Functions as advertised.",
  "Pleased with this purchase.",
  "Working well for me.",
  "Good value for money spent.",
  "Reliable so far. Happy.",
  "Does what I needed it to do."
];

// Generic decent reviews - 3 stars - EXPANDED
const threeStarGeneric = [
  "It's okay. Gets the job done.",
  "Average product but works fine.",
  "Does what it needs to. Nothing special.",
  "Fair enough for the price paid.",
  "Acceptable quality. Works as expected.",
  "Decent product. Room for improvement.",
  "It works. That's the main thing.",
  "Okay purchase. Meets basic requirements.",
  "Not bad. Could be better in places.",
  "Middle of the road but functional.",
  "Does the job adequately.",
  "Okay for what I paid.",
  "Standard quality. Works fine.",
  "Acceptable for basic use.",
  "Nothing fancy but it works."
];

// Category-specific reviews mentioning the product type
const categorySpecificReviews: Record<string, { fiveStar: string[], fourStar: string[], threeStar: string[] }> = {
  "electric-fencing": {
    fiveStar: [
      "Best electric fence energizer I've ever used. The power output is consistent and reliable.",
      "This electric fencing equipment is top quality. My perimeter is now properly secured.",
      "Excellent energizer. Keeps the fence hot at all times. Very impressed.",
      "Great quality electric fence components. Installation was straightforward.",
      "The fence is working beautifully. Strong deterrent for any intruders.",
      "Powerful energizer that handles my entire property fence with ease.",
      "Quality electric fencing gear. The beams detect everything perfectly.",
      "My electric fence has never worked better. Highly recommend this equipment.",
      "Solid electric fence setup. The warning signs and components are excellent.",
      "Professional grade electric fencing. Exactly what our property needed.",
      "This energizer packs serious punch. Would-be intruders won't try twice.",
      "Reliable electric fence component. Been running for months without issues.",
      "Perfect for my smallholding fence. Great value and works flawlessly.",
      "The warning light is bright and the fence is consistently hot. Love it.",
      "Top quality fencing gear. Security sorted for my property.",
      "Excellent electric fence wire. Strong and easy to work with.",
      "This fence siren scared off intruders on day one. Brilliant product.",
      "Great fence spring tension. Keeps everything tight and secure.",
      "The energizer was easy to install. My fence has never been stronger.",
      "Quality electric fence cables. No corrosion even after heavy rains.",
      "Best fence beams I've used. Detection is spot on every time.",
      "Solid fencing accessory. My installer was impressed with the quality.",
      "This electric fence bracket is sturdy and well made.",
      "Excellent fence insulators. Holding up well in all weather.",
      "Great straining rod. Made fence installation much easier.",
      "Top notch electric fencing kit. Everything I needed in one box.",
      "The fence is so reliable now. Peace of mind every night.",
      "Quality stainless steel wire. Will last for years on my fence.",
      "Best fence investment I've made. Security is now sorted."
    ],
    fourStar: [
      "Good electric fence energizer. Doing its job well.",
      "Solid fencing equipment. The perimeter is now secure.",
      "Happy with this electric fence setup. Works reliably.",
      "Decent energizer for the price. Powers the fence nicely.",
      "Good electric fencing components. Would recommend.",
      "Nice fence cable. Easy to install and works well.",
      "Good quality fence brackets. Sturdy construction.",
      "Happy with this fence insulator pack. Good value.",
      "Decent electric fence wire. Does the job.",
      "Solid fencing accessory for the price.",
      "Good fence siren. Nice and loud when triggered.",
      "Works well for my electric fence. Happy overall.",
      "Good fence spring. Keeps tension properly.",
      "Nice warning signs. Clear and visible."
    ],
    threeStar: [
      "Electric fence works okay. Does what it needs to.",
      "Average energizer but functional for basic needs.",
      "The fencing equipment is decent for smaller properties.",
      "Fence component works fine. Nothing amazing.",
      "Okay for the price. Gets the job done.",
      "Standard fence accessory. Works as expected."
    ]
  },
  "gate-motors": {
    fiveStar: [
      "This gate motor is incredibly powerful and smooth. Best investment for my property.",
      "Fantastic gate motor! Opens the gate quickly and quietly every time.",
      "Brilliant gate automation. The motor handles my heavy sliding gate with ease.",
      "Excellent gate motor. Even during load shedding, it works on battery backup.",
      "Top quality gate motor. Centurion really knows their stuff.",
      "The sliding gate motor is superb. Smooth operation day and night.",
      "Gate motor is powerful and reliable. No more manual gate opening!",
      "Love this gate motor. Quick installation and works flawlessly.",
      "Heavy duty gate motor that doesn't struggle with my 4m gate.",
      "Best gate automation decision I've made. Smooth and reliable.",
      "This D5 Evo is brilliant. Gate opens in seconds every time.",
      "Motor handles my industrial gate perfectly. Very impressed.",
      "Excellent motor bracket. Keeps everything aligned properly.",
      "Great gate motor cover. Protects the unit from weather.",
      "The anti-theft bracket is solid. Extra security for my motor.",
      "Quality gate motor cable. Proper gauge for the installation.",
      "This D10 motor is a beast. Handles my 800kg gate easily.",
      "Great motor base plate. Made installation so much easier.",
      "Reliable gate motor parts. Installer said these are quality.",
      "Love how quiet this gate motor is. Neighbors don't even notice.",
      "Motor rack is perfect fit. Gate runs smoothly now.",
      "Best D3 motor accessory I've bought. Works great."
    ],
    fourStar: [
      "Good gate motor. Opens the gate reliably every time.",
      "Solid motor for my sliding gate. Works well.",
      "Happy with this gate automation. Smooth operation.",
      "Decent gate motor. Does the job without issues.",
      "Good quality motor. Gate opens and closes properly.",
      "Nice motor accessory. Fits well and works.",
      "Good gate motor cover. Keeps dust out.",
      "Solid motor bracket for the price.",
      "Happy with this gate motor cable.",
      "Good motor base plate. Installation was easy."
    ],
    threeStar: [
      "Gate motor works okay. Gets the job done.",
      "Average motor but functional for daily use.",
      "Decent gate automation for the price.",
      "Motor accessory works fine. Nothing special.",
      "Okay for the price I paid."
    ]
  },
  "cctv-cameras": {
    fiveStar: [
      "Excellent CCTV camera! Crystal clear footage day and night.",
      "This security camera is fantastic. Night vision is incredibly clear.",
      "Best surveillance system I've owned. The image quality is outstanding.",
      "Amazing CCTV setup. Can see everything clearly on my phone.",
      "Top quality security camera. DVR recording works perfectly.",
      "Brilliant camera system. Night vision catches everything.",
      "The CCTV footage is so clear. Great for identifying faces and cars.",
      "Excellent security cameras. Feel much safer now.",
      "HiLook cameras are excellent. Professional quality surveillance.",
      "Outstanding camera quality. Motion detection works perfectly.",
      "This DVR is brilliant. Easy to set up and playback footage.",
      "Best camera cable I've used. Signal is crystal clear.",
      "Great CCTV power supply. Runs all my cameras without issues.",
      "Excellent BNC connectors. Solid connection every time.",
      "The camera junction box is weatherproof. Perfect for outdoors.",
      "Quality CAT6 cable for my camera system. Works great.",
      "This Hikvision camera is top notch. Clear 4K footage.",
      "Great video balun set. Makes installation much easier.",
      "The 8-channel DVR is perfect for my property size.",
      "Excellent camera mounting bracket. Sturdy and adjustable."
    ],
    fourStar: [
      "Good quality CCTV camera. Clear pictures during the day.",
      "Solid surveillance camera. Night vision is decent.",
      "Happy with this security camera. Records well.",
      "Good camera system for home security.",
      "Decent CCTV setup. Does what it needs to.",
      "Nice camera cable. Picture quality is good.",
      "Good BNC connectors for the price.",
      "Solid DVR for home use.",
      "Happy with this camera power supply.",
      "Good junction box. Keeps connections dry."
    ],
    threeStar: [
      "Camera works okay. Picture quality is acceptable.",
      "Average CCTV but functional for basic monitoring.",
      "Decent surveillance for the price paid.",
      "CCTV accessory works fine. Nothing special.",
      "Okay for basic camera needs."
    ]
  },
  "garage-door-parts": {
    fiveStar: [
      "Perfect replacement parts for my garage door. Fits exactly right.",
      "Excellent garage door hinges. Made the door operate smoothly again.",
      "Quality garage door components. My door works like new now.",
      "Great garage door parts. The rollers are much better than originals.",
      "These parts fixed my noisy garage door completely. Excellent quality.",
      "Perfect fit for my Glosteel door. Quality parts that last.",
      "Garage door cable is strong and reliable. Good replacement.",
      "Excellent quality hinges. The garage door operates silently now.",
      "Good garage door bearings. Smooth operation restored.",
      "Quality parts that made my garage door work properly again."
    ],
    fourStar: [
      "Good garage door parts. Fit properly.",
      "Solid replacement components for my door.",
      "Happy with these garage door hinges.",
      "Decent parts. Door working well now.",
      "Good quality rollers for the garage door."
    ],
    threeStar: [
      "Parts work okay. Door is functional now.",
      "Average quality but does the job.",
      "Acceptable parts for basic repair."
    ]
  },
  "garage-motors": {
    fiveStar: [
      "Brilliant garage motor! Opens my heavy sectional door with no struggle.",
      "This garage door motor is fantastic. Quiet and powerful.",
      "Excellent motor for my roll-up garage door. Works perfectly.",
      "Top quality garage motor. The remote range is excellent.",
      "Best garage automation. Opens quickly and quietly.",
      "Love this garage motor. Heavy door, no problem at all.",
      "Fantastic garage door opener. Very pleased with the performance.",
      "The motor handles my double garage door easily. Excellent.",
      "Great garage motor. Battery backup works during load shedding too.",
      "Outstanding garage door motor. Professional installation quality."
    ],
    fourStar: [
      "Good garage motor. Opens the door reliably.",
      "Solid motor for my garage. Works well.",
      "Happy with this garage door opener.",
      "Decent motor. Garage door works smoothly now.",
      "Good quality motor for the price."
    ],
    threeStar: [
      "Garage motor works okay. Does the job.",
      "Average motor but functional daily.",
      "Decent for basic garage automation."
    ]
  },
  "remotes": {
    fiveStar: [
      "Excellent remote! Works perfectly with my gate motor.",
      "This remote has great range. Can open the gate from my driveway entrance.",
      "Quality remote transmitter. Very responsive and reliable.",
      "Best replacement remote I've bought. Pairs easily with my system.",
      "Fantastic remote. The buttons are responsive and battery lasts long.",
      "Great Centurion remote. Works flawlessly every time.",
      "Excellent quality remote. Range is impressive.",
      "Love this remote. Programming was simple and it works great.",
      "Top quality transmitter. Much better than cheap alternatives.",
      "Perfect replacement remote. Works exactly like the original."
    ],
    fourStar: [
      "Good remote. Works well with my gate.",
      "Solid transmitter. Range is decent.",
      "Happy with this remote. Reliable operation.",
      "Decent remote for the price.",
      "Good quality. Gate opens every time."
    ],
    threeStar: [
      "Remote works okay. Does what it should.",
      "Average but functional remote.",
      "Acceptable for basic needs."
    ]
  },
  "intercoms": {
    fiveStar: [
      "Excellent intercom system! Crystal clear audio and video.",
      "This intercom is fantastic. Can see and speak to visitors clearly.",
      "Best intercom I've used. The G-Speak system is brilliant.",
      "Amazing intercom quality. Easy to use and very reliable.",
      "Top quality keypad intercom. Access control is perfect now.",
      "Brilliant intercom system. Very happy with the clarity.",
      "Excellent video intercom. Night vision works great too.",
      "The intercom quality is superb. Very professional setup.",
      "Great Centurion intercom. Easy installation and works perfectly.",
      "Outstanding intercom. Security at the gate is now excellent."
    ],
    fourStar: [
      "Good intercom system. Clear audio.",
      "Solid intercom. Works reliably.",
      "Happy with this intercom setup.",
      "Decent quality for the price.",
      "Good keypad intercom. Functions well."
    ],
    threeStar: [
      "Intercom works okay. Basic but functional.",
      "Average system but does the job.",
      "Decent for basic communication needs."
    ]
  },
  "batteries": {
    fiveStar: [
      "Excellent battery! Powers my gate motor perfectly during load shedding.",
      "This battery holds charge really well. Great backup power.",
      "Best backup battery I've bought. Lasts through multiple outages.",
      "Quality battery that actually delivers on its rating.",
      "Fantastic battery backup. Gate works perfectly when power goes.",
      "Excellent gel battery. No maintenance and reliable power.",
      "Top quality battery. Keeps my security system running always.",
      "Great 12V battery. Powers everything it should.",
      "Reliable battery backup. Essential for load shedding in SA.",
      "Excellent capacity battery. Very impressed with performance."
    ],
    fourStar: [
      "Good battery. Holds charge well.",
      "Solid backup power. Works reliably.",
      "Happy with this battery purchase.",
      "Decent capacity for the size.",
      "Good quality battery for backup."
    ],
    threeStar: [
      "Battery works okay. Provides basic backup.",
      "Average but functional for load shedding.",
      "Decent battery for the price."
    ]
  },
  "lp-gas-exchange": {
    fiveStar: [
      "Great gas cylinder! Exchange process was quick and easy.",
      "Excellent LP gas quality. Burns clean and lasts well.",
      "Best gas exchange service. Quick turnaround.",
      "Quality gas cylinder at a fair price. Very happy.",
      "Great service for gas exchange. Cylinder was full and clean.",
      "Excellent LP gas. Perfect for my braai.",
      "Top quality gas. Burns efficiently.",
      "Happy with the gas exchange. Quick and professional.",
      "Good quality cylinder. No issues at all.",
      "Great gas for cooking and heating. Recommended."
    ],
    fourStar: [
      "Good gas cylinder. Exchange was simple.",
      "Solid LP gas quality. Works well.",
      "Happy with this gas exchange.",
      "Decent price for gas exchange.",
      "Good service overall."
    ],
    threeStar: [
      "Gas works okay. Standard quality.",
      "Average exchange experience.",
      "Decent for basic needs."
    ]
  }
};

// General product reviews for uncategorized products
const uncategorizedReviews = {
  fiveStar: [
    "Excellent quality product. Very happy with this purchase.",
    "Great item. Works perfectly for what I needed.",
    "Top quality. Would definitely buy from Alectra again.",
    "Perfect. Exactly what I was looking for.",
    "Outstanding product. Highly recommended.",
    "Very impressed with the quality. Great buy.",
    "Fantastic product. Works flawlessly.",
    "Excellent purchase. Worth every cent.",
    "Great quality and fast delivery.",
    "Very satisfied. Product exceeded expectations."
  ],
  fourStar: [
    "Good product. Does what it should.",
    "Happy with this purchase. Works well.",
    "Solid quality for the price.",
    "Good item. Would recommend.",
    "Decent product. Satisfied overall."
  ],
  threeStar: [
    "Product works okay. Does the job.",
    "Average but functional.",
    "Decent for the price."
  ]
};

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomName(): string {
  return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

// Only 3, 4, 5 star ratings with weighted distribution
function getRandomRating(): number {
  const rand = Math.random();
  if (rand < 0.55) return 5;  // 55% are 5-star
  if (rand < 0.85) return 4;  // 30% are 4-star
  return 3;  // 15% are 3-star
}

function getRandomDateInPast(): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 365);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// Track used comments to avoid duplicates
const usedComments = new Set<string>();

function getUniqueComment(pool: string[]): string | null {
  const availableComments = pool.filter(c => !usedComments.has(c));
  if (availableComments.length === 0) {
    // If all are used, reset and pick from full pool with minor variation
    const base = getRandomElement(pool);
    const variations = [
      base,
      base + " ",  // Tiny variation to make unique
      " " + base
    ];
    const comment = getRandomElement(variations);
    usedComments.add(comment);
    return comment;
  }
  const comment = getRandomElement(availableComments);
  usedComments.add(comment);
  return comment;
}

function getCommentForRating(rating: number, categorySlug: string | null, isProductSpecific: boolean): string | null {
  let pool: string[];
  
  if (isProductSpecific && categorySlug && categorySpecificReviews[categorySlug]) {
    // Use category-specific reviews
    const categoryReviews = categorySpecificReviews[categorySlug];
    switch (rating) {
      case 5: pool = categoryReviews.fiveStar; break;
      case 4: pool = categoryReviews.fourStar; break;
      case 3: pool = categoryReviews.threeStar; break;
      default: pool = categoryReviews.fiveStar;
    }
  } else if (isProductSpecific && !categorySlug) {
    // Uncategorized products
    switch (rating) {
      case 5: pool = uncategorizedReviews.fiveStar; break;
      case 4: pool = uncategorizedReviews.fourStar; break;
      case 3: pool = uncategorizedReviews.threeStar; break;
      default: pool = uncategorizedReviews.fiveStar;
    }
  } else {
    // Generic reviews
    switch (rating) {
      case 5: pool = fiveStarGeneric; break;
      case 4: pool = fourStarGeneric; break;
      case 3: pool = threeStarGeneric; break;
      default: pool = fiveStarGeneric;
    }
  }
  
  return getUniqueComment(pool);
}

async function seedReviews() {
  console.log("Starting comprehensive review seeding...\n");
  
  // Clear existing reviews
  console.log("Clearing existing reviews...");
  await db.delete(productReviews);
  console.log("Existing reviews cleared.\n");
  
  // Reset used comments tracker
  usedComments.clear();
  
  // Get all products with their categories
  const allProducts = await db.select({
    id: products.id,
    name: products.name,
    categoryId: products.categoryId
  }).from(products);
  
  console.log(`Found ${allProducts.length} products\n`);
  
  // Get category mapping
  const allCategories = await db.select().from(categories);
  const categoryIdToSlug = new Map<string, string>();
  for (const cat of allCategories) {
    categoryIdToSlug.set(cat.id, cat.slug);
  }
  
  let totalReviews = 0;
  const categoryStats: Record<string, number> = {};
  
  for (const product of allProducts) {
    // Random number of reviews per product (1-4)
    const reviewCount = Math.floor(Math.random() * 4) + 1;
    const categorySlug = product.categoryId ? categoryIdToSlug.get(product.categoryId) || null : null;
    
    if (categorySlug) {
      categoryStats[categorySlug] = (categoryStats[categorySlug] || 0) + reviewCount;
    } else {
      categoryStats['uncategorized'] = (categoryStats['uncategorized'] || 0) + reviewCount;
    }
    
    for (let i = 0; i < reviewCount; i++) {
      const rating = getRandomRating();
      // First review for each product should be product-specific
      const isProductSpecific = i < 2; // First 1-2 reviews mention product type
      const comment = getCommentForRating(rating, categorySlug, isProductSpecific);
      const authorName = getRandomName();
      const createdAt = getRandomDateInPast();
      
      try {
        await db.insert(productReviews).values({
          productId: product.id,
          rating,
          comment,
          authorName,
          createdAt,
        });
        totalReviews++;
      } catch (e: any) {
        console.error(`Failed to add review for ${product.name}: ${e.message}`);
      }
    }
  }
  
  console.log(`\n✅ Seeding complete!`);
  console.log(`Added ${totalReviews} reviews across ${allProducts.length} products`);
  console.log(`Average: ${(totalReviews / allProducts.length).toFixed(1)} reviews per product\n`);
  console.log("Reviews by category:");
  for (const [cat, count] of Object.entries(categoryStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count} reviews`);
  }
}

seedReviews()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding reviews:", error);
    process.exit(1);
  });
