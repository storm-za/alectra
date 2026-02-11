import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

declare global {
  interface Window {
    __SSR_PRODUCT__?: any;
    __SSR_REVIEW_DATA__?: { average: number; count: number } | null;
  }
}

if (window.__SSR_PRODUCT__) {
  const product = window.__SSR_PRODUCT__;
  queryClient.setQueryData(["/api/products", product.slug], product);
}

const rootEl = document.getElementById("root")!;
const ssrContent = document.getElementById("ssr-product-content");
if (ssrContent) {
  ssrContent.remove();
}

createRoot(rootEl).render(<App />);
