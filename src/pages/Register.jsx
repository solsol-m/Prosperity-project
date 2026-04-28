import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, Check, Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { registerUser } from "../services/authService";
import logoImg from "../assets/logo.png";
import bgImg from "../assets/login-background.jpg";

const FONT = {
  ar: {
    headline: "'Manrope', 'Cairo', sans-serif",
    body: "'Cairo', 'Inter', sans-serif",
  },
  en: { headline: "'Manrope', sans-serif", body: "'Inter', sans-serif" },
};

const PASSWORD_RULES = [
  { key: "min8",   test: (p) => p.length >= 8,          labelAr: "8 أحرف على الأقل",          labelEn: "At least 8 characters" },
  { key: "upper",  test: (p) => /[A-Z]/.test(p),        labelAr: "حرف إنجليزي كبير (A-Z)",     labelEn: "Uppercase letter (A-Z)" },
  { key: "lower",  test: (p) => /[a-z]/.test(p),        labelAr: "حرف إنجليزي صغير (a-z)",     labelEn: "Lowercase letter (a-z)" },
  { key: "digit",  test: (p) => /[0-9]/.test(p),        labelAr: "رقم واحد على الأقل (0-9)",   labelEn: "At least one number (0-9)" },
  { key: "symbol", test: (p) => /[^A-Za-z0-9]/.test(p), labelAr: "رمز خاص (!@#$…)",           labelEn: "Special character (!@#$…)" },
];

function getStrength(pwd) {
  if (!pwd) return 0;
  return PASSWORD_RULES.filter((r) => r.test(pwd)).length;
}

function PasswordRequirements({ password, font, lang }) {
  if (!password) return null;
  return (
    <div
      style={{
        marginTop: 10,
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <div
            key={rule.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: font.body,
              fontSize: 12,
              fontWeight: 600,
              color: met ? "#059669" : "#94A3B8",
              transition: "color 0.25s ease",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `2px solid ${met ? "#059669" : "#CBD5E1"}`,
                background: met ? "#ECFDF5" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.25s ease",
              }}
            >
              {met && <Check size={9} color="#059669" strokeWidth={3} />}
            </span>
            {lang === "ar" ? rule.labelAr : rule.labelEn}
          </div>
        );
      })}
    </div>
  );
}

function StrengthBar({ password, font, t }) {
  const score = getStrength(password);
  if (!password) return null;
  const activeColor =
    score <= 1 ? "#EF4444" : score <= 3 ? "#F59E0B" : "#059669";
  const label =
    score <= 1
      ? t("password_strength_weak")
      : score <= 3
        ? t("password_strength_fair")
        : t("password_strength_strong");
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: score >= i ? activeColor : "#E2E8F0",
              transition: "background 0.25s",
            }}
          />
        ))}
      </div>
      <div style={{ fontFamily: font.body, fontSize: 11, color: activeColor, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
        {score >= 4 && <Check size={11} />}
        {label}
      </div>
    </div>
  );
}

