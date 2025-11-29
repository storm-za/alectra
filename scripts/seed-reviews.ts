import { db } from "../server/db";
import { products, productReviews, categories } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

// Realistic South African names
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

// =============================================================================
// PRODUCT SUBTYPE DETECTION SYSTEM
// =============================================================================

type ProductSubtype = 
  // Electric Fencing subtypes
  | "energizer" | "strobe-light" | "siren" | "warning-sign" | "fence-cable" | "fence-wire"
  | "fence-spring" | "fence-beam" | "fence-bracket" | "fence-insulator" | "fence-kit"
  // Gate Motors subtypes  
  | "gate-motor" | "motor-bracket" | "motor-cover" | "motor-cable" | "motor-rack" | "motor-base"
  // CCTV subtypes
  | "camera" | "dvr" | "camera-cable" | "power-supply" | "bnc-connector" | "junction-box" | "balun"
  // Garage Door Parts subtypes
  | "door-hinge" | "door-roller" | "door-cable" | "door-bearing" | "door-bracket" | "glosteel-door"
  // Garage Motors subtypes
  | "garage-motor"
  // Remotes subtypes
  | "remote"
  // Intercoms subtypes
  | "intercom" | "keypad" | "maglock"
  // Batteries subtypes
  | "battery"
  // LP Gas subtypes
  | "gas-cylinder"
  // Generic
  | "generic";

// Keywords to detect product subtypes from product name
const subtypeKeywords: Record<ProductSubtype, string[]> = {
  // Electric Fencing
  "energizer": ["energizer", "energiser", "joule", "megashock", "merlin"],
  "strobe-light": ["strobe", "strobe light", "warning light", "flash", "flasher"],
  "siren": ["siren", "hooter", "alarm"],
  "warning-sign": ["warning sign", "sign", "danger"],
  "fence-cable": ["cable", "ht cable", "slimline"],
  "fence-wire": ["wire", "braided", "stainless steel wire"],
  "fence-spring": ["spring", "tension spring"],
  "fence-beam": ["beam", "infrared", "ir beam"],
  "fence-bracket": ["bracket", "wall bracket", "corner bracket"],
  "fence-insulator": ["insulator", "strain insulator"],
  "fence-kit": ["kit", "fence kit", "electric fence kit"],
  // Gate Motors
  "gate-motor": ["d5", "d10", "d3", "gate motor", "sliding gate", "swing gate", "evo"],
  "motor-bracket": ["anti-theft bracket", "motor bracket", "mounting bracket"],
  "motor-cover": ["motor cover", "cover"],
  "motor-cable": ["motor cable", "power cable", "core cable"],
  "motor-rack": ["rack", "steel rack", "nylon rack"],
  "motor-base": ["base plate", "base", "mounting plate"],
  // CCTV
  "camera": ["camera", "bullet", "dome", "turret", "hilook", "hikvision"],
  "dvr": ["dvr", "nvr", "recorder", "channel"],
  "camera-cable": ["rg59", "coax", "cat6", "cat5", "siamese"],
  "power-supply": ["power supply", "psu", "12v power", "cctv power"],
  "bnc-connector": ["bnc", "connector", "crimp"],
  "junction-box": ["junction box", "junction", "weatherproof box"],
  "balun": ["balun", "video balun"],
  // Garage Door Parts
  "door-hinge": ["hinge", "hinges"],
  "door-roller": ["roller", "rollers", "wheel"],
  "door-cable": ["garage cable", "lift cable"],
  "door-bearing": ["bearing", "bearings"],
  "door-bracket": ["garage bracket", "end bracket"],
  "glosteel-door": ["glosteel", "sectional door"],
  // Garage Motors
  "garage-motor": ["garage motor", "sectional motor", "roll up motor", "tilt motor", "matic", "miro"],
  // Remotes
  "remote": ["remote", "transmitter", "nova", "tx", "sentry", "gemini"],
  // Intercoms
  "intercom": ["intercom", "g-speak", "gspeak", "smartguard", "kocom", "zartek"],
  "keypad": ["keypad", "keypad intercom"],
  "maglock": ["maglock", "magnetic lock", "mag lock"],
  // Batteries
  "battery": ["battery", "12v", "24v", "gel", "lithium", "ah"],
  // LP Gas
  "gas-cylinder": ["gas", "cylinder", "kg", "lp gas"],
  // Generic fallback
  "generic": []
};

