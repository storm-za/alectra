import { useEffect } from "react";
import { useLocation } from "wouter";

const PRODUCTION_DOMAIN = "alectra.co.za";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  type?: "website" | "product" | "article";
  price?: string;
  currency?: string;
  availability?: "in stock" | "out of stock" | "preorder";
  structuredData?: object;
}

export function SEO({
  title,
  description,
  image = "/alectra-solutions-logo.png",
  type = "website",
  price,
  currency = "ZAR",
  availability,
  structuredData,
}: SEOProps) {
  const [location] = useLocation();
  const canonicalUrl = `https://${PRODUCTION_DOMAIN}${location}`;
  const siteName = "Alectra Solutions";
  
  // Normalize title format: remove existing site name variations and append with consistent separator
  const normalizeTitle = (rawTitle: string): string => {
    // Remove existing site name with various separators (e.g., "Page - Alectra Solutions" or "Page | Alectra Solutions")
    const cleanTitle = rawTitle
      .replace(/\s*[-|]\s*Alectra Solutions\s*$/i, '')
      .replace(/^Alectra Solutions\s*[-|]\s*/i, '')
      .trim();
    
    // Only skip suffix if the clean title IS the site name (homepage) or explicitly includes full site name
    const isHomepageOrBrandingTitle = cleanTitle.toLowerCase() === 'alectra solutions' || 
      cleanTitle.toLowerCase().includes('alectra solutions');
    
    return isHomepageOrBrandingTitle 
      ? cleanTitle
      : `${cleanTitle} | ${siteName}`;
  };
  
  const fullTitle = normalizeTitle(title);
  
  // Truncate description to 155 characters max for SEO compliance
  const truncatedDescription = description.length > 155 
    ? description.substring(0, 152) + "..."
    : description;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Standard meta tags
    updateMeta("description", truncatedDescription);

    // Open Graph tags
    updateMeta("og:title", fullTitle, true);
    updateMeta("og:description", truncatedDescription, true);
    updateMeta("og:type", type, true);
    updateMeta("og:url", canonicalUrl, true);
    updateMeta("og:site_name", siteName, true);
    updateMeta("og:image", image.startsWith("http") ? image : `https://${PRODUCTION_DOMAIN}${image}`, true);
    updateMeta("og:locale", "en_ZA", true);

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", fullTitle);
    updateMeta("twitter:description", truncatedDescription);
    updateMeta("twitter:image", image.startsWith("http") ? image : `https://${PRODUCTION_DOMAIN}${image}`);

    // Product-specific Open Graph tags
    if (type === "product" && price) {
      updateMeta("og:price:amount", price, true);
      updateMeta("og:price:currency", currency, true);
      if (availability) {
        updateMeta("product:availability", availability, true);
      }
    }

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // Add structured data if provided
    if (structuredData) {
      let script = document.getElementById("structured-data") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script") as HTMLScriptElement;
        script.id = "structured-data";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
  }, [fullTitle, truncatedDescription, image, type, price, currency, availability, canonicalUrl, structuredData]);

  return null;
}

// Helper function to create product structured data
export function createProductStructuredData(product: {
  name: string;
  description: string;
  image: string;
  price: string;
  sku: string;
  brand: string;
  availability: "in stock" | "out of stock";
  rating?: number;
  reviewCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image.startsWith("http") ? product.image : `https://${PRODUCTION_DOMAIN}${product.image}`,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: `https://${PRODUCTION_DOMAIN}${window.location.pathname}`,
      priceCurrency: "ZAR",
      price: product.price,
      availability: product.availability === "in stock" 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Alectra Solutions",
      },
    },
    ...(product.rating && product.reviewCount ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.toString(),
        reviewCount: product.reviewCount.toString(),
      },
    } : {}),
  };
}

// Organization structured data for the site
export function createOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Alectra Solutions",
    description: "Leading South African supplier of security and automation products including gate motors, electric fencing, CCTV systems, and more.",
    url: `https://${PRODUCTION_DOMAIN}`,
    logo: `https://${PRODUCTION_DOMAIN}/alectra-solutions-logo.png`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "ZA",
    },
    priceRange: "R50 - R15000",
    paymentAccepted: "Credit Card, Debit Card",
    currenciesAccepted: "ZAR",
  };
}
