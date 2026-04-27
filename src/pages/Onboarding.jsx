import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  Car,
  Home,
  Plane,
  ShieldAlert,
  Check,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Plus,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { updateUserOnboardingProfile } from "../services/transactionService";
import { createGoal } from "../services/goalService";

export default function Onboarding() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const userName = localStorage.getItem("auth_user") || "صديقنا";

  const [step, setStep] = useState(1);
  const [income, setIncome] = useState("");
  const [goal, setGoal] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const { lang } = useLanguage();

  const GOALS = [
    { id: "car", label: t("goal_car"), icon: Car },
    { id: "home", label: t("goal_home"), icon: Home },
    { id: "travel", label: t("goal_travel"), icon: Plane },
    { id: "emergency", label: t("goal_emergency"), icon: ShieldAlert },
    { id: "other", label: t("goal_other"), icon: Plus },
  ];

  const CURRENCIES = [
    { id: "USD", label: t("curr_usd"), symbol: "$" },
    { id: "ILS", label: t("curr_ils"), symbol: "₪" },
    { id: "JOD", label: t("curr_jod"), symbol: "د.أ" },
  ];

  const handleNext = () => {
    if (step === 2) {
      if (!income || Number(income) < 0) {
        setError(t("onb_err_income"));
        return;
      }
    }
    if (step === 3) {
      if (!goal) {
        setError(t("onb_err_goal"));
        return;
      }
      if (goal === "other" && !customGoal.trim()) {
        setError(t("onb_err_custom"));
        return;
      }
      if (!targetAmount || Number(targetAmount) <= 0) {
        setError(lang === "ar" ? "الرجاء تحديد المبلغ المستهدف" : "Please set a target amount");
        return;
      }
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    const goalType = goal || "emergency";
    const goalTitle = goal === "other" ? customGoal.trim() : t(`goal_${goal}`);
    const finalTargetAmount = Number(targetAmount);
    const data = {
      income: Number(income),
      goal: goalTitle,
      goalType,
      goalTitle,
      targetAmount: finalTargetAmount,
      currency,
    };
    const email = localStorage.getItem("auth_email") || "";
    const dataKey = email ? `userOnboardingData_${email}` : "userOnboardingData";
    const statusKey = email ? `onboardingComplete_${email}` : "onboardingComplete";
    
    localStorage.setItem(dataKey, JSON.stringify(data));
    localStorage.setItem(statusKey, "true");

    try {
      await updateUserOnboardingProfile({
        monthlyIncome: Number(income),
        financialGoalType: goalType,
        preferredCurrency: currency,
      });

      await createGoal({
        name: goalTitle,
        target: finalTargetAmount,
        saved: 0,
        category: goalType === "other" ? "other" : goalType,
        dateEst: null,
      });
    } catch (apiError) {
      console.warn("[Onboarding] Could not persist onboarding to API:", apiError?.message);
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#EFF3FA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        direction: dir,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          width: "100%",
          maxWidth: 480,
          borderRadius: 24,
          padding: "40px 32px",
          boxShadow: "0 20px 40px rgba(10,25,47,0.08)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Progress Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 40,
          }}
        >
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: 4,
                  borderRadius: 2,
                  flex: 1,
                  background: i <= step ? "#10B981" : "#E2E8F0",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#94A3B8",
              marginLeft: dir === "rtl" ? 0 : 16,
              marginRight: dir === "rtl" ? 16 : 0,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {t("onb_step")} {step} {t("onb_of")} 4
          </span>
        </div>

        {/* Dynamic Content */}
        <div style={{ position: "relative" }}>
          {step === 1 && (
            <div className="animate-fadeIn" style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: "#10B981",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <Wallet size={32} color="#0A192F" strokeWidth={2.5} />
              </div>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#0A192F",
                  margin: "0 0 12px",
                  fontFamily: "'Manrope', 'Cairo', sans-serif",
                }}
              >
                {t("onb_welcome_title")}، {userName}! 👋
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "#64748B",
                  lineHeight: 1.6,
                  margin: "0 0 36px",
                  fontFamily: "'Inter', 'Cairo', sans-serif",
                }}
              >
                {t("onb_welcome_sub")}
              </p>
              <button
                onClick={handleNext}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#10B981",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
                  transition: "all 0.2s",
                  fontFamily: "'Inter', 'Cairo', sans-serif",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                {t("onb_start_btn")}{" "}
                {dir === "rtl" ? (
                  <ArrowLeft size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeIn">
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0A192F",
                  margin: "0 0 8px",
                  fontFamily: "'Manrope', 'Cairo', sans-serif",
                }}
              >
                {t("onb_income_title")}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748B",
                  margin: "0 0 32px",
                  fontFamily: "'Inter', 'Cairo', sans-serif",
                }}
              >
                {t("onb_income_sub")}
              </p>

              <div
                style={{ position: "relative", marginBottom: error ? 8 : 32 }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={income}
                  onChange={(e) => {
                    const englishNumbers = e.target.value.replace(
                      /[٠-٩]/g,
                      (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d),
                    );
                    if (/^\d*$/.test(englishNumbers)) {
                      setIncome(englishNumbers);
                      setError("");
                    }
                  }}
                  placeholder={t("onb_income_ph")}
                  style={{
                    width: "100%",
                    padding:
                      dir === "rtl"
                        ? "16px 20px 16px 48px"
                        : "16px 48px 16px 20px",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0A192F",
                    background: "#F8FAFC",
                    border: `2px solid ${error ? "#EF4444" : "#E2E8F0"}`,
                    borderRadius: 14,
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box",
                    fontFamily: "'Manrope', sans-serif",
                    direction: "ltr",
                    textAlign: dir === "rtl" ? "right" : "left",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#10B981";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? "#EF4444" : "#E2E8F0";
                  }}
                />
                <DollarSign
                  size={20}
                  color="#94A3B8"
                  style={{
                    position: "absolute",
                    top: "50%",
                    [dir === "rtl" ? "left" : "right"]: 20,
                    transform: "translateY(-50%)",
                  }}
                />
              </div>
              {error && (
                <p
                  style={{
                    color: "#EF4444",
                    fontSize: 13,
                    margin: "0 0 24px",
                    fontFamily: "'Inter', 'Cairo', sans-serif",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                onClick={handleNext}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#10B981",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  fontFamily: "'Inter', 'Cairo', sans-serif",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#059669")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#10B981")
                }
              >
                {t("onb_next_btn")}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeIn">
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0A192F",
                  margin: "0 0 8px",
                  fontFamily: "'Manrope', 'Cairo', sans-serif",
                }}
              >
                {t("onb_goal_title")}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748B",
                  margin: "0 0 24px",
                  fontFamily: "'Inter', 'Cairo', sans-serif",
                }}
              >
                {t("onb_goal_sub")}
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: goal === "other" ? 16 : error ? 8 : 32,
                }}
              >
                {GOALS.map(({ id, label, icon: Icon }) => {
                  const isActive = goal === id;
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        setGoal(id);
                        setError("");
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                        padding: "20px 16px",
                        background: isActive ? "#ECFDF5" : "#FFFFFF",
                        border: `2px solid ${isActive ? "#10B981" : "#E2E8F0"}`,
                        borderRadius: 14,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        outline: "none",
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: isActive ? "#10B981" : "#F1F5F9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isActive ? "#FFF" : "#64748B",
                          transition: "all 0.2s",
                        }}
                      >
                        <Icon size={24} />
                      </div>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: isActive ? "#059669" : "#0A192F",
                          fontFamily: "'Inter', 'Cairo', sans-serif",
                          textAlign: "center",
                        }}
                      >
                        {label}
                      </span>
                      {isActive && (
                        <div
                          style={{
                            position: "absolute",
                            top: 10,
                            [dir === "rtl" ? "right" : "left"]: 10,
                            color: "#10B981",
                          }}
                        >
                          <Check size={16} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {goal === "other" && (
                <div
                  style={{ position: "relative", marginBottom: error ? 8 : 32 }}
                  className="animate-fadeIn"
                >
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => {
                      setCustomGoal(e.target.value);
                      setError("");
                    }}
                    placeholder={t("goal_custom_ph")}
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#0A192F",
                      background: "#F8FAFC",
                      border: `2px solid ${error && !customGoal.trim() ? "#EF4444" : "#E2E8F0"}`,
                      borderRadius: 14,
                      outline: "none",
                      transition: "border-color 0.2s",
                      boxSizing: "border-box",
                      fontFamily: "'Inter', 'Cairo', sans-serif",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#10B981";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor =
                        error && !customGoal.trim() ? "#EF4444" : "#E2E8F0";
                    }}
                  />
                </div>
              )}

              {goal && (
                <div
                  style={{ position: "relative", marginBottom: error ? 8 : 32 }}
                  className="animate-fadeIn"
                >
                  <label style={{ fontSize: 14, fontWeight: 700, color: "#0A192F", display: "block", marginBottom: 8, fontFamily: "'Inter', 'Cairo', sans-serif" }}>
                    {lang === "ar" ? "حدد المبلغ المستهدف لهذا الهدف" : "Set the target amount for this goal"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={targetAmount}
                      onChange={(e) => {
                        const englishNumbers = e.target.value.replace(
                          /[٠-٩]/g,
                          (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d),
                        );
                        if (/^\d*$/.test(englishNumbers)) {
                          setTargetAmount(englishNumbers);
                          setError("");
                        }
                      }}
                      placeholder={lang === "ar" ? "مثال: 50000" : "e.g. 50000"}
                      style={{
                        width: "100%",
                        padding:
                          dir === "rtl"
                            ? "16px 20px 16px 48px"
                            : "16px 48px 16px 20px",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0A192F",
                        background: "#F8FAFC",
                        border: `2px solid ${error && !targetAmount ? "#EF4444" : "#E2E8F0"}`,
                        borderRadius: 14,
                        outline: "none",
                        transition: "border-color 0.2s",
                        boxSizing: "border-box",
                        fontFamily: "'Inter', 'Cairo', sans-serif",
                        direction: "ltr",
                        textAlign: dir === "rtl" ? "right" : "left",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#10B981";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor =
                          error && !targetAmount ? "#EF4444" : "#E2E8F0";
                      }}
                    />
                    <DollarSign
                      size={20}
                      color="#94A3B8"
                      style={{
                        position: "absolute",
                        top: "50%",
                        [dir === "rtl" ? "left" : "right"]: 20,
                        transform: "translateY(-50%)",
                      }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <p
                  style={{
                    color: "#EF4444",
                    fontSize: 13,
                    margin: "0 0 24px",
                    fontFamily: "'Inter', 'Cairo', sans-serif",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                onClick={handleNext}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#10B981",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  fontFamily: "'Inter', 'Cairo', sans-serif",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#059669")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#10B981")
                }
              >
                {t("onb_next_btn")}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fadeIn">
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#0A192F",
                  margin: "0 0 8px",
                  fontFamily: "'Manrope', 'Cairo', sans-serif",
                }}
              >
                {t("onb_currency_title")}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748B",
                  margin: "0 0 32px",
                  fontFamily: "'Inter', 'Cairo', sans-serif",
                }}
              >
                {t("onb_currency_sub")}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 32,
                }}
              >
                {CURRENCIES.map(({ id, label, symbol }) => {
                  const isActive = currency === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setCurrency(id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        background: isActive ? "#ECFDF5" : "#FFFFFF",
                        border: `2px solid ${isActive ? "#10B981" : "#E2E8F0"}`,
                        borderRadius: 14,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        outline: "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: isActive ? "#059669" : "#0A192F",
                          fontFamily: "'Inter', 'Cairo', sans-serif",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: isActive ? "#10B981" : "#94A3B8",
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        {symbol}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleFinish}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#0A192F",
                  color: "#FFF",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                  fontFamily: "'Inter', 'Cairo', sans-serif",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1E293B")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#0A192F")
                }
              >
                {t("onb_finish_btn")} <Check size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
