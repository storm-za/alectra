import { storage } from "./storage";

interface SEOMeta {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogType: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  structuredData?: string;
}

const SITE_NAME = "Alectra Solutions";
const BASE_URL = "https://alectra.co.za";
const DEFAULT_IMAGE = `${BASE_URL}/alectra-solutions-logo.png`;

const DEFAULT_DESCRIPTION = "South African supplier of gate motors, electric fencing, CCTV, batteries and remotes. Centurion, Nemtek, Hikvision brands. Free delivery over R2500.";

function truncateDescription(text: string, maxLength: number = 155): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).trim() + "...";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function buildSeoTitle(name: string, brand: string): string {
  const full = `${name} - ${brand} | Alectra Solutions`;
  if (full.length <= 60) return full;
  const mid = `${name} | ${brand} - Alectra`;
  if (mid.length <= 60) return mid;
  const short = `${name} | Alectra Solutions`;
  if (short.length <= 60) return short;
  const maxNameLen = 43;
  const truncName = name.length > maxNameLen
    ? name.substring(0, name.lastIndexOf(" ", maxNameLen)).trimEnd() + "\u2026"
    : name;
  return `${truncName} | Alectra Solutions`;
}

const CATEGORY_FAQS: Record<string, Array<{ question: string; answer: string }>> = {
  "gate-motors": [
    { question: "What is the best gate motor for a large sliding gate?", answer: "The Centurion D10 Smart supports gates up to 1000kg and is ideal for large or heavy sliding gates. For lighter gates under 500kg, the Centurion D5 Evo is the most popular choice in South Africa." },
    { question: "How long does a gate motor battery last during load shedding?", answer: "A 7Ah battery provides approximately 50–80 gate cycles per charge. An 18Ah battery gives 150–200 cycles. We recommend upgrading to an 18Ah battery if load shedding exceeds 4 hours daily." },
    { question: "Can I add a backup battery to my existing gate motor?", answer: "Yes. Most Centurion, ET Nice, and Gemini gate motors support an external 12V sealed lead-acid battery. Our battery backup kits are compatible with all major brands." },
    { question: "What is the difference between a sliding and swing gate motor?", answer: "A sliding gate motor drives a gate that moves horizontally along a track. A swing gate motor drives gates that open like a door. The choice depends on your property layout and available space." },
  ],
  "electric-fencing": [
    { question: "What size energizer do I need for my electric fence?", answer: "A general rule is 1 Joule of output energy per 100 metres of fence line. For a typical residential perimeter of 200m, a 2 Joule energizer like the Nemtek Druid 2J is recommended." },
    { question: "Is an electric fence legal in South Africa?", answer: "Yes, electric fences are legal in South Africa when installed according to SANS 10222-3 regulations. They must be fitted with a warning sign every 10 metres and must not deliver more than 5 Joules of output energy." },
    { question: "How high should an electric fence be above my wall?", answer: "The fence should extend at least 0.5m above the top of an existing wall. Most residential installations have 6–8 strands of wire at 80–120mm spacing above a 1.8m brick wall." },
    { question: "Can I install an electric fence myself?", answer: "A basic DIY installation is possible for the wire and insulators, but the energizer must be installed and certified by a registered electrician in compliance with South African law." },
  ],
  "cctv-cameras": [
    { question: "How many CCTV cameras do I need for a typical home?", answer: "Most homes require 4–8 cameras for full coverage: one per entry/exit point, driveway, backyard, and perimeter. A 4-camera 2MP Hikvision kit covers most single residential properties." },
    { question: "Can I view my CCTV cameras remotely on my smartphone?", answer: "Yes. Hikvision cameras connect to the Hik-Connect app and HiLook cameras to the Hik-Central Mobile app. Both allow live viewing, playback, and motion alerts from anywhere in the world." },
    { question: "What resolution should I choose for security cameras?", answer: "2MP (1080p) is sufficient for general surveillance. Choose 4MP for licence plate recognition at driveways. 8MP (4K) is recommended for wide outdoor areas or where zooming in on footage is required." },
    { question: "How much storage do I need for CCTV recordings?", answer: "A 4-camera 2MP system recording continuously requires approximately 500GB–1TB per month. A 1TB hard drive with motion-triggered recording typically stores 30–45 days of footage for a 4-camera system." },
  ],
  "batteries": [
    { question: "What size battery do I need for my gate motor?", answer: "A 7Ah (7 amp-hour) battery is the standard size for most residential gate motors. If you experience load shedding for more than 4 hours a day, upgrade to an 18Ah battery for 2–3x more cycles per charge." },
    { question: "How long does a gate motor battery last before it needs replacing?", answer: "A sealed lead-acid battery typically lasts 2–3 years under normal use. Signs it needs replacing include the gate moving slowly, fewer cycles per charge, or the motor low-battery indicator activating." },
    { question: "Can I use a car battery for my gate motor?", answer: "No. Car batteries are not designed for the repeated discharge-recharge cycles that gate motors require. Use a sealed lead-acid (SLA), gel, or lithium battery specifically designed for gate motor and alarm system use." },
    { question: "Are your batteries compatible with Centurion gate motors?", answer: "Yes. All 12V sealed lead-acid, gel, and lithium batteries we stock are compatible with Centurion, ET Nice, Gemini, and all other major gate motor brands." },
  ],
  "garage-motors": [
    { question: "What type of garage door motor do I need for a sectional door?", answer: "Sectional doors require a ceiling-mounted linear rail motor. The ET Nice Moovo M4 and Centurion SDC are popular choices rated for doors up to 150kg." },
    { question: "Will my garage door motor still work during load shedding?", answer: "Yes, most modern garage motors include a built-in battery backup. Units like the ET Nice Moovo M4 have a built-in rechargeable battery that provides 50–100 cycles during a power outage." },
    { question: "How heavy a door can a garage door motor handle?", answer: "Most residential garage motors are rated for doors up to 150kg. Measure your door and confirm with the motor's rated capacity before purchasing." },
    { question: "Can I operate my garage door motor with a remote?", answer: "Yes. All garage motors include a remote handset. Extra remotes can be purchased and programmed for family members. Smart motors also support smartphone app control." },
  ],
  "garage-door-parts": [
    { question: "How do I know which torsion spring to buy for my garage door?", answer: "You need to measure three dimensions: the spring's length, wire diameter, and inside diameter. Also note whether it is a left-wound or right-wound spring. Bring these measurements or send us a photo for assistance." },
    { question: "How long do garage door torsion springs last?", answer: "Standard torsion springs are rated for 10,000–15,000 cycles, which equates to approximately 7–14 years of daily residential use. High-cycle springs rated at 25,000–50,000 cycles are also available." },
    { question: "Can I replace garage door rollers and hinges myself?", answer: "Roller and hinge replacement is generally DIY-friendly. Torsion spring replacement, however, is dangerous due to the high tension stored in the spring and should be done by a professional." },
  ],
  "intercoms": [
    { question: "What is the difference between a video and audio intercom?", answer: "An audio intercom lets you speak to a visitor at your gate. A video intercom also shows you a live camera image of the visitor. Video intercoms are recommended for security-conscious homeowners." },
    { question: "Can an intercom trigger my gate motor to open?", answer: "Yes. Most wired and wireless intercoms can be connected to a gate motor's trigger input, allowing you to open the gate from inside your home by pressing a button on the indoor unit." },
    { question: "Do wireless intercoms need a power supply?", answer: "Wireless outdoor units are typically battery-powered. The indoor unit plugs into a standard wall socket. Wired systems require a 12V DC power supply for both units." },
  ],
  "remotes": [
    { question: "How do I program a new remote for my Centurion gate motor?", answer: "Press the LEARN button on your motor's control board until the LED flashes, then press the button on your new remote twice. The LED will flash to confirm successful pairing." },
    { question: "What frequency do Centurion gate motor remotes use?", answer: "Centurion remotes operate on 433MHz with rolling code technology for security. Rolling code means the signal changes with each button press, preventing code-grabbing attacks." },
    { question: "Can I get a duplicate remote for any gate motor brand?", answer: "Yes. We stock compatible replacement remotes for Centurion, ET Nice, Digidoor, Gemini, and most other brands. Universal remotes are also available for older systems." },
  ],
  "lp-gas-exchange": [
    { question: "What LP Gas cylinder sizes do you deliver?", answer: "We deliver 9kg and 19kg LP Gas cylinders in Pretoria. The 9kg cylinder is ideal for household cooking and braais; the 19kg is for gas heaters, large appliances, or high-use households." },
    { question: "How does the cylinder exchange service work?", answer: "You swap your empty cylinder for a full one. You only pay for the gas, not a new cylinder, making exchange more affordable than buying a new bottle. Order online and we deliver to your door." },
    { question: "How long does a 9kg gas cylinder last?", answer: "For a household using gas for cooking only, a 9kg cylinder typically lasts 4–6 weeks. A gas heater uses significantly more gas and may require a 19kg cylinder for equivalent duration." },
    { question: "What is the delivery fee and area?", answer: "We charge a flat R50 delivery fee within the Pretoria delivery area. Orders placed before 12:00 qualify for same-day delivery, Monday to Saturday." },
  ],
};

