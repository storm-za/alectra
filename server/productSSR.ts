import { storage } from "./storage";
import type { Product } from "@shared/schema";

const BASE_URL = "https://alectra.co.za";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function getImageUrl(imageUrl: string): string {
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${BASE_URL}/${imageUrl.replace(/^\//, "")}`;
}

function formatPrice(price: string): string {
  return `R\u00A0${parseFloat(price).toFixed(2)}`;
}

function buildProductHtml(product: Product): string {
  const cleanDesc = stripHtml(product.description);
  const truncatedDesc = cleanDesc.length > 300 ? cleanDesc.substring(0, 297) + "..." : cleanDesc;
  const imageUrl = getImageUrl(product.imageUrl);
  const galleryImages = product.imageGallery || [];
  const inStock = product.stock > 0;

  return `
    <div id="ssr-product-content" style="max-width:800px;margin:0 auto;padding:16px;font-family:'Inter',system-ui,sans-serif;">
      <nav style="font-size:14px;color:#666;margin-bottom:16px;">
        <a href="/" style="color:#666;text-decoration:none;">Home</a> &rsaquo;
        <a href="/collections/all" style="color:#666;text-decoration:none;">Products</a> &rsaquo;
        <span>${escapeHtml(product.name)}</span>
      </nav>
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div style="flex:1;min-width:280px;max-width:400px;">
          <img 
            src="/img/${product.imageUrl.replace(/^\//, "")}?w=600&q=80" 
            alt="${escapeHtml(product.name)}" 
            width="600" 
            height="600" 
            style="width:100%;height:auto;border-radius:8px;background:#f5f5f5;" 
            loading="eager"
            fetchpriority="high"
          />
          ${galleryImages.length > 0 ? `
          <div style="display:flex;gap:8px;margin-top:8px;overflow-x:auto;">
            ${galleryImages.slice(0, 4).map(img => `
              <img src="/img/${img.replace(/^\//, "")}?w=100&q=60" alt="${escapeHtml(product.name)}" width="80" height="80" style="width:80px;height:80px;object-fit:cover;border-radius:4px;background:#f5f5f5;" loading="lazy" />
            `).join("")}
          </div>` : ""}
        </div>
        <div style="flex:1;min-width:280px;">
          ${product.brand ? `<p style="font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;">${escapeHtml(product.brand)}</p>` : ""}
          <h1 style="font-size:24px;font-weight:700;margin:0 0 12px;line-height:1.3;">${escapeHtml(product.name)}</h1>
          <p style="font-size:28px;font-weight:700;color:#222;margin:0 0 16px;white-space:nowrap;">${formatPrice(product.price)}</p>
          <p style="font-size:14px;color:${inStock ? "#16a34a" : "#dc2626"};font-weight:600;margin:0 0 16px;">
            ${inStock ? "In Stock" : "Out of Stock"}
          </p>
          ${product.sku ? `<p style="font-size:12px;color:#999;margin:0 0 16px;">SKU: ${escapeHtml(product.sku)}</p>` : ""}
          <div style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
            <p>${escapeHtml(truncatedDesc)}</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#666;padding:4px 8px;background:#f0f0f0;border-radius:4px;">Free delivery over R2,500</span>
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#666;padding:4px 8px;background:#f0f0f0;border-radius:4px;">Secure checkout</span>
          </div>
        </div>
      </div>
    </div>`;
}

function buildProductJsonLd(product: Product, reviewData?: { average: number; count: number }): string {
  const imageUrl = getImageUrl(product.imageUrl);
  const data: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: stripHtml(product.description).substring(0, 500),
    image: imageUrl,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: product.brand || "Alectra Solutions" },
    url: `${BASE_URL}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "ZAR",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Alectra Solutions" },
      url: `${BASE_URL}/products/${product.slug}`,
    },
  };

  if (reviewData && reviewData.count > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewData.average.toFixed(1),
      reviewCount: reviewData.count.toString(),
    };
  }

  return JSON.stringify(data);
}

export async function renderProductSSR(slug: string, templateHtml: string): Promise<string | null> {
  try {
    const product = await storage.getProductBySlug(slug);
    if (!product) return null;

    let reviewData: { average: number; count: number } | undefined;
    try {
      const averageRating = await storage.getAverageRating(product.id);
      const reviews = await storage.getProductReviews(product.id);
      const approvedCount = reviews.filter(r => r.status === "approved").length;
      if (approvedCount > 0) {
        reviewData = { average: averageRating, count: approvedCount };
      }
    } catch {}

    const cleanDesc = stripHtml(product.description);
    const title = `${product.name} - ${product.brand || "Security Products"} | Alectra Solutions`;
    const description = cleanDesc.length > 155 ? cleanDesc.substring(0, 152) + "..." : cleanDesc;
    const imageUrl = getImageUrl(product.imageUrl);
    const canonical = `${BASE_URL}/products/${slug}`;

    let html = templateHtml;

    html = html.replace(/<!-- Preload LCP hero images[^>]*>[\s\S]*?<link rel="preload"[^>]*hero-background-mobile[^>]*>/m, '');
    html = html.replace(/<link rel="preload"[^>]*hero-background-desktop[^>]*>\s*/g, '');
    html = html.replace(/<link rel="preload"[^>]*hero-background-mobile[^>]*>\s*/g, '');

    const optimizedImgPath = `/img/${product.imageUrl.replace(/^\//, "")}?w=600&q=80`;
    html = html.replace(
      /<link rel="preload" href="https:\/\/fonts\.gstatic\.com/,
      `<link rel="preload" href="${optimizedImgPath}" as="image" fetchpriority="high">\n    <link rel="preload" href="https://fonts.gstatic.com`
    );

    html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(description)}">`);
    html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${canonical}">`);
    html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${escapeHtml(title)}">`);
    html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${escapeHtml(description)}">`);
    html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${canonical}">`);
    html = html.replace(/<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="product">`);
    html = html.replace(/<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${imageUrl}">`);
    html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${escapeHtml(title)}">`);
    html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${escapeHtml(description)}">`);
    html = html.replace(/<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${imageUrl}">`);

    const productJsonLd = buildProductJsonLd(product, reviewData);
    html = html.replace("</head>", `<script type="application/ld+json">${productJsonLd}</script>\n  </head>`);

    const ssrProductContent = buildProductHtml(product);
    const ssrDataScript = `<script>window.__SSR_PRODUCT__=${JSON.stringify(product).replace(/</g, "\\u003c")};window.__SSR_REVIEW_DATA__=${JSON.stringify(reviewData || null)};</script>`;

    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${ssrProductContent}</div>\n    ${ssrDataScript}`
    );

    return html;
  } catch (error) {
    console.error("Product SSR error:", error);
    return null;
  }
}
