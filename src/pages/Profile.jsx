import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { postRequest, putRequest } from "../services/api";
import { getCurrentEmail, getCurrentUser, getCurrentUserProfile } from "../services/authService";
import { fetchGoals } from "../services/goalService";
import { fetchUserProfile } from "../services/transactionService";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Wallet,
  Car,
  Plane,
  Home,
} from "lucide-react";

const GOAL_ICONS = {
  emergency: ShieldAlert,
  car: Car,
  travel: Plane,
  home: Home,
  other: Target,
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function normalizeDecimalInput(value) {
  const normalized = String(value || "")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1");
  const [integerPart = "", decimalPart] = normalized.split(".");
  return decimalPart !== undefined
    ? `${integerPart}.${decimalPart.slice(0, 2)}`
    : integerPart;
}

function parseIncomeValue(value) {
  const normalized = normalizeDecimalInput(value);
  if (!normalized || normalized === ".") return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Number(parsed.toFixed(2));
}

function toCurrencyFormatter(currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toEnglishNumberFormatter() {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

function getOnboardingStorageKey(email) {
  return email ? `userOnboardingData_${email}` : "userOnboardingData";
}

function syncOnboardingCache(email, nextValues) {
  const storageKey = getOnboardingStorageKey(email);
  // eslint-disable-next-line no-useless-assignment
  let previous = {};

  try {
    previous = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    previous = {};
  }

  const merged = { ...previous, ...nextValues };
  localStorage.setItem(storageKey, JSON.stringify(merged));
  window.dispatchEvent(new CustomEvent("profile:updated", { detail: merged }));
  return merged;
}

const CURRENCY_OPTIONS = [
  { value: "USD", labelAr: "دولار أمريكي", labelEn: "US Dollar", symbol: "$" },
  { value: "ILS", labelAr: "شيكل إسرائيلي", labelEn: "Israeli Shekel", symbol: "₪" },
  { value: "JOD", labelAr: "دينار أردني", labelEn: "Jordanian Dinar", symbol: "د.أ" },
];

function extractApiErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "";

  if (typeof data === "string") return data;
  if (typeof data?.message === "string") return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.filter(Boolean).join(" • ");
  }
  if (data?.errors && typeof data.errors === "object") {
    const flat = Object.values(data.errors).flat().filter(Boolean);
    if (flat.length > 0) return flat.join(" • ");
  }
  return "";
}

async function resilientProfileUpdate({
  endpoint,
  value,
  preferredKey,
  alternateKeys = [],
}) {
  const keys = [preferredKey, ...alternateKeys].filter(Boolean);
  const attempts = [];

  // Primary: POST/PUT with known keys (most backends)
  for (const key of keys) {
    attempts.push(() => postRequest(endpoint, { [key]: value }));
    attempts.push(() => putRequest(endpoint, { [key]: value }));
  }

  // Fallback: some backends accept raw scalar body (rare, but safe to try)
  attempts.push(() => postRequest(endpoint, value));
  attempts.push(() => putRequest(endpoint, value));

  let lastError;
  for (const run of attempts) {
    try {
      return await run();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

export default function Profile() {
  const { lang, dir } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [goals, setGoals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingIncome, setIsSavingIncome] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  const fallbackName = getCurrentUser();
  const fallbackEmail = getCurrentEmail();
  const storageEmail = fallbackEmail || "";

  useEffect(() => {
    let cancelled = false;

    async function loadPageData() {
      setIsLoading(true);
      try {
        const [profileData, goalsData, currentUserData] = await Promise.all([
          fetchUserProfile(),
          fetchGoals(),
          getCurrentUserProfile(),
        ]);

        if (cancelled) return;

        const safeProfile = profileData || {};
        const monthlyIncome = Number(safeProfile.income || 0);

        setProfile(safeProfile);
        setGoals(Array.isArray(goalsData) ? goalsData : []);
        setUserInfo(currentUserData || null);
        setIncomeInput(toEnglishNumberFormatter().format(monthlyIncome));
        setSelectedCurrency(safeProfile.currency || "USD");
      } catch (error) {
        if (!cancelled) {
          console.error("Profile load error:", error);
          setProfile({});
          setGoals([]);
          setUserInfo(null);
          setSelectedCurrency("USD");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPageData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast.show) return undefined;
    const timer = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [toast.show]);

  const currency = profile?.currency || "USD";
  const currencyFormatter = useMemo(() => toCurrencyFormatter(currency), [currency]);
  const numberFormatter = useMemo(() => toEnglishNumberFormatter(), []);

  const displayName =
    userInfo?.fullName ||
    userInfo?.name ||
    fallbackName ||
    (lang === "ar" ? "المستخدم" : "User");
  const displayEmail = userInfo?.email || fallbackEmail;
  const currentEmail = storageEmail || displayEmail || "";
  const displayGoalType = profile?.goalType || profile?.goal || "emergency";

  const displayGoals = useMemo(() => {
    if (goals.length > 0) {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const topGoal = [...goals].sort((a, b) => {
        const aScore = priorityScore[String(a?.priority || "").toLowerCase()] || 0;
        const bScore = priorityScore[String(b?.priority || "").toLowerCase()] || 0;
        if (aScore !== bScore) return bScore - aScore;
        return Number(b?.target || 0) - Number(a?.target || 0);
      })[0];
      return topGoal ? [topGoal] : [];
    }
    if (!profile?.goalTitle && !profile?.targetAmount) return [];

    return [
      {
        id: "profile-fallback-goal",
        name:
          profile.goalTitle ||
          (lang === "ar" ? "الهدف الرئيسي" : "Primary Goal"),
        target: Number(profile.targetAmount || 0),
        saved: 0,
        category: displayGoalType,
        subname: lang === "ar" ? "الهدف الحالي" : "Current goal",
      },
    ];
  }, [displayGoalType, goals, lang, profile]);

  const incomeValue = parseIncomeValue(incomeInput);
  const isIncomeInvalid = incomeInput.trim().length > 0 && incomeValue === null;
  const normalizedCurrentIncome = numberFormatter.format(Number(profile?.income || 0));
  const isIncomeEdited = incomeInput.trim().length > 0 && incomeInput !== normalizedCurrentIncome;

  const statCards = [
    {
      id: "income",
      title: lang === "ar" ? "الدخل الشهري الحالي" : "Current Monthly Income",
      value:
        profile && Number.isFinite(Number(profile.income))
          ? currencyFormatter.format(Number(profile.income))
          : currencyFormatter.format(0),
      icon: Wallet,
      accent: "#10B981",
      bg: "#ECFDF5",
      border: "#D1FAE5",
    },
    {
      id: "goal",
      title: lang === "ar" ? "الهدف المالي الأساسي" : "Primary Financial Goal",
      value:
        displayGoals.length > 0
          ? displayGoals[0].name
          : lang === "ar"
            ? "لا يوجد هدف محفوظ"
            : "No saved goal",
      icon: Target,
      accent: "#2563EB",
      bg: "#EFF6FF",
      border: "#DBEAFE",
    },
    {
      id: "account",
      title: lang === "ar" ? "حالة الحساب" : "Account Status",
      value: lang === "ar" ? "نشط ومهيأ" : "Active and ready",
      icon: ShieldCheck,
      accent: "#F59E0B",
      bg: "#FFFBEB",
      border: "#FDE68A",
    },
  ];

  async function handleUpdateIncome() {
    const parsedIncome = parseIncomeValue(incomeInput);
    if (parsedIncome === null) {
      setToast({
        show: true,
        type: "error",
        message:
          lang === "ar"
            ? "اكتب الرقم بشكل صحيح باستخدام أرقام إنجليزية فقط."
            : "Enter a valid number using English digits only.",
      });
      return;
    }

    setIsSavingIncome(true);
    try {
      await resilientProfileUpdate({
        endpoint: "/api/user-profile/monthly-income",
        value: Number(parsedIncome),
        preferredKey: "monthlyIncome",
        alternateKeys: ["income", "MonthlyIncome", "monthly_income"],
      });

      const refreshedProfile = await fetchUserProfile();
      const nextProfile = {
        ...(profile || {}),
        ...(refreshedProfile || {}),
        income: Number(parsedIncome),
      };
      setProfile(nextProfile);
      setIncomeInput(numberFormatter.format(Number(nextProfile.income || parsedIncome)));
      syncOnboardingCache(currentEmail, {
        income: Number(parsedIncome),
        currency: nextProfile.currency || selectedCurrency || "USD",
        goal: nextProfile.goal || displayGoalType,
        goalType: nextProfile.goalType || displayGoalType,
        goalTitle: nextProfile.goalTitle || profile?.goalTitle,
        targetAmount: Number(nextProfile.targetAmount || profile?.targetAmount || 0),
      });
      setToast({
        show: true,
        type: "success",
        message:
          lang === "ar"
            ? "تم تحديث الدخل الشهري بنجاح."
            : "Monthly income updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update monthly income:", error);
      const apiMsg = extractApiErrorMessage(error);
      setToast({
        show: true,
        type: "error",
        message:
          lang === "ar"
            ? `تعذر تحديث الدخل الشهري. ${apiMsg ? `(${apiMsg})` : ""}`.trim()
            : `Unable to update monthly income. ${apiMsg ? `(${apiMsg})` : ""}`.trim(),
      });
    } finally {
      setIsSavingIncome(false);
    }
  }

  async function handleUpdateCurrency() {
    if (!selectedCurrency || selectedCurrency === currency) return;

    setIsSavingCurrency(true);
    try {
      await resilientProfileUpdate({
        endpoint: "/api/user-profile/preferred-currency",
        value: selectedCurrency,
        preferredKey: "preferredCurrency",
        alternateKeys: ["currency", "PreferredCurrency", "preferred_currency"],
      });

      const refreshedProfile = await fetchUserProfile();
      const nextProfile = {
        ...(profile || {}),
        ...(refreshedProfile || {}),
        currency: selectedCurrency,
      };

      setProfile(nextProfile);
      syncOnboardingCache(currentEmail, {
        income: Number(nextProfile.income || 0),
        currency: selectedCurrency,
        goal: nextProfile.goal || displayGoalType,
        goalType: nextProfile.goalType || displayGoalType,
        goalTitle: nextProfile.goalTitle || profile?.goalTitle,
        targetAmount: Number(nextProfile.targetAmount || profile?.targetAmount || 0),
      });

      setToast({
        show: true,
        type: "success",
        message:
          lang === "ar"
            ? "تم تحديث العملة المفضلة. سيتم تطبيقها على كامل الموقع الآن."
            : "Preferred currency updated. It will now apply across the site.",
      });

      window.setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Failed to update preferred currency:", error);
      setSelectedCurrency(currency);
      const apiMsg = extractApiErrorMessage(error);
      setToast({
        show: true,
        type: "error",
        message:
          lang === "ar"
            ? `تعذر حفظ العملة المفضلة. ${apiMsg ? `(${apiMsg})` : ""}`.trim()
            : `Unable to save preferred currency. ${apiMsg ? `(${apiMsg})` : ""}`.trim(),
      });
    } finally {
      setIsSavingCurrency(false);
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          direction: dir,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
          }}
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="profile-skeleton"
              style={{
                height: 132,
                borderRadius: 24,
                background: "#E2E8F0",
                border: "1px solid #E2E8F0",
              }}
            />
          ))}
        </div>

        <div className="profile-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[1, 2].map((item) => (
              <div
                key={item}
                className="profile-skeleton"
                style={{
                  height: item === 1 ? 320 : 250,
                  borderRadius: 24,
                  background: "#E2E8F0",
                  border: "1px solid #E2E8F0",
                }}
              />
            ))}
          </div>
          <div
            className="profile-skeleton"
            style={{
              minHeight: 540,
              borderRadius: 24,
              background: "#E2E8F0",
              border: "1px solid #E2E8F0",
            }}
          />
        </div>

        <style>{`
          @keyframes profilePulse {
            0% { opacity: 0.55; }
            50% { opacity: 0.3; }
            100% { opacity: 0.55; }
          }
          .profile-skeleton {
            animation: profilePulse 1.5s infinite ease-in-out;
          }
          .profile-grid {
            display: grid;
            grid-template-columns: 1fr 1.35fr;
            gap: 24px;
          }
          @media (max-width: 1100px) {
            .profile-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        direction: dir,
        fontFamily: "'Inter', 'Cairo', sans-serif",
        position: "relative",
      }}
    >
      {toast.show ? (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 20px",
            borderRadius: 16,
            background: toast.type === "success" ? "#10B981" : "#EF4444",
            color: "#FFFFFF",
            boxShadow: "0 10px 30px rgba(10,25,47,0.18)",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      ) : null}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        <motion.div variants={cardVariants}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#10B981",
                  marginBottom: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: 0.3,
                }}
              >
                <Sparkles size={16} />
                <span>{lang === "ar" ? "الهوية المالية" : "Financial Identity"}</span>
              </div>
              <h1
                style={{
                  margin: "0 0 8px",
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#0A192F",
                  fontFamily: "'Manrope', 'Cairo', sans-serif",
                  letterSpacing: -1,
                }}
              >
                {lang === "ar" ? "الملف الشخصي" : "Profile"}
              </h1>
              <p style={{ margin: 0, fontSize: 15, color: "#64748B", lineHeight: 1.7 }}>
                {lang === "ar"
                  ? "صفحة موحدة مع هوية المنصة لعرض بياناتك الأساسية، الدخل الشهري، وتقدم أهدافك."
                  : "A unified page that matches the product identity for your core profile, monthly income, and goal progress."}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
            gap: 24,
          }}
        >
          <motion.div variants={cardVariants} style={{ gridColumn: "span 12" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 24,
              }}
            >
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.id}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: 24,
                      padding: 24,
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: card.bg,
                        border: `1px solid ${card.border}`,
                        color: card.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#64748B",
                          marginBottom: 8,
                        }}
                      >
                        {card.title}
                      </div>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: "#0A192F",
                          fontFamily: "'Manrope', 'Cairo', sans-serif",
                          lineHeight: 1.35,
                          wordBreak: "break-word",
                        }}
                      >
                        {card.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={cardVariants} style={{ gridColumn: "span 12 / span 12" }}>
            <div className="profile-grid">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: 32,
                    boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                    border: "1px solid #E2E8F0",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -32,
                      [dir === "rtl" ? "left" : "right"]: -32,
                      width: 140,
                      height: 140,
                      borderRadius: "50%",
                      background: "#ECFDF5",
                    }}
                  />

                  <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 24,
                          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 28,
                          fontWeight: 800,
                          boxShadow: "0 12px 24px rgba(16,185,129,0.22)",
                          flexShrink: 0,
                        }}
                      >
                        {(displayName || "U").charAt(0).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h2
                          style={{
                            margin: "0 0 6px",
                            fontSize: 24,
                            fontWeight: 800,
                            color: "#0A192F",
                            fontFamily: "'Manrope', 'Cairo', sans-serif",
                          }}
                        >
                          {displayName}
                        </h2>
                        <p style={{ margin: 0, color: "#64748B", fontSize: 14 }}>
                          {lang === "ar" ? "الملف الأساسي للمستخدم" : "Primary account profile"}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 16,
                          background: "#F8FAFC",
                          borderRadius: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            color: "#64748B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Mail size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>
                            {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              color: "#0A192F",
                              wordBreak: "break-all",
                            }}
                          >
                            {displayEmail || (lang === "ar" ? "غير متوفر" : "Unavailable")}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: 16,
                          background: "#F8FAFC",
                          borderRadius: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: "#FFFFFF",
                            border: "1px solid #E2E8F0",
                            color: "#10B981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <UserRound size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>
                            {lang === "ar" ? "حالة الحساب" : "Account status"}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#10B981" }}>
                            {lang === "ar" ? "نشط" : "Active"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: 32,
                    boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        background: "#ECFDF5",
                        color: "#10B981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Wallet size={22} />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: "0 0 4px",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0A192F",
                          fontFamily: "'Manrope', 'Cairo', sans-serif",
                        }}
                      >
                        {lang === "ar" ? "تحديث الدخل الشهري" : "Update Monthly Income"}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                        {lang === "ar"
                          ? "استخدم أرقاماً إنجليزية فقط وبدون فواصل آلاف. مثال صحيح: 6000.00"
                          : "Use English digits only with no thousands separators. Valid example: 6000.00"}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <input
                        type="text"
                        inputMode="decimal"
                        lang="en"
                        dir="ltr"
                        value={incomeInput}
                        onChange={(e) => setIncomeInput(normalizeDecimalInput(e.target.value))}
                        placeholder="6000.00"
                        style={{
                          width: "100%",
                          padding: "18px 20px",
                          borderRadius: 16,
                          border: `1px solid ${isIncomeInvalid ? "#FCA5A5" : "#E2E8F0"}`,
                          background: isIncomeInvalid ? "#FFF1F2" : "#F8FAFC",
                          outline: "none",
                          fontSize: 28,
                          fontWeight: 800,
                          color: "#0A192F",
                          fontFamily: "'Manrope', 'Cairo', sans-serif",
                          transition: "all 0.2s ease",
                          boxSizing: "border-box",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                          marginTop: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: 12, color: isIncomeInvalid ? "#EF4444" : "#64748B", fontWeight: 600 }}>
                          {isIncomeInvalid
                            ? (lang === "ar"
                              ? "المدخل غير صالح. المسموح أرقام إنجليزية ونقطة عشرية فقط."
                              : "Invalid input. Only English digits and one decimal point are allowed.")
                            : (lang === "ar"
                              ? `سيتم إرسال القيمة بصيغة رقمية: ${incomeValue !== null ? numberFormatter.format(incomeValue) : "0.00"}`
                              : `The API payload will be sent as a numeric value: ${incomeValue !== null ? numberFormatter.format(incomeValue) : "0.00"}`)}
                        </span>
                        <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700 }}>
                          {currency}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleUpdateIncome}
                      disabled={isSavingIncome || isIncomeInvalid || incomeValue === null}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        background: isSavingIncome || isIncomeInvalid || incomeValue === null ? "#A7F3D0" : "#10B981",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 16,
                        padding: "14px 18px",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: isSavingIncome || isIncomeInvalid || incomeValue === null ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 8px 18px rgba(16,185,129,0.18)",
                      }}
                    >
                      {isSavingIncome ? (
                        <Loader2 size={18} style={{ animation: "spin 0.9s linear infinite" }} />
                      ) : isIncomeEdited ? (
                        <Save size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                      <span>{lang === "ar" ? "حفظ الدخل الشهري" : "Save monthly income"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: 32,
                    boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      marginBottom: 24,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: "0 0 6px",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0A192F",
                          fontFamily: "'Manrope', 'Cairo', sans-serif",
                        }}
                      >
                        {lang === "ar" ? "إدارة الأهداف" : "Goals Overview"}
                      </h3>
                    </div>
                  </div>

                  {displayGoals.length === 0 ? (
                    <div
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: 20,
                        padding: "44px 24px",
                        textAlign: "center",
                      }}
                    >
                      <Target size={34} color="#94A3B8" style={{ marginBottom: 14 }} />
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#0A192F", marginBottom: 6 }}>
                        {lang === "ar" ? "لا توجد أهداف محفوظة بعد" : "No saved goals yet"}
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: 24,
                      }}
                    >
                      {displayGoals.map((goal) => {
                        const Icon = GOAL_ICONS[goal.category] || Target;
                        const target = Math.max(Number(goal.target || 0), 0);
                        const saved = Math.max(Number(goal.saved || 0), 0);
                        const progress = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
                        const progressColor =
                          progress >= 80 ? "#10B981" : progress >= 40 ? "#3B82F6" : "#F59E0B";

                        return (
                          <motion.div
                            key={goal.id}
                            variants={cardVariants}
                            style={{
                              background: "#FFFFFF",
                              borderRadius: 24,
                              padding: 24,
                              border: "1px solid #E2E8F0",
                              boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 20,
                              minWidth: 0,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 16,
                                  background: "#F8FAFC",
                                  color: "#475569",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "1px solid #E2E8F0",
                                  flexShrink: 0,
                                }}
                              >
                                <Icon size={24} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 17,
                                    fontWeight: 800,
                                    color: "#0A192F",
                                    fontFamily: "'Manrope', 'Cairo', sans-serif",
                                    marginBottom: 4,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {goal.name}
                                </div>
                                <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                                  {goal.subname || (lang === "ar" ? "هدف مالي" : "Financial goal")}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                                gap: 12,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: 26,
                                    fontWeight: 800,
                                    color: "#0A192F",
                                    fontFamily: "'Manrope', 'Cairo', sans-serif",
                                  }}
                                >
                                  {currencyFormatter.format(saved)}
                                </div>
                                <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
                                  {lang === "ar"
                                    ? `من هدف ${currencyFormatter.format(target)}`
                                    : `of ${currencyFormatter.format(target)} target`}
                                </div>
                              </div>

                              <div
                                style={{
                                  fontSize: 28,
                                  fontWeight: 800,
                                  color: progressColor,
                                  fontFamily: "'Manrope', 'Cairo', sans-serif",
                                }}
                              >
                                {Math.round(progress)}%
                              </div>
                            </div>

                            <div
                              style={{
                                width: "100%",
                                height: 10,
                                background: "#F1F5F9",
                                borderRadius: 999,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${progress}%`,
                                  height: "100%",
                                  background: progressColor,
                                  borderRadius: 999,
                                  transition: "width 0.7s ease",
                                }}
                              />
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 12,
                                borderTop: "1px solid #F1F5F9",
                                paddingTop: 16,
                                marginTop: "auto",
                                flexWrap: "wrap",
                              }}
                            >
                              <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                                {lang === "ar" ? "المتبقي" : "Remaining"}
                              </div>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 800,
                                  color: "#0A192F",
                                  fontFamily: "'Manrope', 'Cairo', sans-serif",
                                }}
                              >
                                {currencyFormatter.format(Math.max(0, target - saved))}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 24,
                    padding: 32,
                    boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        background: "#EFF6FF",
                        color: "#2563EB",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Wallet size={22} />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: "0 0 4px",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0A192F",
                          fontFamily: "'Manrope', 'Cairo', sans-serif",
                        }}
                      >
                        {lang === "ar" ? "العملة المفضلة" : "Preferred Currency"}
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
                        {lang === "ar"
                          ? "عند تغييرها يتم تحديث تنسيق المبالغ في كامل الموقع فوراً."
                          : "Changing it updates money formatting across the site immediately."}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ position: "relative" }}>
                      <select
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "16px 18px",
                          borderRadius: 16,
                          border: "1px solid #E2E8F0",
                          background: "#F8FAFC",
                          outline: "none",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#0A192F",
                          appearance: "none",
                          cursor: "pointer",
                        }}
                      >
                        {CURRENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {lang === "ar"
                              ? `${option.labelAr} (${option.symbol})`
                              : `${option.labelEn} (${option.symbol})`}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        color="#94A3B8"
                        style={{
                          position: "absolute",
                          top: "50%",
                          [dir === "rtl" ? "left" : "right"]: 16,
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>

                    <button
                      onClick={handleUpdateCurrency}
                      disabled={isSavingCurrency || selectedCurrency === currency}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        background: isSavingCurrency || selectedCurrency === currency ? "#BFDBFE" : "#2563EB",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 16,
                        padding: "14px 18px",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: isSavingCurrency || selectedCurrency === currency ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 8px 18px rgba(37,99,235,0.16)",
                      }}
                    >
                      {isSavingCurrency ? <Loader2 size={18} style={{ animation: "spin 0.9s linear infinite" }} /> : <ArrowUpRight size={18} />}
                      <span>{lang === "ar" ? "حفظ العملة المفضلة" : "Save preferred currency"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <style>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 24px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 1100px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