// Detect product subtype from name
function detectProductSubtype(productName: string, categorySlug: string | null): ProductSubtype {
  const nameLower = productName.toLowerCase();
  
  // Check each subtype's keywords
  for (const [subtype, keywords] of Object.entries(subtypeKeywords)) {
    if (subtype === "generic") continue;
    for (const keyword of keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        return subtype as ProductSubtype;
      }
    }
  }
  
  return "generic";
}

// =============================================================================
// SUBTYPE-SPECIFIC REVIEWS (only assigned to matching products)
// =============================================================================

const subtypeReviews: Record<ProductSubtype, { fiveStar: string[], fourStar: string[], threeStar: string[] }> = {
  // Electric Fencing Subtypes
  "energizer": {
    fiveStar: [
      "Best electric fence energizer I've ever used. The power output is consistent.",
      "Excellent energizer. Keeps the fence hot at all times. Very impressed.",
      "Powerful energizer that handles my entire property fence with ease.",
      "This energizer packs serious punch. Would-be intruders won't try twice.",
      "The energizer was easy to install. My fence has never been stronger.",
      "Outstanding energizer performance. Worth every rand.",
      "Reliable energizer. Been running for months without issues."
    ],
    fourStar: [
      "Good electric fence energizer. Doing its job well.",
      "Decent energizer for the price. Powers the fence nicely.",
      "Solid energizer. The perimeter is now secure.",
      "Happy with this energizer. Works reliably."
    ],
    threeStar: [
      "Energizer works okay. Does what it needs to.",
      "Average energizer but functional for basic needs."
    ]
  },
  "strobe-light": {
    fiveStar: [
      "Brilliant strobe light! Very bright and visible from far away.",
      "This warning light is excellent. Flashes brightly and clearly.",
      "Great strobe light for my security system. Very effective.",
      "The strobe light is super bright. Perfect deterrent.",
      "Excellent quality strobe. Built to last outdoors."
    ],
    fourStar: [
      "Good strobe light. Nice and bright.",
      "Solid warning light for the price.",
      "Happy with this strobe. Works well."
    ],
    threeStar: [
      "Strobe works okay. Brightness is acceptable."
    ]
  },
  "siren": {
    fiveStar: [
      "This fence siren scared off intruders on day one. Brilliant!",
      "Excellent siren. Extremely loud when triggered.",
      "Great alarm siren. The whole neighborhood can hear it.",
      "This siren is powerful. Perfect for my security setup."
    ],
    fourStar: [
      "Good fence siren. Nice and loud when triggered.",
      "Solid siren for the price. Works well."
    ],
    threeStar: [
      "Siren works okay. Loud enough for basic needs."
    ]
  },
  "warning-sign": {
    fiveStar: [
      "Great warning sign. Clear and visible. Professional look.",
      "Excellent quality warning sign. Durable material.",
      "Perfect warning signs for my electric fence."
    ],
    fourStar: [
      "Good warning signs. Clear and visible.",
      "Nice warning signs for the fence."
    ],
    threeStar: [
      "Signs are okay. Standard quality."
    ]
  },
  "fence-cable": {
    fiveStar: [
      "Quality electric fence cable. No corrosion even after heavy rains.",
      "Excellent HT cable. Proper insulation and good quality.",
      "Great fence cable. Easy to install and works well.",
      "Top quality cable for my electric fence installation."
    ],
    fourStar: [
      "Good fence cable. Works as expected.",
      "Solid cable for the price. No issues.",
      "Happy with this cable purchase."
    ],
    threeStar: [
      "Cable works okay. Standard quality."
    ]
  },
  "fence-wire": {
    fiveStar: [
      "Excellent electric fence wire. Strong and easy to work with.",
      "Quality stainless steel wire. Will last for years on my fence.",
      "Great fence wire. My installer was impressed with the quality.",
      "Top notch wire. Strong and corrosion resistant."
    ],
    fourStar: [
      "Good quality fence wire. Does the job.",
      "Solid wire for electric fencing.",
      "Happy with this wire. Holds tension well."
    ],
    threeStar: [
      "Wire works okay. Standard quality."
    ]
  },
  "fence-spring": {
    fiveStar: [
      "Great fence spring tension. Keeps everything tight and secure.",
      "Excellent spring quality. Made tensioning the fence easy.",
      "Perfect springs for my electric fence. Very strong."
    ],
    fourStar: [
      "Good fence spring. Keeps tension properly.",
      "Solid spring for the price."
    ],
    threeStar: [
      "Spring works okay. Does the job."
    ]
  },
  "fence-beam": {
    fiveStar: [
      "Best fence beams I've used. Detection is spot on every time.",
      "Excellent infrared beams. Never miss any movement.",
      "Quality fence beams. Very reliable detection.",
      "Great beams for perimeter security."
    ],
    fourStar: [
      "Good fence beams. Detects movement reliably.",
      "Solid beams for the price."
    ],
    threeStar: [
      "Beams work okay. Basic detection."
    ]
  },
  "fence-bracket": {
    fiveStar: [
      "Excellent fence bracket. Sturdy and well made.",
      "Great quality brackets. Made installation much easier.",
      "Solid fence brackets. Professional quality."
    ],
    fourStar: [
      "Good quality fence brackets. Sturdy construction.",
      "Solid brackets for the price."
    ],
    threeStar: [
      "Brackets work okay. Standard quality."
    ]
  },
  "fence-insulator": {
    fiveStar: [
      "Excellent fence insulators. Holding up well in all weather.",
      "Great quality insulators. No leakage whatsoever.",
      "Perfect insulators for my electric fence setup."
    ],
    fourStar: [
      "Good insulators. Work as expected.",
      "Solid insulators for the price."
    ],
    threeStar: [
      "Insulators work okay. Basic quality."
    ]
  },
  "fence-kit": {
    fiveStar: [
      "Top notch electric fencing kit. Everything I needed in one box.",
      "Excellent fence kit. Complete solution for my property.",
      "Great kit. All quality components included.",
      "Perfect fence kit for DIY installation."
    ],
    fourStar: [
      "Good fence kit. Has most things needed.",
      "Solid kit for the price."
    ],
    threeStar: [
      "Kit is okay. Some items could be better quality."
    ]
  },
  // Gate Motors Subtypes
  "gate-motor": {
    fiveStar: [
      "This gate motor is incredibly powerful and smooth. Best investment!",
      "Fantastic gate motor! Opens the gate quickly and quietly every time.",
      "Brilliant gate motor. Handles my heavy sliding gate with ease.",
      "Excellent gate motor. Even during load shedding, it works on battery.",
      "Top quality gate motor. Centurion really knows their stuff.",
      "The sliding gate motor is superb. Smooth operation day and night.",
      "Gate motor is powerful and reliable. No more manual gate opening!",
      "Love this gate motor. Quick installation and works flawlessly.",
      "This D5 Evo is brilliant. Gate opens in seconds every time.",
      "Motor handles my industrial gate perfectly. Very impressed.",
      "This D10 motor is a beast. Handles my 800kg gate easily.",
      "Love how quiet this gate motor is. Neighbors don't even notice."
    ],
    fourStar: [
      "Good gate motor. Opens the gate reliably every time.",
      "Solid motor for my sliding gate. Works well.",
      "Happy with this gate motor. Smooth operation.",
      "Decent gate motor. Does the job without issues.",
      "Good quality motor. Gate opens and closes properly."
    ],
    threeStar: [
      "Gate motor works okay. Gets the job done.",
      "Average motor but functional for daily use."
    ]
  },
  "motor-bracket": {
    fiveStar: [
      "Excellent motor bracket. Keeps everything aligned properly.",
      "The anti-theft bracket is solid. Extra security for my motor.",
      "Great mounting bracket. Very sturdy.",
      "Quality bracket. Made installation much easier."
    ],
    fourStar: [
      "Good motor bracket. Fits well and works.",
      "Solid motor bracket for the price."
    ],
    threeStar: [
      "Bracket works okay. Standard quality."
    ]
  },
  "motor-cover": {
    fiveStar: [
      "Great gate motor cover. Protects the unit from weather.",
      "Excellent cover. Keeps dust and rain out perfectly.",
      "Quality motor cover. Well made and durable."
    ],
    fourStar: [
      "Good gate motor cover. Keeps dust out.",
      "Solid cover for the price."
    ],
    threeStar: [
      "Cover works okay. Basic protection."
    ]
  },
  "motor-cable": {
    fiveStar: [
      "Quality gate motor cable. Proper gauge for the installation.",
      "Excellent power cable. Well insulated and durable.",
      "Great cable for my gate motor setup."
    ],
    fourStar: [
      "Good gate motor cable. Works well.",
      "Solid cable for the price."
    ],
    threeStar: [
      "Cable works okay. Standard quality."
    ]
  },
  "motor-rack": {
    fiveStar: [
      "Motor rack is perfect fit. Gate runs smoothly now.",
      "Excellent steel rack. Very durable and precise.",
      "Great rack for my sliding gate motor."
    ],
    fourStar: [
      "Good motor rack. Gate runs smoothly.",
      "Solid rack for the price."
    ],
    threeStar: [
      "Rack works okay. Does the job."
    ]
  },
  "motor-base": {
    fiveStar: [
      "Great motor base plate. Made installation so much easier.",
      "Excellent base plate. Very sturdy and level.",
      "Perfect base for my gate motor."
    ],
    fourStar: [
      "Good motor base plate. Installation was easy.",
      "Solid base for the price."
    ],
    threeStar: [
      "Base plate works okay. Basic quality."
    ]
  },
  // CCTV Subtypes
  "camera": {
    fiveStar: [
      "Excellent CCTV camera! Crystal clear footage day and night.",
      "This security camera is fantastic. Night vision is incredibly clear.",
      "Best camera I've owned. The image quality is outstanding.",
      "Brilliant camera. Night vision catches everything.",
      "The CCTV footage is so clear. Great for identifying faces and cars.",
      "HiLook cameras are excellent. Professional quality surveillance.",
      "Outstanding camera quality. Motion detection works perfectly.",
      "This Hikvision camera is top notch. Clear footage always."
    ],
    fourStar: [
      "Good quality CCTV camera. Clear pictures during the day.",
      "Solid surveillance camera. Night vision is decent.",
      "Happy with this security camera. Records well.",
      "Good camera for home security."
    ],
    threeStar: [
      "Camera works okay. Picture quality is acceptable.",
      "Average camera but functional for basic monitoring."
    ]
  },
  "dvr": {
    fiveStar: [
      "This DVR is brilliant. Easy to set up and playback footage.",
      "Excellent recorder. Handles all my cameras perfectly.",
      "Great DVR. Remote viewing works flawlessly.",
      "The 8-channel DVR is perfect for my property size."
    ],
    fourStar: [
      "Good DVR. Recording works well.",
      "Solid DVR for home use.",
      "Happy with this recorder."
    ],
    threeStar: [
      "DVR works okay. Basic functionality."
    ]
  },
  "camera-cable": {
    fiveStar: [
      "Best camera cable I've used. Signal is crystal clear.",
      "Quality cable for my camera system. Works great.",
      "Excellent coax cable. No signal loss at all."
    ],
    fourStar: [
      "Good camera cable. Picture quality is good.",
      "Solid cable for the price."
    ],
    threeStar: [
      "Cable works okay. Standard quality."
    ]
  },
  "power-supply": {
    fiveStar: [
      "Great CCTV power supply. Runs all my cameras without issues.",
      "Excellent power supply. Stable and reliable.",
      "Quality PSU for my camera system."
    ],
    fourStar: [
      "Good camera power supply. Works reliably.",
      "Solid power supply for the price."
    ],
    threeStar: [
      "Power supply works okay. Basic quality."
    ]
  },
  "bnc-connector": {
    fiveStar: [
      "Excellent BNC connectors. Solid connection every time.",
      "Great quality connectors. Easy to crimp.",
      "Perfect BNC connectors for my camera install."
    ],
    fourStar: [
      "Good BNC connectors for the price.",
      "Solid connectors. Work well."
    ],
    threeStar: [
      "Connectors work okay. Standard quality."
    ]
  },
  "junction-box": {
    fiveStar: [
      "The camera junction box is weatherproof. Perfect for outdoors.",
      "Excellent junction box. Keeps connections dry and safe.",
      "Great box for outdoor camera installations."
    ],
    fourStar: [
      "Good junction box. Keeps connections dry.",
      "Solid box for the price."
    ],
    threeStar: [
      "Junction box works okay. Basic protection."
    ]
  },
  "balun": {
    fiveStar: [
      "Great video balun set. Makes installation much easier.",
      "Excellent baluns. Signal quality is perfect.",
      "Quality baluns for my camera system."
    ],
    fourStar: [
      "Good baluns. Work as expected.",
      "Solid baluns for the price."
    ],
    threeStar: [
      "Baluns work okay. Standard quality."
    ]
  },
  // Garage Door Parts Subtypes
  "door-hinge": {
    fiveStar: [
      "Excellent garage door hinges. Made the door operate smoothly.",
      "Great hinges. My garage door works like new now.",
      "Quality hinges. The door operates silently now."
    ],
    fourStar: [
      "Good garage door hinges. Fit properly.",
      "Solid hinges for the price."
    ],
    threeStar: [
      "Hinges work okay. Standard quality."
    ]
  },
  "door-roller": {
    fiveStar: [
      "Great garage door rollers. Much better than originals.",
      "Excellent rollers. Door glides smoothly now.",
      "Quality rollers that made my door work properly again."
    ],
    fourStar: [
      "Good quality rollers for the garage door.",
      "Solid rollers for the price."
    ],
    threeStar: [
      "Rollers work okay. Door is functional now."
    ]
  },
  "door-cable": {
    fiveStar: [
      "Garage door cable is strong and reliable. Good replacement.",
      "Excellent lift cable. Very durable.",
      "Quality cable for my garage door."
    ],
    fourStar: [
      "Good garage door cable. Works well.",
      "Solid cable for the price."
    ],
    threeStar: [
      "Cable works okay. Does the job."
    ]
  },
  "door-bearing": {
    fiveStar: [
      "Good garage door bearings. Smooth operation restored.",
      "Excellent bearings. No more squeaking.",
      "Quality bearings for my door."
    ],
    fourStar: [
      "Good bearings. Door works smoothly.",
      "Solid bearings for the price."
    ],
    threeStar: [
      "Bearings work okay. Standard quality."
    ]
  },
  "door-bracket": {
    fiveStar: [
      "Excellent garage bracket. Very sturdy and well made.",
      "Great brackets for my door repair.",
      "Quality brackets that fit perfectly."
    ],
    fourStar: [
      "Good garage brackets. Work well.",
      "Solid brackets for the price."
    ],
    threeStar: [
      "Brackets work okay. Basic quality."
    ]
  },
  "glosteel-door": {
    fiveStar: [
      "Perfect Glosteel door. Quality parts that last.",
      "Excellent Glosteel sectional door. Looks great and works perfectly.",
      "Quality door. Very happy with this purchase."
    ],
    fourStar: [
      "Good Glosteel door. Works well.",
      "Solid door for the price."
    ],
    threeStar: [
      "Door is okay. Standard quality."
    ]
  },
  // Garage Motors
  "garage-motor": {
    fiveStar: [
      "Brilliant garage motor! Opens my heavy sectional door with no struggle.",
      "This garage door motor is fantastic. Quiet and powerful.",
      "Excellent motor for my roll-up garage door. Works perfectly.",
      "Top quality garage motor. The remote range is excellent.",
      "Best garage automation. Opens quickly and quietly.",
      "Love this garage motor. Heavy door, no problem at all.",
      "Great garage motor. Battery backup works during load shedding."
    ],
    fourStar: [
      "Good garage motor. Opens the door reliably.",
      "Solid motor for my garage. Works well.",
      "Happy with this garage door opener.",
      "Decent motor. Garage door works smoothly now."
    ],
    threeStar: [
      "Garage motor works okay. Does the job.",
      "Average motor but functional daily."
    ]
  },
  // Remotes
  "remote": {
    fiveStar: [
      "Excellent remote! Works perfectly with my gate motor.",
      "This remote has great range. Can open the gate from far away.",
      "Quality remote transmitter. Very responsive and reliable.",
      "Best replacement remote I've bought. Pairs easily.",
      "Fantastic remote. The buttons are responsive.",
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
      "Decent remote for the price."
    ],
    threeStar: [
      "Remote works okay. Does what it should.",
      "Average but functional remote."
    ]
  },
  // Intercoms
  "intercom": {
    fiveStar: [
      "Excellent intercom system! Crystal clear audio and video.",
      "This intercom is fantastic. Can see and speak to visitors clearly.",
      "Best intercom I've used. The G-Speak system is brilliant.",
      "Amazing intercom quality. Easy to use and very reliable.",
      "Brilliant intercom system. Very happy with the clarity.",
      "Excellent video intercom. Night vision works great too.",
      "The intercom quality is superb. Very professional setup.",
      "Great Centurion intercom. Easy installation and works perfectly."
    ],
    fourStar: [
      "Good intercom system. Clear audio.",
      "Solid intercom. Works reliably.",
      "Happy with this intercom setup.",
      "Decent quality for the price."
    ],
    threeStar: [
      "Intercom works okay. Basic but functional.",
      "Average system but does the job."
    ]
  },
  "keypad": {
    fiveStar: [
      "Top quality keypad intercom. Access control is perfect now.",
      "Excellent keypad. Easy to program codes.",
      "Great keypad for gate access."
    ],
    fourStar: [
      "Good keypad intercom. Functions well.",
      "Solid keypad for the price."
    ],
    threeStar: [
      "Keypad works okay. Basic functionality."
    ]
  },
  "maglock": {
    fiveStar: [
      "Excellent maglock. Very strong and secure.",
      "Great magnetic lock. Holds the gate firmly.",
      "Quality maglock for my access control."
    ],
    fourStar: [
      "Good maglock. Works reliably.",
      "Solid magnetic lock for the price."
    ],
    threeStar: [
      "Maglock works okay. Basic quality."
    ]
  },
  // Batteries
  "battery": {
    fiveStar: [
      "Excellent battery! Powers my gate motor perfectly during load shedding.",
      "This battery holds charge really well. Great backup power.",
      "Best backup battery I've bought. Lasts through multiple outages.",
      "Quality battery that actually delivers on its rating.",
      "Fantastic battery backup. Gate works perfectly when power goes.",
      "Excellent gel battery. No maintenance and reliable power.",
      "Top quality battery. Keeps my security system running always.",
      "Great 12V battery. Powers everything it should.",
      "Reliable battery backup. Essential for load shedding in SA."
    ],
    fourStar: [
      "Good battery. Holds charge well.",
      "Solid backup power. Works reliably.",
      "Happy with this battery purchase.",
      "Decent capacity for the size."
    ],
    threeStar: [
      "Battery works okay. Provides basic backup.",
      "Average but functional for load shedding."
    ]
  },
  // LP Gas
  "gas-cylinder": {
    fiveStar: [
      "Great gas cylinder! Exchange process was quick and easy.",
      "Excellent LP gas quality. Burns clean and lasts well.",
      "Best gas exchange service. Quick turnaround.",
      "Quality gas cylinder at a fair price. Very happy.",
      "Great service for gas exchange. Cylinder was full and clean.",
      "Excellent LP gas. Perfect for my braai.",
      "Top quality gas. Burns efficiently."
    ],
    fourStar: [
      "Good gas cylinder. Exchange was simple.",
      "Solid LP gas quality. Works well.",
      "Happy with this gas exchange.",
      "Decent price for gas exchange."
    ],
    threeStar: [
      "Gas works okay. Standard quality.",
      "Average exchange experience."
    ]
  },
  // Generic (no product-specific mention)
  "generic": {
    fiveStar: [],
    fourStar: [],
    threeStar: []
  }
};

