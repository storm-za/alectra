import { useState, useEffect } from "react";
import { loadAnalytics, getConsent, saveConsent } from "@/lib/cookieConsent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      setTimeout(() => {
        setVisible(true);
        setAnimating(true);
      }, 1200);
    } else if (existing === "accepted") {
      loadAnalytics();
    }
  }, []);

  const dismiss = (choice: "accepted" | "declined") => {
    saveConsent(choice);
    if (choice === "accepted") loadAnalytics();
    setAnimating(false);
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        transform: animating ? "translateY(0)" : "translateY(110%)",
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="dialog"
      aria-label="Cookie consent"
      data-testid="cookie-banner"
    >
      <div
        style={{
          background: "rgba(15, 23, 42, 0.97)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
          <AnimatedCookieLock />
          <div style={{ minWidth: 0 }}>
            <p style={{ color: "#f1f5f9", fontSize: "14px", fontWeight: 600, margin: 0, marginBottom: "2px" }}>
              We use cookies to improve your experience
            </p>
            <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0, lineHeight: 1.4 }}>
              Analytics cookies help us understand how you use our site.{" "}
              <a href="/privacy" style={{ color: "#60a5fa", textDecoration: "underline" }}>
                Cookie policy
              </a>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <button
            onClick={() => dismiss("declined")}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#94a3b8",
              padding: "7px 16px",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 500,
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.35)";
              (e.target as HTMLButtonElement).style.color = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
              (e.target as HTMLButtonElement).style.color = "#94a3b8";
            }}
            data-testid="button-cookie-decline"
          >
            Decline
          </button>
          <button
            onClick={() => dismiss("accepted")}
            style={{
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              border: "none",
              color: "#ffffff",
              padding: "7px 20px",
              borderRadius: "6px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 1px 3px rgba(37,99,235,0.4)",
              transition: "filter 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.filter = "brightness(1)";
            }}
            data-testid="button-cookie-accept"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

function AnimatedCookieLock() {
  return (
    <div style={{ position: "relative", width: "44px", height: "44px", flexShrink: 0 }}>
      <style>{`
        @keyframes cookieBob {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes lockPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.12); opacity: 0.85; }
        }
      `}</style>

      <svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        style={{
          animation: "cookieBob 2.8s ease-in-out infinite",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="15" fill="#b45309" />
        <circle cx="18" cy="18" r="13.5" fill="#d97706" />
        <circle cx="18" cy="18" r="13" fill="#f59e0b" />
        <path d="M 26 8 Q 31 5 31 18 Q 22 14 26 8 Z" fill="#b45309" opacity="0.4" />
        <circle cx="12" cy="14" r="2" fill="#92400e" />
        <circle cx="22" cy="12" r="1.5" fill="#92400e" />
        <circle cx="24" cy="22" r="2" fill="#92400e" />
        <circle cx="14" cy="22" r="1.2" fill="#92400e" />
        <circle cx="18" cy="17" r="1.5" fill="#92400e" />
        <circle cx="19" cy="26" r="1.2" fill="#92400e" />
        <circle cx="9" cy="20" r="1" fill="#92400e" />
        <path
          d="M 5 18 A 13 13 0 0 0 16 30.8"
          stroke="#fbbf24"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
          strokeLinecap="round"
        />
      </svg>

      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        style={{
          animation: "lockPulse 2s ease-in-out infinite",
          position: "absolute",
          bottom: 0,
          right: 0,
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))",
        }}
        aria-hidden="true"
      >
        <rect x="3" y="9" width="14" height="9" rx="2.5" fill="#22c55e" />
        <rect x="5.5" y="11" width="9" height="5" rx="1.5" fill="#16a34a" />
        <path
          d="M 7 9 L 7 6.5 A 3 3 0 0 1 13 6.5 L 13 9"
          stroke="#22c55e"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="10" cy="13.5" r="1.5" fill="#bbf7d0" />
        <rect x="9.3" y="13.5" width="1.4" height="2" rx="0.7" fill="#bbf7d0" />
      </svg>
    </div>
  );
}