export default function Register() {
  const { t, lang, dir, toggleLang } = useLanguage();
  const font = FONT[lang];
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [monthlyIncome] = useState(0);
  const [monthlyExpenses] = useState(0);
  const [financialGoal] = useState("Emergency Fund");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!fullname.trim()) errs.fullname = t("err_fullname");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = t("err_email");
    if (!password || password.length < 6) errs.password = t("err_password");
    if (password !== confirm) errs.confirm = t("err_confirm");
    if (Number.isNaN(Number(monthlyIncome))) errs.email = "Monthly income must be a number";
    if (Number.isNaN(Number(monthlyExpenses))) errs.email = "Monthly expenses must be a number";
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

    // Split fullname into firstName / lastName for the API
    const nameParts = fullname.trim().split(" ");
    const firstName = nameParts[0] || fullname;
    const lastName = nameParts.slice(1).join(" ") || "";

    try {
      const result = await registerUser({
        firstName,
        lastName,
        email,
        password,
        confirmPassword: confirm,
        monthlyIncome: Number(monthlyIncome),
        monthlyExpenses: Number(monthlyExpenses),
        financialGoal: financialGoal.trim(),
      });

      if (result.success) {
        // ✅ التوجيه دائماً إلى Onboarding بعد نجاح التسجيل
        navigate("/onboarding", { replace: true });
      } else {
        const apiErr = result.errors?.[0] || "";
        if (
          apiErr.toLowerCase().includes("email") ||
          apiErr.includes("البريد")
        ) {
          setErrors({ email: apiErr });
        } else {
          const normalizedError = apiErr.toLowerCase();
          const readablePasswordHint =
            normalizedError.includes("lowercase") ||
            normalizedError.includes("uppercase") ||
            normalizedError.includes("non alphanumeric") ||
            normalizedError.includes("digit")
              ? lang === "ar"
                ? "كلمة المرور يجب أن تحتوي على حرف إنجليزي صغير وحرف كبير ورقم ورمز خاص مثل !@#"
                : "Password must include at least one English lowercase, uppercase, number, and special character."
              : apiErr;
          setErrors({
            auth: readablePasswordHint || "فشل إنشاء الحساب، حاول مرة أخرى.",
          });
        }
      }
    } catch {
      setErrors({ auth: "حدث خطأ، حاول مرة أخرى." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex w-full bg-[#FFFFFF] auth-main-container"
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
        <div className="flex-1 w-full lg:w-[40%] flex items-center justify-center p-6 lg:p-12 relative bg-white auth-form-panel">
          <div className="w-full max-w-[450px] flex flex-col justify-center relative min-h-[500px] auth-form-inner">
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

            {/* Mobile Logo */}
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
                {t("register_title")}
              </h1>
              <p
                style={{
                  fontFamily: font.body,
                  fontSize: 14,
                  color: "#64748B",
                  margin: 0,
                }}
              >
                {t("register_subtitle")}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              {errors.auth && (
                <div
                  style={{
                    background: "#FEF2F2",
                    color: "#EF4444",
                    padding: "10px 12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  {errors.auth}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{
                    fontFamily: font.body,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0A192F",
                  }}
                >
                  {t("fullname_label")}
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  value={fullname}
                  onChange={(e) => {
                    setFullname(e.target.value);
                    setErrors((p) => ({ ...p, fullname: "" }));
                  }}
                  placeholder={t("fullname_placeholder")}
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
                    e.target.style.borderColor = errors.fullname
                      ? "#EF4444"
                      : "#E2E8F0";
                  }}
                />
                {errors.fullname && (
                  <span style={{ fontSize: 12, color: "#EF4444" }}>
                    {errors.fullname}
                  </span>
                )}
              </div>


              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
                  id="reg-email"
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
                />
                {errors.email && (
                  <span style={{ fontSize: 12, color: "#EF4444" }}>
                    {errors.email}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
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
                      id="reg-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((p) => ({ ...p, password: "" }));
                      }}
                      placeholder={t("password_placeholder")}
                      style={{
                        width: "100%",
                        padding: "12px 16px 12px 42px",
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      aria-label={
                        showPass
                          ? lang === "ar"
                            ? "إخفاء كلمة المرور"
                            : "Hide password"
                          : lang === "ar"
                            ? "إظهار كلمة المرور"
                            : "Show password"
                      }
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        color: "#64748B",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 2,
                      }}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <StrengthBar password={password} font={font} t={t} />
                  <PasswordRequirements password={password} font={font} lang={lang} />
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <label
                    style={{
                      fontFamily: font.body,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#0A192F",
                    }}
                  >
                    {t("confirm_password_label")}
                  </label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      id="reg-confirm"
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => {
                        setConfirm(e.target.value);
                        setErrors((p) => ({ ...p, confirm: "" }));
                      }}
                      placeholder={t("confirm_password_placeholder")}
                      style={{
                        width: "100%",
                        padding: "12px 16px 12px 42px",
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
                        e.target.style.borderColor = errors.confirm
                          ? "#EF4444"
                          : "#E2E8F0";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={
                        showConfirm
                          ? lang === "ar"
                            ? "إخفاء تأكيد كلمة المرور"
                            : "Hide confirm password"
                          : lang === "ar"
                            ? "إظهار تأكيد كلمة المرور"
                            : "Show confirm password"
                      }
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        color: "#64748B",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 2,
                      }}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

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
                {loading ? "..." : t("register_btn")}
              </button>
            </form>

            <p
              style={{
                marginTop: 24,
                textAlign: "center",
                fontFamily: font.body,
                fontSize: 14,
                color: "#64748B",
              }}
            >
              {t("have_account")}{" "}
              <Link
                to="/login"
                style={{
                  color: "#0A192F",
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                {t("login_link")}
              </Link>
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 1023px) {
          .auth-main-container {
            padding-inline: 1.5rem;
          }
          .auth-form-panel {
            padding-inline: 0 !important;
          }
          .auth-form-inner {
            width: 100%;
            max-width: 450px;
            margin-inline: auto;
          }
        }
      `}</style>
    </div>
  );
}
