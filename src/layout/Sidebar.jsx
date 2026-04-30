import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BrainCircuit,
  Target,
  HelpCircle,
  User,
  LogOut,
  Globe,
  X,
  ChevronUp,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { logoutUser, getCurrentUser } from "../services/authService";
import logoImg from "../assets/logo.png";

export default function Sidebar({ isOpen, onClose }) {
  const { t, lang, dir, toggleLang } = useLanguage();
  // جلب اسم المستخدم من authService بدلاً من localStorage مباشرة
  const userName = getCurrentUser() || (lang === "ar" ? "ضيف" : "Guest");
  const avatarLetter = userName.charAt(0).toUpperCase();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const NAV_ITEMS = [
    { to: "/dashboard", label: t("nav_dashboard"), icon: LayoutDashboard },
    { to: "/transactions", label: t("nav_transactions"), icon: ArrowLeftRight },
    { to: "/ai-insights", label: t("nav_ai"), icon: BrainCircuit },
    { to: "/goals", label: t("nav_goals"), icon: Target },
  ];

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 25, 47, 0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 40,
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar-container ${isOpen ? "open" : ""} ${dir}`}
        role="navigation"
        style={{
          width: 264,
          minWidth: 264,
          maxWidth: 264,
          height: "100vh",
          maxHeight: "100vh",
          background: "#FFFFFF",
          borderLeft: dir === "rtl" ? "1px solid #E2E8F0" : "none",
          borderRight: dir === "ltr" ? "1px solid #E2E8F0" : "none",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          zIndex: 50,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header (Logo) */}
        <div
          style={{
            padding: "32px 24px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              width: "100%",
              justifyContent: "flex-start",
            }}
          >
            <img
              src={logoImg}
              alt="Prosperity Logo"
              style={{
                width: 64,
                height: 64,
                objectFit: "cover",
                borderRadius: "50%",
                mixBlendMode: "multiply",
                flexShrink: 0,
              }}
            />
            <div style={{ textAlign: dir === "rtl" ? "right" : "left" }}>
              <div
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#0A192F",
                  letterSpacing: -0.5,
                  lineHeight: 1.2,
                }}
              >
                Prosperity
              </div>
              <div
                style={{
                  fontFamily: "'Cairo', 'Inter', sans-serif",
                  fontSize: 11,
                  color: "#64748B",
                  marginTop: 0,
                }}
              >
                {lang === "ar" ? "ذكاء الثروة" : "Wealth Intelligence"}
              </div>
            </div>
          </div>
          {/* Close button for mobile only */}
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              background: "none",
              border: "none",
              color: "#64748B",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: "0 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                borderRadius: 10,
                fontSize: 15,
                fontFamily: "'Manrope', 'Cairo', sans-serif",
                fontWeight: isActive ? 800 : 600,
                color: isActive ? "#10B981" : "#64748B",
                background: isActive ? "#ECFDF5" : "transparent",
                textDecoration: "none",
                position: "relative",
                transition: "all 0.2s",
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.style.background.includes("#ECFDF5")) {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.color = "#0A192F";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.style.background.includes("#ECFDF5")) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748B";
                }
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        bottom: 6,
                        width: 4,
                        background: "#10B981",
                        borderRadius: 4,
                        [dir === "rtl" ? "right" : "left"]: 0,
                      }}
                    />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Area */}
        <div
          style={{
            padding: "0 16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* User Menu Dropdown */}
          <div ref={menuRef} style={{ position: "relative", marginTop: 8 }}>
            {/* Pop-over Menu */}
            {userMenuOpen && (
              <div
                className="animate-fadeIn"
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "#FFFFFF",
                  borderRadius: 16,
                  boxShadow: "0 10px 40px rgba(10,25,47,0.1)",
                  border: "1px solid #E2E8F0",
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  zIndex: 60,
                }}
              >
                <NavLink
                  to="/help"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#64748B",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    fontFamily: "'Inter', 'Cairo', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F8FAFC";
                    e.currentTarget.style.color = "#0A192F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <HelpCircle size={16} />
                  <span>{t("help_center")}</span>
                </NavLink>

                <NavLink
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#64748B",
                    textDecoration: "none",
                    transition: "all 0.2s",
                    fontFamily: "'Inter', 'Cairo', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F8FAFC";
                    e.currentTarget.style.color = "#0A192F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <User size={16} />
                  <span>{t("profile_label")}</span>
                </NavLink>

                <button
                  onClick={() => {
                    toggleLang();
                    setUserMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#64748B",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Inter', 'Cairo', sans-serif",
                    width: "100%",
                    textAlign: dir === "rtl" ? "right" : "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F8FAFC";
                    e.currentTarget.style.color = "#0A192F";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#64748B";
                  }}
                >
                  <Globe size={16} />
                  <span>{lang === "ar" ? t("lang_en") : t("lang_ar")}</span>
                </button>

                <div
                  style={{ height: 1, background: "#E2E8F0", margin: "4px 0" }}
                />

                <button
                  onClick={() => {
                    setShowLogoutModal(true);
                    setUserMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#EF4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Inter', 'Cairo', sans-serif",
                    width: "100%",
                    textAlign: dir === "rtl" ? "right" : "left",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#FEF2F2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <LogOut size={16} />
                  <span>{t("sidebar_logout")}</span>
                </button>
              </div>
            )}

            {/* User Profile Button */}
            <button
              onClick={() => setUserMenuOpen((p) => !p)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px",
                background: userMenuOpen ? "#F8FAFC" : "transparent",
                border: "1px solid",
                borderColor: userMenuOpen ? "#E2E8F0" : "transparent",
                borderRadius: 14,
                width: "100%",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: dir === "rtl" ? "right" : "left",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!userMenuOpen) e.currentTarget.style.background = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                if (!userMenuOpen)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#10B981",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#FFF",
                }}
              >
                {avatarLetter}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#0A192F",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: "'Manrope', 'Cairo', sans-serif",
                  }}
                >
                  {userName}
                </div>
              </div>
              <ChevronUp
                size={16}
                color="#94A3B8"
                style={{
                  transition: "transform 0.2s",
                  transform: userMenuOpen ? "rotate(180deg)" : "none",
                }}
              />
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        /* Desktop */
        @media (min-width: 1024px) {
          .sidebar-container.rtl { right: 0; }
          .sidebar-container.ltr { left: 0; }
          .sidebar-close-btn { display: none !important; }
          .sidebar-backdrop { display: none !important; }
        }
        
        /* Mobile */
        @media (max-width: 1023px) {
          .sidebar-container.rtl { right: 0; transform: translateX(100%); }
          .sidebar-container.rtl.open { transform: translateX(0); }
          
          .sidebar-container.ltr { left: 0; transform: translateX(-100%); }
          .sidebar-container.ltr.open { transform: translateX(0); }
          
          .sidebar-close-btn { display: block !important; }
          .sidebar-backdrop { display: block !important; }
        }
      `}</style>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 25, 47, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            direction: dir,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              padding: 32,
              borderRadius: 16,
              width: 360,
              maxWidth: "90%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              textAlign: "center",
              fontFamily: "'Manrope', 'Cairo', sans-serif",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                color: "#0A192F",
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {t("logout_confirm_title")}
            </h3>
            <p
              style={{
                margin: "0 0 28px",
                color: "#64748B",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {t("logout_confirm_sub")}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "#F8FAFC",
                  color: "#64748B",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#F1F5F9";
                  e.currentTarget.style.borderColor = "#CBD5E1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#F8FAFC";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
              >
                {t("logout_cancel")}
              </button>
              <button
                onClick={logoutUser}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#DC2626";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#EF4444";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {t("sidebar_logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
