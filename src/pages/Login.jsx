import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import logoImg from "../assets/logo.png";
import bgImg from "../assets/login-background.jpg";

const FONT = {
  ar: {
    headline: "'Manrope', 'Cairo', sans-serif",
    body: "'Cairo', 'Inter', sans-serif",
  },
  en: { headline: "'Manrope', sans-serif", body: "'Inter', sans-serif" },
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Login({ onLogin }) {
  const { t, lang, dir, toggleLang } = useLanguage();
  const font = FONT[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = t("err_email");
    if (!password || password.length < 6) errs.password = t("err_password");
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setLoading(false);

    const savedUsers = JSON.parse(
      localStorage.getItem("registered_users") || "[]",
    );
    const MOCK_USERS = [
      {
        email: "test@test.com",
        password: "12345678",
        fullname: "مستخدم تجريبي",
      },
      ...savedUsers,
    ];

    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user) {
      setErrors({ authError: "not_found" });
      return;
    }
    if (user.password !== password) {
      setErrors({ authError: "wrong_password" });
      return;
    }

    if (onLogin) onLogin({ email, password, fullname: user.fullname });
  }

  return (
    <div
      className="min-h-screen flex w-full bg-[#FFFFFF]"
      style={{ direction: dir, fontFamily: font.body }}
    >
      <div
        className={`flex w-full min-h-screen ${dir === "rtl" ? "lg:flex-row-reverse" : "lg:flex-row"} flex-col`}
      >
        {/* Branding Panel (60% Desktop) */}
        <div
          className="hidden lg:flex w-[60%] relative overflow-hidden flex-col items-center justify-center p-12 text-center"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(10, 25, 47, 0.92)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img
              src={logoImg}
              alt="Prosperity Logo"
              style={{
                width: 120,
                height: 120,
                objectFit: "contain",
                borderRadius: "50%",
                background: "#FFFFFF",
                marginBottom: 24,
              }}
            />
            <h1
              style={{
                fontFamily: font.headline,
                fontWeight: 800,
                fontSize: 24,
                color: "#FFFFFF",
                letterSpacing: -0.5,
                margin: "0 0 8px",
              }}
            >
              Prosperity
            </h1>
            <div
              style={{
                fontFamily: font.body,
                fontSize: 14,
                color: "#10B981",
                fontWeight: 600,
                marginBottom: 48,
              }}
            >
              {lang === "ar" ? "ذكاء الثروة" : "Wealth Intelligence"}
            </div>

            <div
              style={{
                width: 48,
                height: 4,
                background: "#10B981",
                borderRadius: 2,
                marginBottom: 28,
              }}
            />
            <h2
              style={{
                fontFamily: font.headline,
                fontSize: lang === "ar" ? 42 : 44,
                fontWeight: 800,
                color: "#FFFFFF",
                lineHeight: 1.2,
                letterSpacing: lang === "ar" ? -0.5 : -1.5,
                margin: "0 0 20px",
                maxWidth: 500,
              }}
            >
              {t("brand_headline")}
            </h2>
            <p
              style={{
                fontFamily: font.body,
                fontSize: 17,
                color: "#CBD5E1",
                lineHeight: 1.8,
                maxWidth: 420,
                margin: 0,
              }}
            >
              {t("brand_sub")}
            </p>
          </div>
        </div>

        {/* Form Panel (40% Desktop, 100% Mobile) */}
        <div className="flex-1 w-full lg:w-[40%] flex items-center justify-center p-6 lg:p-12 relative bg-white">
          <div className="w-full max-w-[450px] flex flex-col justify-center relative min-h-[500px]">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLang}
              title="تبديل اللغة / Switch language"
              style={{
                position: "absolute",
                top: -10,
                [dir === "rtl" ? "left" : "right"]: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 20,
                cursor: "pointer",
                fontFamily: font.body,
                fontSize: 12,
                fontWeight: 600,
                color: "#0A192F",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#10B981";
                e.currentTarget.style.color = "#10B981";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.color = "#0A192F";
              }}
            >
              <Globe size={13} />
              {t("switch_lang")}
            </button>

            {/* Logo (Mobile top center) */}
            <div className="flex lg:hidden flex-col items-center justify-center mb-8">
              <img
                src={logoImg}
                alt="Prosperity Logo"
                style={{
                  width: 70,
                  height: 70,
                  objectFit: "contain",
                  borderRadius: "50%",
                  background: "#FFFFFF",
                  marginBottom: 12,
                  border: "1px solid #E2E8F0",
                }}
              />
              <h1
                style={{
                  fontFamily: font.headline,
                  fontWeight: 800,
                  fontSize: 18,
                  color: "#0A192F",
                  letterSpacing: -0.5,
                  margin: 0,
                }}
              >
                PROSPERITY
              </h1>
            </div>

            {/* Form Header */}
            <div style={{ marginBottom: 32, textAlign: "center" }}>
              <h1
                style={{
                  fontFamily: font.headline,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0A192F",
                  margin: "0 0 8px",
                  letterSpacing: -0.5,
                }}
              >
                {t("login_title")}
              </h1>
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  color: "#64748B",
                  margin: 0,
                }}
              >
                {t("login_subtitle")}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontFamily: font.body,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0A192F",
                  }}
                >
                  {t("email_label")}
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  placeholder={t("email_placeholder")}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 14,
                    color: "#0A192F",
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    outline: "none",
                    transition: "all 0.2s",
                    direction: "ltr",
                    textAlign: dir === "rtl" ? "right" : "left",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#10B981";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email
                      ? "#EF4444"
                      : "#E2E8F0";
                  }}
                  className="mobile-clean-input"
                />
                {errors.email && (
                  <span style={{ fontSize: 12, color: "#EF4444" }}>
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    fontFamily: font.body,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0A192F",
                  }}
                >
                  {t("password_label")}
                </label>
                <div style={{ position: "relative", width: "100%" }}>
                  <input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: "" }));
                    }}
                    placeholder={t("password_placeholder")}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      boxSizing: "border-box",
                      fontSize: 14,
                      color: "#0A192F",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      outline: "none",
                      transition: "all 0.2s",
                      direction: "ltr",
                      textAlign: dir === "rtl" ? "right" : "left",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#10B981";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.password
                        ? "#EF4444"
                        : "#E2E8F0";
                    }}
                    className="mobile-clean-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute",
                      top: "50%",
                      transform: "translateY(-50%)",
                      [dir === "rtl" ? "left" : "right"]: 16,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94A3B8",
                      padding: 0,
                    }}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span style={{ fontSize: 12, color: "#EF4444" }}>
                    {errors.password}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: "14px",
                  background: "#10B981",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: font.body,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.8 : 1,
                  transition: "all 0.2s",
                  width: "100%",
                }}
              >
                {loading ? "..." : t("login_btn")}
              </button>

              {/* Google Button */}
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  padding: "12px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0A192F",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontFamily: font.body,
                  width: "100%",
                }}
              >
                <GoogleIcon />
                {t("google_btn")}
              </button>
            </form>

            {/* Sign Up Link */}
            <p
              style={{
                marginTop: 32,
                textAlign: "center",
                fontFamily: font.body,
                fontSize: 14,
                color: "#64748B",
              }}
            >
              {t("no_account")}{" "}
              <Link
                to="/register"
                style={{
                  color: "#0A192F",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {t("signup_link")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