// =============================================================================
// GENERIC REVIEWS (safe for any product - no product type mentions)
// =============================================================================

const genericReviews = {
  fiveStar: [
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
  ],
  fourStar: [
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
  ],
  threeStar: [
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
  ]
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomName(): string {
  return `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`;
}

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
    // If all are used, pick from full pool with minor variation
    const base = getRandomElement(pool);
    const variations = [base, base + " ", " " + base];
    const comment = getRandomElement(variations);
    usedComments.add(comment);
    return comment;
  }
  const comment = getRandomElement(availableComments);
  usedComments.add(comment);
  return comment;
}

function getCommentForRating(rating: number, subtype: ProductSubtype, useSubtypeSpecific: boolean): string | null {
  let pool: string[];
  
  // Determine which pool to use based on subtype and whether to use specific reviews
  if (useSubtypeSpecific && subtype !== "generic" && subtypeReviews[subtype]) {
    const subtypePool = subtypeReviews[subtype];
    switch (rating) {
      case 5: pool = subtypePool.fiveStar.length > 0 ? subtypePool.fiveStar : genericReviews.fiveStar; break;
      case 4: pool = subtypePool.fourStar.length > 0 ? subtypePool.fourStar : genericReviews.fourStar; break;
      case 3: pool = subtypePool.threeStar.length > 0 ? subtypePool.threeStar : genericReviews.threeStar; break;
      default: pool = genericReviews.fiveStar;
    }
  } else {
    // Use generic reviews
    switch (rating) {
      case 5: pool = genericReviews.fiveStar; break;
      case 4: pool = genericReviews.fourStar; break;
      case 3: pool = genericReviews.threeStar; break;
      default: pool = genericReviews.fiveStar;
    }
  }
  
  return getUniqueComment(pool);
}

