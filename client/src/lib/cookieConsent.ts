const CONSENT_KEY = "alectra_cookie_consent";

export function loadAnalytics() {
  if (typeof window === "undefined") return;
  const w = window as any;
  if (w.__analyticsLoaded) return;
  w.__analyticsLoaded = true;

  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) { w.dataLayer.push(args); }
  w.gtag = gtag;
  gtag("js", new Date());
  gtag("config", "GT-T5P8RL35");

  const gaScript = document.createElement("script");
  gaScript.src = "https://www.googletagmanager.com/gtag/js?id=GT-T5P8RL35";
  gaScript.async = true;
  document.head.appendChild(gaScript);

  setTimeout(() => {
    (function (w: any, d: any, s: any, l: any, i: any) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const f = d.getElementsByTagName(s)[0];
      const j = d.createElement(s);
      const dl = l !== "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", "GTM-KR4XVC8L");
  }, 500);
}

export function getConsent(): "accepted" | "declined" | null {
  try {
    return localStorage.getItem(CONSENT_KEY) as "accepted" | "declined" | null;
  } catch {
    return null;
  }
}

export function resetConsent() {
  try {
    localStorage.removeItem(CONSENT_KEY);
  } catch {}
}

export function saveConsent(choice: "accepted" | "declined") {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {}
}
