import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, TrendingUp, Users } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663397240618/oDZY4ar9m3XQtQ6MXywepz/empower-logo_1a7a46aa.png";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === "admin") {
      navigate("/admin");
    }
  }, [loading, isAuthenticated, user?.role]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a", color: "#f0f0f0" }}>

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Empower" className="h-8 w-8 object-contain" />
            <span
              className="font-black text-white uppercase"
              style={{ letterSpacing: "0.18em", fontSize: "1.05rem" }}
            >
              EMPOWER
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/client-login")}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              Client Login
            </button>
            <button
              onClick={() => navigate("/team-login")}
              className="text-sm font-bold px-5 py-2 rounded-lg transition-all"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #d0d0d0 100%)",
                color: "#0a0a0a",
                letterSpacing: "0.04em",
              }}
            >
              Admin Login
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section
        className="relative flex-1 flex items-center overflow-hidden"
        style={{ minHeight: "88vh" }}
      >
        {/* Metallic gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, #111111 0%, #1a1a1a 40%, #0d0d0d 70%, #080808 100%)",
          }}
        />

        {/* Oversized logo watermark */}
        <div
          className="absolute inset-0 flex items-center justify-end pointer-events-none"
          style={{ overflow: "hidden" }}
        >
          <img
            src={LOGO_URL}
            alt=""
            aria-hidden="true"
            style={{
              width: "min(72vw, 700px)",
              height: "min(72vw, 700px)",
              objectFit: "contain",
              opacity: 0.06,
              filter: "grayscale(100%) brightness(3)",
              transform: "translateX(15%) translateY(5%)",
              userSelect: "none",
            }}
          />
        </div>

        {/* Metallic sheen lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(105deg, transparent 0px, transparent 80px, rgba(255,255,255,0.012) 80px, rgba(255,255,255,0.012) 81px)",
          }}
        />

        {/* Subtle radial highlight top-left */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-20%",
            left: "-10%",
            width: "60%",
            height: "60%",
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 70%)",
          }}
        />

        {/* Hero content */}
        <div className="container relative z-10 py-24 md:py-32">
          <div className="max-w-2xl">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-10 uppercase tracking-widest"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              <Shield className="w-3 h-3" />
              Secure Client Portal
            </div>

            {/* Headline */}
            <h1
              className="font-black leading-none mb-6 uppercase"
              style={{
                fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                letterSpacing: "-0.02em",
                color: "transparent",
                background:
                  "linear-gradient(160deg, #ffffff 0%, #c8c8c8 40%, #888888 80%, #555555 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Funding<br />Journey,<br />
              <span
                style={{
                  background:
                    "linear-gradient(160deg, #e0e0e0 0%, #a0a0a0 50%, #606060 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Tracked &amp; Transparent
              </span>
            </h1>

            {/* Subtext */}
            <p
              className="text-lg mb-12 leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)", maxWidth: "480px" }}
            >
              Access your personalized funding profile, monitor your application status,
              and stay informed at every stage — all in one secure place.
            </p>


          </div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, #0a0a0a)",
          }}
        />
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24" style={{ background: "#0a0a0a" }}>
        <div className="container">
          <div className="text-center mb-16">
            <h2
              className="font-black uppercase mb-4"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                letterSpacing: "0.06em",
                color: "transparent",
                background: "linear-gradient(135deg, #ffffff 0%, #888888 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Everything You Need
            </h2>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "1.05rem" }}>
              A comprehensive platform designed for both clients and funding advisors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Secure Access",
                desc: "Each client has a private, password-protected portal. Your data is visible only to you and your advisor.",
              },
              {
                icon: TrendingUp,
                title: "Real-Time Status",
                desc: "Track your application from submission through approval and funding with live status updates.",
              },
              {
                icon: Users,
                title: "Complete Profile",
                desc: "View all your financial data, FICO score, business metrics, and funding details in one organized dashboard.",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="p-8 rounded-2xl transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.18)";
                  (e.currentTarget as HTMLDivElement).style.background =
                    "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.background =
                    "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)";
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: "rgba(255,255,255,0.8)" }} />
                </div>
                <h3
                  className="font-bold mb-3 uppercase"
                  style={{
                    color: "#ffffff",
                    letterSpacing: "0.06em",
                    fontSize: "0.95rem",
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: "1.7", fontSize: "0.9rem" }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FOOTER ── */}
      <footer
        className="py-8"
        style={{
          background: "#080808",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Empower" className="h-5 w-5 object-contain" />
            <span
              className="font-black uppercase text-white"
              style={{ letterSpacing: "0.18em", fontSize: "0.8rem" }}
            >
              EMPOWER
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.82rem" }}>
            Secure client funding management platform
          </p>
          <button
            onClick={() => { window.location.href = getLoginUrl(); }}
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "0.68rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px 6px",
              letterSpacing: "0.08em",
              opacity: 0.5,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
            title="Owner access"
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
          >
            🔒
          </button>
        </div>
      </footer>
    </div>
  );
}