// =============================================================================
// MAIN SEEDING FUNCTION
// =============================================================================

async function seedReviews() {
  console.log("Starting comprehensive review seeding with subtype detection...\n");
  
  // Clear existing reviews
  console.log("Clearing existing reviews...");
  await db.delete(productReviews);
  console.log("Existing reviews cleared.\n");
  
  // Get all products with their categories
  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId
    })
    .from(products);
  
  // Get category slugs
  const allCategories = await db.select().from(categories);
  const categoryMap = new Map(allCategories.map(c => [c.id, c.slug]));
  
  console.log(`Found ${allProducts.length} products\n`);
  
  const reviewsToInsert: any[] = [];
  const categoryStats: Record<string, number> = {};
  const subtypeStats: Record<string, number> = {};
  let mismatchWarnings = 0;
  
  for (const product of allProducts) {
    const categorySlug = product.categoryId ? categoryMap.get(product.categoryId) || null : null;
    
    // Detect product subtype from name
    const subtype = detectProductSubtype(product.name, categorySlug);
    
    // Track stats
    subtypeStats[subtype] = (subtypeStats[subtype] || 0) + 1;
    if (categorySlug) {
      categoryStats[categorySlug] = (categoryStats[categorySlug] || 0);
    } else {
      categoryStats["uncategorized"] = (categoryStats["uncategorized"] || 0);
    }
    
    // Determine number of reviews (1-4 per product)
    const numReviews = Math.floor(Math.random() * 4) + 1;
    
    for (let i = 0; i < numReviews; i++) {
      const rating = getRandomRating();
      
      // First review uses subtype-specific, rest use generic to avoid repetition
      const useSubtypeSpecific = i === 0 && subtype !== "generic";
      const comment = getCommentForRating(rating, subtype, useSubtypeSpecific);
      
      if (comment) {
        reviewsToInsert.push({
          productId: product.id,
          rating,
          comment,
          authorName: getRandomName(),
          createdAt: getRandomDateInPast()
        });
        
        if (categorySlug) {
          categoryStats[categorySlug]++;
        } else {
          categoryStats["uncategorized"]++;
        }
      }
    }
  }
  
  // Insert all reviews
  if (reviewsToInsert.length > 0) {
    await db.insert(productReviews).values(reviewsToInsert);
  }
  
  console.log(`\n✅ Seeding complete!`);
  console.log(`Added ${reviewsToInsert.length} reviews across ${allProducts.length} products`);
  console.log(`Average: ${(reviewsToInsert.length / allProducts.length).toFixed(1)} reviews per product`);
  
  console.log("\nReviews by category:");
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} reviews`);
    });
  
  console.log("\nProducts by detected subtype:");
  Object.entries(subtypeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([subtype, count]) => {
      console.log(`  ${subtype}: ${count} products`);
    });
  
  console.log("\nDone!");
}

// Run the seeding
seedReviews()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding reviews:", error);
    process.exit(1);
  });