export async function getMetaForPath(path: string): Promise<SEOMeta> {
  const cleanPath = path.split('?')[0];
  
  // Product pages: /products/:slug
  const productMatch = cleanPath.match(/^\/products\/([^\/]+)$/);
  if (productMatch) {
    const slug = productMatch[1];
    try {
      const product = await storage.getProductBySlug(slug);
      if (product) {
        const cleanDesc = stripHtml(product.description);
        const title = buildSeoTitle(product.name, product.brand || "Security Products");
        const description = truncateDescription(cleanDesc);
        const imageUrl = product.imageUrl.startsWith('http') 
          ? product.imageUrl 
          : `${BASE_URL}/${product.imageUrl}`;
        
        const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const structuredData = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": cleanDesc.substring(0, 500),
          "brand": { "@type": "Brand", "name": product.brand },
          "image": imageUrl,
          "sku": product.sku || product.id,
          "mpn": product.sku || product.id,
          "url": `${BASE_URL}/products/${slug}`,
          "offers": {
            "@type": "Offer",
            "price": parseFloat(product.price).toFixed(2),
            "priceCurrency": "ZAR",
            "priceValidUntil": priceValidUntil,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "url": `${BASE_URL}/products/${slug}`,
            "seller": { "@type": "Organization", "name": SITE_NAME, "url": BASE_URL }
          }
        });

        return {
          title,
          description,
          canonical: `${BASE_URL}/products/${slug}`,
          ogTitle: title,
          ogDescription: description,
          ogUrl: `${BASE_URL}/products/${slug}`,
          ogImage: imageUrl,
          ogType: "product",
          twitterTitle: title,
          twitterDescription: description,
          twitterImage: imageUrl,
          structuredData
        };
      }
    } catch (e) {
      console.error("Error fetching product for SEO:", e);
    }
  }

  // Category pages: /collections/:slug
  const categoryMatch = cleanPath.match(/^\/collections\/([^\/]+)$/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    
    if (slug === 'all') {
      const title = `Security & Automation Products South Africa | ${SITE_NAME}`;
      const description = "Browse 280+ security and automation products. Gate motors, CCTV systems, electric fencing, intercoms, remotes, batteries, garage motors. Free delivery over R2,500.";
      let structuredData: string | undefined;
      try {
        const allProducts = await storage.getAllProducts();
        structuredData = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Security & Automation Products",
          "description": description,
          "url": `${BASE_URL}/collections/all`,
          "numberOfItems": allProducts.length,
          "itemListElement": allProducts.filter(p => !p.discontinued).slice(0, 100).map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `${BASE_URL}/products/${p.slug}`,
            "name": p.name,
          })),
        });
      } catch {}
      return {
        title,
        description,
        canonical: `${BASE_URL}/collections/all`,
        ogTitle: title,
        ogDescription: description,
        ogUrl: `${BASE_URL}/collections/all`,
        ogImage: DEFAULT_IMAGE,
        ogType: "website",
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: DEFAULT_IMAGE,
        structuredData,
      };
    }

    try {
      const category = await storage.getCategoryBySlug(slug);
      if (category) {
        const title = truncateDescription(`Shop ${category.name} | ${SITE_NAME}`, 60);
        const description = truncateDescription(category.description || `Shop our range of ${category.name.toLowerCase()} products. Quality security and automation solutions from trusted South African brands.`);
        const imageUrl = category.imageUrl?.startsWith('http') 
          ? category.imageUrl 
          : category.imageUrl 
            ? `${BASE_URL}/${category.imageUrl}`
            : DEFAULT_IMAGE;

        const products = await storage.getProductsByCategorySlug(slug);
        const itemListSchema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": `${category.name} Products`,
          "description": description,
          "url": `${BASE_URL}/collections/${slug}`,
          "numberOfItems": products.length,
          "itemListElement": products.slice(0, 100).map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": `${BASE_URL}/products/${p.slug}`,
            "name": p.name,
          })),
        };

        const categoryFaqs = CATEGORY_FAQS[slug];
        let structuredData: string;
        if (categoryFaqs && categoryFaqs.length > 0) {
          const { "@context": _ctx, ...itemListBody } = itemListSchema as any;
          structuredData = JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              itemListBody,
              {
                "@type": "FAQPage",
                "mainEntity": categoryFaqs.map(faq => ({
                  "@type": "Question",
                  "name": faq.question,
                  "acceptedAnswer": { "@type": "Answer", "text": faq.answer },
                })),
              },
            ],
          });
        } else {
          structuredData = JSON.stringify(itemListSchema);
        }

        return {
          title,
          description,
          canonical: `${BASE_URL}/collections/${slug}`,
          ogTitle: title,
          ogDescription: description,
          ogUrl: `${BASE_URL}/collections/${slug}`,
          ogImage: imageUrl,
          ogType: "website",
          twitterTitle: title,
          twitterDescription: description,
          twitterImage: imageUrl,
          structuredData,
        };
      }
    } catch (e) {
      console.error("Error fetching category for SEO:", e);
    }
  }

  // Gas blog pages: /blogs/gas/:slug
  const gasBlogMatch = cleanPath.match(/^\/blogs\/gas\/(.+)$/);
  if (gasBlogMatch) {
    const slug = decodeURIComponent(gasBlogMatch[1]);
    try {
      const post = await storage.getBlogPostBySlug(slug);
      if (post) {
        const cleanContent = stripHtml(post.content);
        const title = `${post.title} | ${SITE_NAME}`;
        const description = truncateDescription(post.metaDescription || post.excerpt || cleanContent);
        const imageUrl = post.imageUrl.startsWith('http') ? post.imageUrl : `${BASE_URL}${post.imageUrl}`;
        const structuredData = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "description": description,
          "datePublished": post.publishedAt,
          "dateModified": post.updatedAt || post.publishedAt,
          "author": { "@type": "Organization", "name": SITE_NAME, "url": BASE_URL },
          "publisher": { "@type": "Organization", "name": SITE_NAME, "url": BASE_URL, "logo": { "@type": "ImageObject", "url": DEFAULT_IMAGE } },
          "image": imageUrl,
          "mainEntityOfPage": { "@type": "WebPage", "@id": `${BASE_URL}/blogs/gas/${encodeURIComponent(slug)}` },
          "url": `${BASE_URL}/blogs/gas/${encodeURIComponent(slug)}`
        });
        return {
          title,
          description,
          canonical: `${BASE_URL}/blogs/gas/${encodeURIComponent(slug)}`,
          ogTitle: title,
          ogDescription: description,
          ogUrl: `${BASE_URL}/blogs/gas/${encodeURIComponent(slug)}`,
          ogImage: imageUrl,
          ogType: "article",
          twitterTitle: title,
          twitterDescription: description,
          twitterImage: imageUrl,
          structuredData
        };
      }
    } catch (e) {
      console.error("Error fetching gas blog post for SEO:", e);
    }
  }

  // Blog pages: /blogs/about-alectra-solutions/:slug
  const blogMatch = cleanPath.match(/^\/blogs\/about-alectra-solutions\/(.+)$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    try {
      const post = await storage.getBlogPostBySlug(slug);
      if (post) {
        const cleanContent = stripHtml(post.content);
        const title = `${post.title} | ${SITE_NAME} Blog`;
        const description = truncateDescription(post.excerpt || cleanContent);

        const structuredData = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": description,
          "author": { "@type": "Organization", "name": SITE_NAME },
          "publisher": { "@type": "Organization", "name": SITE_NAME },
          "url": `${BASE_URL}/blogs/about-alectra-solutions/${encodeURIComponent(slug)}`
        });

        return {
          title,
          description,
          canonical: `${BASE_URL}/blogs/about-alectra-solutions/${encodeURIComponent(slug)}`,
          ogTitle: title,
          ogDescription: description,
          ogUrl: `${BASE_URL}/blogs/about-alectra-solutions/${encodeURIComponent(slug)}`,
          ogImage: DEFAULT_IMAGE,
          ogType: "article",
          twitterTitle: title,
          twitterDescription: description,
          twitterImage: DEFAULT_IMAGE,
          structuredData
        };
      }
    } catch (e) {
      console.error("Error fetching blog post for SEO:", e);
    }
  }

  // Blog index
  if (cleanPath === '/blogs') {
    const title = `Security & Automation Blog | ${SITE_NAME}`;
    const description = "Expert guides, tips, and news about gate motors, electric fencing, CCTV systems, and home security. Learn from South Africa's trusted security specialists.";
    return {
      title,
      description,
      canonical: `${BASE_URL}/blogs`,
      ogTitle: title,
      ogDescription: description,
      ogUrl: `${BASE_URL}/blogs`,
      ogImage: DEFAULT_IMAGE,
      ogType: "website",
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_IMAGE
    };
  }

  // Homepage — WebSite + SearchAction schema for sitelinks search box
  if (cleanPath === '/') {
    const title = `${SITE_NAME} - Security & Automation Products South Africa`;
    const structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": BASE_URL,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${BASE_URL}/collections/all?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    });
    return {
      title,
      description: DEFAULT_DESCRIPTION,
      canonical: BASE_URL,
      ogTitle: title,
      ogDescription: DEFAULT_DESCRIPTION,
      ogUrl: BASE_URL,
      ogImage: DEFAULT_IMAGE,
      ogType: "website",
      twitterTitle: title,
      twitterDescription: DEFAULT_DESCRIPTION,
      twitterImage: DEFAULT_IMAGE,
      structuredData,
    };
  }

  // Static pages
  const staticPages: Record<string, { title: string; description: string }> = {
    '/contact': {
      title: `Contact Us | ${SITE_NAME}`,
      description: "Get in touch with Alectra Solutions for gate motors, electric fencing, CCTV systems, and security products. Based in Pretoria, delivering nationwide."
    },
    '/cart': {
      title: `Shopping Cart | ${SITE_NAME}`,
      description: "Review your cart and checkout. Free delivery on orders over R2500. Secure payment with Paystack and Yoco."
    },
    '/checkout': {
      title: `Checkout | ${SITE_NAME}`,
      description: "Complete your order securely. Multiple payment options available. Fast delivery across South Africa."
    },
    '/trade-account': {
      title: `Trade Account - 15% Discount for Installers | ${SITE_NAME}`,
      description: "Professional installers get 15% trade discount on all products. Register for a trade account and save on gate motors, electric fencing, and more."
    },
    '/login': {
      title: `Login | ${SITE_NAME}`,
      description: "Sign in to your Alectra Solutions account to track orders and access trade pricing."
    },
    '/register': {
      title: `Create Account | ${SITE_NAME}`,
      description: "Create an account to track orders, save favorites, and access exclusive deals on security products."
    }
  };

  const staticPage = staticPages[cleanPath];
  if (staticPage) {
    return {
      title: staticPage.title,
      description: staticPage.description,
      canonical: `${BASE_URL}${cleanPath === '/' ? '' : cleanPath}`,
      ogTitle: staticPage.title,
      ogDescription: staticPage.description,
      ogUrl: `${BASE_URL}${cleanPath === '/' ? '' : cleanPath}`,
      ogImage: DEFAULT_IMAGE,
      ogType: "website",
      twitterTitle: staticPage.title,
      twitterDescription: staticPage.description,
      twitterImage: DEFAULT_IMAGE
    };
  }

  // Default fallback
  return {
    title: `${SITE_NAME} - Security & Automation Products South Africa`,
    description: DEFAULT_DESCRIPTION,
    canonical: `${BASE_URL}${cleanPath}`,
    ogTitle: `${SITE_NAME} - Security & Automation Products South Africa`,
    ogDescription: DEFAULT_DESCRIPTION,
    ogUrl: `${BASE_URL}${cleanPath}`,
    ogImage: DEFAULT_IMAGE,
    ogType: "website",
    twitterTitle: `${SITE_NAME} - Security & Automation Products South Africa`,
    twitterDescription: DEFAULT_DESCRIPTION,
    twitterImage: DEFAULT_IMAGE
  };
}

