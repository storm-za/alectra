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
        const title = `${product.name} - ${product.brand} | ${SITE_NAME}`;
        const description = truncateDescription(cleanDesc);
        const imageUrl = product.imageUrl.startsWith('http') 
          ? product.imageUrl 
          : `${BASE_URL}/${product.imageUrl}`;
        
        const structuredData = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": cleanDesc.substring(0, 500),
          "brand": { "@type": "Brand", "name": product.brand },
          "image": imageUrl,
          "url": `${BASE_URL}/products/${slug}`,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "ZAR",
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": { "@type": "Organization", "name": SITE_NAME }
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
      const title = `All Security & Automation Products | ${SITE_NAME}`;
      const description = "Browse our complete range of security and automation products. Gate motors, CCTV systems, electric fencing, intercoms, remotes, batteries, and more.";
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
        twitterImage: DEFAULT_IMAGE
      };
    }

    try {
      const category = await storage.getCategoryBySlug(slug);
      if (category) {
        const title = `${category.name} - Security Products | ${SITE_NAME}`;
        const description = truncateDescription(category.description || `Shop our range of ${category.name.toLowerCase()} products. Quality security and automation solutions from trusted South African brands.`);
        const imageUrl = category.imageUrl?.startsWith('http') 
          ? category.imageUrl 
          : category.imageUrl 
            ? `${BASE_URL}/${category.imageUrl}`
            : DEFAULT_IMAGE;

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
          twitterImage: imageUrl
        };
      }
    } catch (e) {
      console.error("Error fetching category for SEO:", e);
    }
  }

  // Blog pages: /blog/:slug
  const blogMatch = cleanPath.match(/^\/blog\/(.+)$/);
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
          "url": `${BASE_URL}/blog/${encodeURIComponent(slug)}`
        });

        return {
          title,
          description,
          canonical: `${BASE_URL}/blog/${encodeURIComponent(slug)}`,
          ogTitle: title,
          ogDescription: description,
          ogUrl: `${BASE_URL}/blog/${encodeURIComponent(slug)}`,
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
  if (cleanPath === '/blog') {
    const title = `Security & Automation Blog | ${SITE_NAME}`;
    const description = "Expert guides, tips, and news about gate motors, electric fencing, CCTV systems, and home security. Learn from South Africa's trusted security specialists.";
    return {
      title,
      description,
      canonical: `${BASE_URL}/blog`,
      ogTitle: title,
      ogDescription: description,
      ogUrl: `${BASE_URL}/blog`,
      ogImage: DEFAULT_IMAGE,
      ogType: "website",
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: DEFAULT_IMAGE
    };
  }

  // Static pages
  const staticPages: Record<string, { title: string; description: string }> = {
    '/': {
      title: `${SITE_NAME} - Security & Automation Products South Africa`,
      description: DEFAULT_DESCRIPTION
    },
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
