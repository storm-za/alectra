import { useEffect } from "react";
import { useLocation } from "wouter";

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
  const canonicalUrl = `https://${window.location.hostname}${location}`;
  const siteName = "Alectra Solutions";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

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
    updateMeta("description", description);

    // Open Graph tags
    updateMeta("og:title", fullTitle, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", type, true);
    updateMeta("og:url", canonicalUrl, true);
    updateMeta("og:site_name", siteName, true);
    updateMeta("og:image", image.startsWith("http") ? image : `https://${window.location.hostname}${image}`, true);
    updateMeta("og:locale", "en_ZA", true);

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", fullTitle);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", image.startsWith("http") ? image : `https://${window.location.hostname}${image}`);

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
  }, [fullTitle, description, image, type, price, currency, availability, canonicalUrl, structuredData]);

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
    image: product.image.startsWith("http") ? product.image : `https://${window.location.hostname}${product.image}`,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: window.location.href,
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
    url: `https://${window.location.hostname}`,
    logo: `https://${window.location.hostname}/alectra-solutions-logo.png`,
    address: {
      "@type": "PostalAddress",
      addressCountry: "ZA",
    },
    priceRange: "R50 - R15000",
    paymentAccepted: "Credit Card, Debit Card",
    currenciesAccepted: "ZAR",
  };
}