export function injectMetaTags(html: string, meta: SEOMeta): string {
  // Replace title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${meta.title}</title>`
  );

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${meta.description}">`
  );

  // Replace or add canonical link
  const canonicalTag = `<link rel="canonical" href="${meta.canonical}">`;
  if (html.includes('rel="canonical"')) {
    // Replace existing canonical
    html = html.replace(
      /<link rel="canonical" href="[^"]*">/,
      canonicalTag
    );
  } else {
    // Add canonical after description
    html = html.replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${meta.description}">\n    ${canonicalTag}`
    );
  }

  // Replace Open Graph tags
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${meta.ogTitle}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${meta.ogDescription}">`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${meta.ogUrl}">`
  );
  html = html.replace(
    /<meta property="og:type" content="[^"]*">/,
    `<meta property="og:type" content="${meta.ogType}">`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${meta.ogImage}">`
  );

  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${meta.twitterTitle}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${meta.twitterDescription}">`
  );
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${meta.twitterImage}">`
  );

  // Add product/article structured data if available
  if (meta.structuredData) {
    const structuredDataScript = `<script type="application/ld+json">${meta.structuredData}</script>`;
    // Insert before </head>
    html = html.replace('</head>', `${structuredDataScript}\n  </head>`);
  }

  return html;
}

// Generate hidden product links for category pages (SEO internal linking)
export async function getProductLinksForCategory(path: string): Promise<string> {
  const cleanPath = path.split('?')[0];
  
  // Check if this is a category page
  const categoryMatch = cleanPath.match(/^\/collections\/([^\/]+)$/);
  if (!categoryMatch) {
    return '';
  }
  
  const slug = categoryMatch[1];
  
  try {
    let products;
    
    if (slug === 'all') {
      // Get all products
      products = await storage.getAllProducts();
    } else {
      // Get products for this category
      products = await storage.getProductsByCategorySlug(slug);
    }
    
    if (!products || products.length === 0) {
      return '';
    }
    
    // Generate hidden nav with product links
    const productLinks = products.map(p => 
      `<a href="/products/${p.slug}">${p.name}</a>`
    ).join('\n      ');
    
    return `
    <!-- SEO Product Links for Crawlers -->
    <nav id="seo-product-nav" aria-label="Products" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">
      ${productLinks}
    </nav>`;
  } catch (e) {
    console.error('Error generating product links for SEO:', e);
    return '';
  }
}

// Inject product links into HTML
export function injectProductLinks(html: string, productLinksHtml: string): string {
  if (!productLinksHtml) {
    return html;
  }
  
  // Insert before </body>
  return html.replace('</body>', `${productLinksHtml}\n  </body>`);
}
