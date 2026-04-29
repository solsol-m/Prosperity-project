/**
 * Dashboard.jsx — لوحة البيانات الرئيسية
 *
 * المكونات:
 *   - كروت الإحصائيات (الرصيد، الدخل، المصروفات)
 *   - رسم بياني للإنفاق (Bar Chart) مع فلتر زمني
 *   - ميزانية الذكاء الاصطناعي (Pie Chart دائري)
 *   - جدول آخر 4 عمليات مع زر "عرض الكل"
 *   - نافذة (Modal) لإضافة عملية جديدة
 *   - حالة فارغة (Empty State) إذا لم تكن هناك عمليات
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  getTransactions,
  getOnboardingData,
  fetchTransactions,
  addTransaction,
} from "../services/transactionService";
import { fetchDashboardSummary, fetchSavingsSummary, depositSavings } from "../services/dashboardService";
import { fetchGoals } from "../services/goalService";
import AddTransactionModal from "../components/AddTransactionModal";
import {
  Utensils,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  BrainCircuit,
  ChevronDown,
  Wallet,
  Zap,
  Film,
  ShoppingCart,
  Building,
  Bus,
  Coins,
  TrendingUp,
  Gift,
  Car,
  Home,
  Plane,
  ShieldAlert,
  Target,
  PiggyBank,
  MoreVertical,
  MoreHorizontal,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const CAT_ICONS = {
  food: Utensils,
  transport: Bus,
  housing: Building,
  rent: Home,
  shopping: ShoppingCart,
  utilities: Zap,
  entertainment: Film,
  salary: Coins,
  freelance: Briefcase,
  bonus: Gift,
  investment: TrendingUp,
  groceries: ShoppingCart,
  income: Briefcase,
};

const GOAL_ICONS = {
  emergency: ShieldAlert,
  car: Car,
  travel: Plane,
  home: Home,
  other: Target,
};

const CAT_COLORS = {
  food: { color: "#EA580C", bg: "#FFF7ED" },
  transport: { color: "#64748B", bg: "#F1F5F9" },
  housing: { color: "#3B82F6", bg: "#EFF6FF" },
  rent: { color: "#3B82F6", bg: "#EFF6FF" },
  shopping: { color: "#EC4899", bg: "#FDF2F8" },
  utilities: { color: "#F59E0B", bg: "#FFFBEB" },
  entertainment: { color: "#8B5CF6", bg: "#F5F3FF" },
  salary: { color: "#10B981", bg: "#ECFDF5" },
  freelance: { color: "#16A34A", bg: "#F0FDF4" },
  bonus: { color: "#F97316", bg: "#FFEDD5" },
  investment: { color: "#2563EB", bg: "#EFF6FF" },
  groceries: { color: "#16A34A", bg: "#F0FDF4" },
  income: { color: "#10B981", bg: "#ECFDF5" },
  default: { color: "#94A3B8", bg: "#F8FAFC" },
};

export default function Dashboard() {
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();
  const newTransactionLabel = t("dash_new_trans").replace(/^\s*\+\s*/, "");
  const token =
    localStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const today = new Date();
  const [transactions, setTransactions] = useState(() => getTransactions());
  const [goals, setGoals] = useState([]);
  const [apiSummary, setApiSummary] = useState(null);
  const [timeRange, setTimeRange] = useState(7); // نطاق زمني افتراضي: 7 أيام
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [savingsSummary, setSavingsSummary] = useState(null);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState(0);
  const [savingsTarget, setSavingsTarget] = useState(() => {
    const saved = localStorage.getItem(`savings_target_${today.getFullYear()}_${today.getMonth()}`);
    return saved ? Number(saved) : 0;
  });
  const [isSavingsLoading, setIsSavingsLoading] = useState(false);
  const [isEditingSavings, setIsEditingSavings] = useState(false);
  const [editingSavingsTxId, setEditingSavingsTxId] = useState(null);
  const [showSavingsMenu, setShowSavingsMenu] = useState(false);
  const [hasSkippedSavingsGoal, setHasSkippedSavingsGoal] = useState(() => {
    return localStorage.getItem(`skipped_savings_${today.getFullYear()}_${today.getMonth()}`) === "true";
  });

  // ── تحميل البيانات: API أولاً ثم localStorage كبديل ────────────────
  useEffect(() => {
    let cancelled = false;

    // Avoid firing protected API calls before auth token exists.
    if (!token) {
      return () => {
        cancelled = true;
      };
    }

    Promise.all([
      fetchDashboardSummary(10, 6),
      fetchGoals(),
      fetchTransactions(),
      fetchSavingsSummary(),
    ]).then(([summary, goalsData, txData, savingsData]) => {
      if (!cancelled) {
        // --- تعديل الملخص المالي ليعكس مدخرات الحصالة كمصروفات ---
        const normalizedTxs = Array.isArray(txData) ? txData : [];
        const savingsTxs = normalizedTxs.filter(t => 
          t.name.includes("إيداع توفير") || t.name.toLowerCase().includes("savings deposit")
        );
        const totalSavingsAdjust = savingsTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const adjustedSummary = {
          ...summary,
          // إذا كان السيرفر يعتبر التوفير دخلاً، نقوم بخصمه من الدخل وإضافته للمصروفات
          totalIncome: Math.max(0, summary.totalIncome - totalSavingsAdjust),
          totalExpenses: summary.totalExpenses + totalSavingsAdjust,
          totalBalance: summary.totalBalance - (totalSavingsAdjust * 2), // خصم (إزالة الإضافة + خصم كمصروف)
        };
        // تصحيح الرصيد النهائي ليكون دائماً الفرق بين الدخل والمصروفات المعدلة
        adjustedSummary.totalBalance = adjustedSummary.totalIncome - adjustedSummary.totalExpenses;

        setApiSummary(adjustedSummary);
        setGoals(Array.isArray(goalsData) ? goalsData : []);
        setTransactions(normalizedTxs);
        setSavingsSummary(savingsData.success ? savingsData : null);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  // ── بيانات الـ Onboarding (الدخل الأساسي، العملة) ───────────
  const onboardingData = getOnboardingData();

  // ── منطق إشعار الراتب (Persistent Banner) ────────────────
  const [showSalaryBanner, setShowSalaryBanner] = useState(false);
  const salaryDay = 1; // يظهر دائماً من بداية الشهر (تاريخ 1)

  const currentMonthKey = `salary_added_${today.getFullYear()}_${today.getMonth()}`;
  const isSalaryConfirmed = localStorage.getItem(currentMonthKey) === "true";

  const hasAnyIncome = transactions.some((t) => t.type === "income");

  useEffect(() => {
    if (!isLoading) {
      const isNewUserNoIncome = !hasAnyIncome;
      const isMonthlySalaryDue = today.getDate() >= salaryDay && !isSalaryConfirmed;

      if (isNewUserNoIncome || isMonthlySalaryDue) {
        setShowSalaryBanner(true);
      } else {
        setShowSalaryBanner(false);
      }
    }
  }, [isLoading, hasAnyIncome, isSalaryConfirmed, salaryDay]);

  const handleAddSalary = async () => {
    try {
      const salaryAmount = Number(onboardingData.income || 0);

      const newTx = {
        name: lang === "ar" ? "الراتب الشهري" : "Monthly Salary",
        amount: salaryAmount,
        date: today.toISOString().split("T")[0],
        category: "salary",
        type: "income",
      };

      await addTransaction(newTx);

      const currentMonthKey = `salary_added_${today.getFullYear()}_${today.getMonth()}`;
      localStorage.setItem(currentMonthKey, "true");

      // تحديث البيانات فوراً
      const updatedTxs = await fetchTransactions();
      setTransactions(updatedTxs);
      setShowSalaryBanner(false);

      // Open Savings Modal
      setShowSavingsModal(true);
    } catch (err) {
      console.error("Failed to add salary:", err);
    }
  };

  const handleSavingsConfirm = async () => {
    setIsSavingsLoading(true);
    try {
      if (isEditingSavings) {
        // تحديث الهدف الشهري فقط في المتصفح
        setSavingsTarget(Number(savingsAmount));
        localStorage.setItem(`savings_target_${today.getFullYear()}_${today.getMonth()}`, savingsAmount.toString());
      } else {
        const depositName = lang === "ar" ? "إيداع توفير" : "Savings Deposit";
        await depositSavings(savingsAmount, new Date().toISOString(), depositName);
        
        // تسجيل المعاملة كما طلب المستخدم
        await addTransaction({
          name: "إيداع توفير",
          amount: Number(savingsAmount),
          date: new Date().toISOString().split("T")[0],
          category: "investment",
          type: "expense"
        });
      }

      // تحديث البيانات من السيرفر لضمان المزامنة
      const [txData, savingsData, summary] = await Promise.all([
        fetchTransactions(),
        fetchSavingsSummary(),
        fetchDashboardSummary(10, 6),
      ]);
      
      const normalizedTxs = Array.isArray(txData) ? txData : [];
      const savingsTxs = normalizedTxs.filter(t => 
        t.name.includes("إيداع توفير") || t.name.toLowerCase().includes("savings deposit")
      );
      const totalSavingsAdjust = savingsTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const adjustedSummary = {
        ...summary,
        totalIncome: Math.max(0, summary.totalIncome - totalSavingsAdjust),
        totalExpenses: summary.totalExpenses + totalSavingsAdjust,
        totalBalance: summary.totalIncome - summary.totalExpenses - (totalSavingsAdjust * 2) 
      };
      adjustedSummary.totalBalance = adjustedSummary.totalIncome - adjustedSummary.totalExpenses;

      setTransactions(normalizedTxs);
      setSavingsSummary(savingsData.success ? savingsData : null);
      setApiSummary(adjustedSummary);
      
      setHasSkippedSavingsGoal(false);
      localStorage.removeItem(`skipped_savings_${today.getFullYear()}_${today.getMonth()}`);
      
      setShowSavingsModal(false);
      setIsEditingSavings(false);
    } catch (err) {
      console.error("Savings action failed:", err);
    } finally {
      setIsSavingsLoading(false);
    }
  };

  const handleSkipSavings = () => {
    localStorage.setItem(`skipped_savings_${today.getFullYear()}_${today.getMonth()}`, "true");
    setHasSkippedSavingsGoal(true);
    setShowSavingsModal(false);
    setIsEditingSavings(false);
  };

  const handleOpenEditSavings = () => {
    setSavingsAmount(savingsTarget);
    setIsEditingSavings(true);
    setShowSavingsModal(true);
    setShowSavingsMenu(false);
  };

  // Filter transactions by timeRange for CHART ONLY
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - timeRange);

  const filteredTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= pastDate && txDate <= now;
  });

  // ── حساب إجماليات الشهر الحالي فقط ───────────────────────────
  const thisMonth = new Date().getMonth();
  const thisYear  = new Date().getFullYear();
  
  // جميع العمليات المسجلة (للميزانية الكلية)
  const allTxIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const allTxExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  // عمليات الشهر الحالي فقط
  const currentMonthTxs = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const txIncomeCurrentMonth = currentMonthTxs
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const txExpensesCurrentMonth = currentMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  // الرصيد يعتمد فقط على العمليات المؤكدة + رصيد البداية (إذا وجد)
  const initialBalance = Number(onboardingData.initialBalance || 0);
  const totalBalance  = initialBalance + (allTxIncome - allTxExpenses);
  
  // البطاقات تعرض إحصائيات الشهر الحالي
  const totalIncome   = txIncomeCurrentMonth; 
  const totalExpenses = txExpensesCurrentMonth;

  // المعاملات للعرض: API أولاً، ثم المحلية
  const displayTransactions = transactions.length
    ? transactions
    : (apiSummary?.recentTransactions || []);

  const fallbackGoalType = onboardingData.goalType || "emergency";
  const mainGoal = goals[0] || {
    name: onboardingData.goalTitle || t(`goal_${fallbackGoalType}`),
    target: Number(onboardingData.targetAmount) || 50000,
    saved: 0,
    category: fallbackGoalType,
  };
  const goalProgress = Math.min(100, (mainGoal.saved / mainGoal.target) * 100);
  const targetAmount = mainGoal.target;
  const savedAmount = mainGoal.saved;
  const GoalIcon = GOAL_ICONS[mainGoal.category] || Target;

  const chartData = [];
  for (let i = timeRange - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const daySpend = filteredTxs
      .filter((t) => t.date === dateStr && (t.type === "expense" || t.amount < 0))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const dayIncome = filteredTxs
      .filter((t) => t.date === dateStr && (t.type === "income" || t.amount > 0))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    chartData.push({
      day: t(`day_${d.getDay() + 1}`),
      spend: daySpend,
      income: dayIncome,
    });
  }

  // AI Budget Circle (manual frontend logic)
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);
  const monthlyRemaining = totalIncome - totalExpenses;
  const aiDailyBudget = monthlyRemaining / daysRemaining;
  const budgetRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0;
  const spentPercent = Math.min(100, Math.max(0, budgetRatio * 100));
  const remainingPercent = Math.max(0, 100 - spentPercent);
  const budgetColor = spentPercent > 80 ? "#EF4444" : "#10B981";

  const pieData = [
    { name: "Spent", value: spentPercent, color: budgetColor },
    { name: "Remaining", value: remainingPercent, color: "#F1F5F9" },
  ];

  // تنسيق العملة — يستخدم en-US دائماً لضمان النقطة العشرية
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: onboardingData.currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // ── Monthly Comparison Logic (API with local fallback) ──────────────
  let monthlyChangePercent = null;
  let isMonthlyPositive = true;

  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Local calculation as fallback
  const localPreviousMonthTxs = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === previousMonth && d.getFullYear() === previousYear;
  });
  const localPrevExpenses = localPreviousMonthTxs
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  // Determine comparison source
  let currExp = totalExpenses; // from current month transactions
  let prevExp = localPrevExpenses;

  // Use API data if available and more complete
  if (apiSummary?.monthlyOverview && apiSummary.monthlyOverview.length >= 2) {
    const mData = apiSummary.monthlyOverview;
    const apiCurr = mData[mData.length - 1]?.expenses ?? 0;
    const apiPrev = mData[mData.length - 2]?.expenses ?? 0;
    // Only override if API has data
    if (apiCurr > 0 || apiPrev > 0) {
      currExp = apiCurr;
      prevExp = apiPrev;
    }
  }

  if (prevExp !== 0) {
    monthlyChangePercent = ((currExp - prevExp) / prevExp) * 100;
    isMonthlyPositive = monthlyChangePercent <= 0; // نقصان المصروفات أخضر
  } else if (currExp > 0 && prevExp === 0) {
    // حالة مستخدم جديد: لا يوجد مصروفات شهر سابق ولكن يوجد هذا الشهر
    // بدلاً من 100% أحمر، نظهر 0% أو نعتبرها بداية جديدة
    monthlyChangePercent = 0;
    isMonthlyPositive = true;
  } else {
    monthlyChangePercent = 0;
    isMonthlyPositive = true;
  }
  monthlyChangePercent = parseFloat(Math.abs(monthlyChangePercent).toFixed(1));

  // Calculate Category Breakdown — Expenses ONLY (exclude income categories)
  const INCOME_CATEGORIES = new Set(["salary", "freelance", "bonus", "investment", "income"]);
  const categoryData = transactions
    .filter((tx) => tx.type === "expense" || (tx.type !== "income" && tx.amount < 0))
    .reduce((acc, tx) => {
      const cat = tx.category || "default";
      if (!INCOME_CATEGORIES.has(cat)) {
        acc[cat] = (acc[cat] || 0) + Math.abs(tx.amount);
      }
      return acc;
    }, {});

  const catPieData = Object.entries(categoryData)
    .map(([name, value]) => ({
      name,
      value,
      color: CAT_COLORS[name]
        ? CAT_COLORS[name].color
        : CAT_COLORS.default.color,
    }))
    .sort((a, b) => b.value - a.value); // Sort by highest expense

  // Savings Box calculations
  const s_actualSaved = savingsSummary?.currentMonthSaved || 0;
  const s_salary = savingsSummary?.monthlyIncome || Number(onboardingData.income) || 0;
  const s_savingRate = savingsSummary?.savingRate || 0;
  const s_monthlyGoal = (s_salary * s_savingRate) / 100;
  const savingsProgress = s_monthlyGoal > 0 ? Math.min(100, (s_actualSaved / s_monthlyGoal) * 100) : 0;
  const remainingSavings = Math.max(0, s_monthlyGoal - s_actualSaved);

  if (isLoading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
          direction: dir,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            className="skeleton"
            style={{
              height: 320,
              borderRadius: 24,
              background: "#E2E8F0",
              animation: "pulse 1.5s infinite",
            }}
          />
          <div
            className="skeleton"
            style={{
              height: 300,
              borderRadius: 24,
              background: "#E2E8F0",
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            className="skeleton"
            style={{
              height: 280,
              borderRadius: 24,
              background: "#E2E8F0",
              animation: "pulse 1.5s infinite",
            }}
          />
          <div
            className="skeleton"
            style={{
              height: 340,
              borderRadius: 24,
              background: "#E2E8F0",
              animation: "pulse 1.5s infinite",
            }}
          />
        </div>
        <style>{`
          @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
          @media (max-width: 1024px) {
             div[style*="grid-template-columns: 2fr 1fr"] { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    );
  }

  return (

    <div
      className="animate-fadeIn"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        direction: dir,
        fontFamily: "'Inter', 'Cairo', sans-serif",
        position: "relative",
      }}
    >
      {/* Salary Notification Banner (Top Priority) */}
      {showSalaryBanner && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            background: "linear-gradient(90deg, #065F46 0%, #059669 100%)",
            color: "#FFF",
            padding: "16px 24px",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 10px 25px rgba(5, 150, 105, 0.2)",
            marginBottom: 8,
            animation: "slideDown 0.5s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: 8, borderRadius: 12 }}>
              <Coins size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {!hasAnyIncome
                ? (lang === "ar" 
                    ? "أهلاً بك! هل ترغب في إضافة راتبك الحالي لتبدأ تتبع مصاريفك؟" 
                    : "Welcome! Would you like to add your current salary to start tracking your expenses?")
                : (lang === "ar" 
                    ? "هل استلمت راتبك لهذا الشهر؟" 
                    : "Have you received your salary this month?")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleAddSalary}
              style={{
                background: "#FFF",
                color: "#059669",
                border: "none",
                padding: "8px 16px",
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {lang === "ar" ? "نعم، أضفه للحساب" : "Yes, add to account"}
            </button>
            <button
              onClick={() => setShowSalaryBanner(false)}
              style={{
                background: "transparent",
                color: "#FFF",
                border: "1px solid rgba(255,255,255,0.4)",
                padding: "8px 16px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {lang === "ar" ? "ليس الآن" : "Not now"}
            </button>
          </div>
          <style>{`
            @keyframes slideDown {
              from { transform: translateY(-20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
      {/* Page Header Actions */}
      <div
        style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}
      >
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#059669",
            color: "#FFF",
            border: "none",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Inter', 'Cairo', sans-serif",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(5, 150, 105, 0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#047857";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(5, 150, 105, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#059669";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(5, 150, 105, 0.2)";
          }}
        >
          {dir === "rtl" ? <Plus size={18} /> : null}
          {newTransactionLabel}
          {dir === "ltr" ? <Plus size={18} /> : null}
        </button>
      </div>

      {displayTransactions.length === 0 ? (
        <div
          className="animate-fadeIn"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 20px",
            textAlign: "center",
            background: "#FFFFFF",
            borderRadius: 24,
            border: "1px solid #E2E8F0",
            boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
            flex: 1,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "#F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94A3B8",
              marginBottom: 24,
            }}
          >
            <Wallet size={44} strokeWidth={1.5} />
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0A192F",
              marginBottom: 16,
              maxWidth: 460,
              lineHeight: 1.5,
              fontFamily: "'Manrope', 'Cairo', sans-serif",
              letterSpacing: -0.5,
            }}
          >
            {t("dash_empty_title")}
          </h2>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
              background: "#10B981",
              color: "#FFF",
              border: "none",
              borderRadius: 12,
              padding: "14px 28px",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'Inter', 'Cairo', sans-serif",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#059669";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(16, 185, 129, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#10B981";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 16px rgba(16, 185, 129, 0.25)";
            }}
          >
            {dir === "rtl" ? <Plus size={18} /> : null}
            {t("dash_add_first_btn")}
            {dir === "ltr" ? <Plus size={18} /> : null}
          </button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* ── Main Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Balance Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                border: "1px solid #E2E8F0",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#64748B",
                }}
              >
                {t("dash_balance")}
              </h3>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  color: "#0A192F",
                  margin: "0 0 16px",
                  fontFamily: "'Manrope', sans-serif",
                  letterSpacing: -1,
                }}
              >
                {formatCurrency(totalBalance)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {monthlyChangePercent !== null ? (
                  <span
                    style={{
                      background: isMonthlyPositive ? "#ECFDF5" : "#FEF2F2",
                      color: isMonthlyPositive ? "#10B981" : "#EF4444",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {isMonthlyPositive
                      ? <ArrowUpRight size={14} />
                      : <ArrowDownRight size={14} />}
                    {Math.abs(monthlyChangePercent)}%
                  </span>
                ) : null}
                <span
                  style={{ color: "#94A3B8", fontSize: 13, fontWeight: 500 }}
                >
                  {t("dash_vs_last_month")}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginTop: 40,
                }}
              >
                {/* Income */}
                <div
                  style={{
                    background: "#F8FAFC",
                    borderRadius: 16,
                    padding: 20,
                    transition: "all 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F1F5F9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#F8FAFC")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      margin: "0 0 8px",
                      color: "#64748B",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <ArrowDownRight size={16} color="#10B981" />{" "}
                    {t("dash_income")}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#0A192F",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {formatCurrency(totalIncome)}
                  </div>
                </div>
                {/* Expenses */}
                <div
                  style={{
                    background: "#F8FAFC",
                    borderRadius: 16,
                    padding: 20,
                    transition: "all 0.2s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#F1F5F9")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "#F8FAFC")
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      margin: "0 0 8px",
                      color: "#64748B",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <ArrowUpRight size={16} color="#EF4444" />{" "}
                    {t("dash_expenses")}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#0A192F",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {formatCurrency(totalExpenses)}
                  </div>
                </div>
              </div>
            </div>

            {/* Spending Trends Chart */}
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
                  marginBottom: 32,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0A192F",
                  }}
                >
                  {t("dash_trends")}
                </h3>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowTimeMenu(!showTimeMenu)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#64748B",
                      background: "#F8FAFC",
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F1F5F9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#F8FAFC")
                    }
                  >
                    {timeRange === 30
                      ? t("dash_last_30_days")
                      : t("dash_last_7_days")}{" "}
                    <ChevronDown size={14} />
                  </button>
                  {showTimeMenu && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        [dir === "rtl" ? "left" : "right"]: 0,
                        marginTop: 4,
                        background: "#FFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 10,
                      }}
                    >
                      <div
                        onClick={() => {
                          setTimeRange(7);
                          setShowTimeMenu(false);
                        }}
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          cursor: "pointer",
                          borderBottom: "1px solid #E2E8F0",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F8FAFC")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#FFF")
                        }
                      >
                        {t("dash_last_7_days")}
                      </div>
                      <div
                        onClick={() => {
                          setTimeRange(30);
                          setShowTimeMenu(false);
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F8FAFC")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#FFF")
                        }
                      >
                        {t("dash_last_30_days")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: 260, width: "100%", direction: "ltr" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#94A3B8",
                        fontSize: 12,
                        fontFamily: "'Inter', 'Cairo', sans-serif",
                      }}
                      dy={10}
                    />
                    <YAxis hide />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "none",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        fontFamily: "'Inter', 'Cairo', sans-serif",
                        padding: "12px 16px",
                      }}
                      cursor={{ stroke: '#E2E8F0', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name={t("dash_income")}
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                    <Area
                      type="monotone"
                      dataKey="spend"
                      name={t("dash_expenses")}
                      stroke="#EF4444"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorSpend)"
                      animationDuration={800}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Chart */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                border: "1px solid #E2E8F0",
              }}
            >
              <h3
                style={{
                  margin: "0 0 24px",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0A192F",
                }}
              >
                {t("dash_cat_breakdown")}
              </h3>

              {
                catPieData.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 32,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ width: 200, height: 200 }}>
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        style={{ direction: "ltr" }}
                      >
                        <PieChart>
                          <Pie
                            data={catPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {catPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value, name) => [
                              formatCurrency(value),
                              t(`cat_${name}`),
                            ]}
                            contentStyle={{
                              borderRadius: 12,
                              border: "none",
                              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                              fontFamily: "'Inter', 'Cairo', sans-serif",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 200,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {catPieData.slice(0, 5).map((cat) => (
                        <div
                          key={cat.name}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: cat.color,
                              }}
                            ></span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#64748B",
                              }}
                            >
                              {t(`cat_${cat.name}`)}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0A192F",
                            }}
                          >
                            {formatCurrency(cat.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "40px 0",
                      textAlign: "center",
                      color: "#94A3B8",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {t("dash_no_expenses")}
                  </div>
                )
              }
            </div>
          </div >

          {/* ── Side Column ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Smart Budget AI Card */}
            <div
              style={{
                background: "#F0FDF4",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                border: "1px solid #DCFCE7",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  alignItems: "flex-start",
                  marginBottom: 24,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "#059669",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    <BrainCircuit size={18} /> {t("dash_budget_ai")}
                  </div>
                  <div
                    style={{ color: "#0A192F", fontSize: 13, marginTop: 4 }}
                  >
                    {t("dash_daily_safe")}
                  </div>
                </div>
              </div>

              {/* AI Radial Ring or Confirm Message */}
              {isSalaryConfirmed ? (
                <>
                  <div
                    style={{
                      position: "relative",
                      width: 160,
                      height: 160,
                      marginBottom: 20,
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      style={{ direction: "ltr" }}
                    >
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={75}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                          cornerRadius={10}
                          animationDuration={800}
                          animationEasing="ease-out"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color: "#0A192F",
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        {formatCurrency(aiDailyBudget)}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#64748B",
                          fontWeight: 600,
                        }}
                      >
                        {t("dash_remaining_today")}
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      textAlign: "center",
                      color: monthlyRemaining <= 0 ? "#EF4444" : (budgetRatio > 0.8 ? "#EF4444" : "#0A192F"),
                      fontSize: 13,
                      lineHeight: 1.6,
                      margin: 0,
                      fontWeight: (monthlyRemaining <= 0 || budgetRatio > 0.8) ? 600 : 400,
                    }}
                  >
                    {monthlyRemaining <= 0
                      ? (lang === "ar" ? "لقد استهلكت كل رصيدك المتاح! يرجى مراجعة إنفاقك بعناية" : "You have consumed all your available balance! Please review your spending carefully.")
                      : (budgetRatio > 0.8 ? t("dash_pacing_bad") : t("dash_pacing_good"))}
                  </p>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
                    padding: "20px 0",
                    textAlign: "center"
                  }}
                >
                  <div style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "rgba(5, 150, 105, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#059669"
                  }}>
                    <Wallet size={30} />
                  </div>
                  <p style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#065F46",
                    margin: 0,
                    lineHeight: 1.5,
                    maxWidth: 200
                  }}>
                    {lang === "ar" 
                      ? "يرجى تأكيد استلام الراتب لتفعيل الحساب الذكي" 
                      : "Please confirm salary receipt to activate smart budget"}
                  </p>
                </div>
              )}
            </div>

            {/* Savings Box Card (Refined) */}
            {(!savingsSummary || (savingsSummary.monthlyTarget === 0 && savingsSummary.currentMonthSaved === 0) || hasSkippedSavingsGoal) ? (
              <div
                onClick={() => {
                  setIsEditingSavings(false);
                  setShowSavingsModal(true);
                }}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  padding: "32px",
                  boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  minHeight: 200,
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#10B981";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10B981"
                }}>
                  <Plus size={32} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 16, color: "#0A192F", textAlign: "center" }}>
                  {t("dash_savings_title")}
                </span>
                
                {/* Add funds button at bottom left */}
                <div style={{
                  position: "absolute",
                  bottom: 16,
                  [dir === "rtl" ? "left" : "right"]: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#10B981",
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  <PiggyBank size={14} />
                  <span>{lang === "ar" ? "إضافة أموال للحصالة" : "Add funds to piggy bank"}</span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 24,
                  padding: 32,
                  boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  position: "relative",
                }}
                className="savings-card-hover"
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: "rgba(16, 185, 129, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#10B981",
                      }}
                    >
                      <PiggyBank size={24} />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#0A192F",
                        }}
                      >
                        {t("dash_savings_title")}
                      </h3>
                      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginTop: 2 }}>
                        {new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Percentage removed as per user request */}

                    {/* Three dots menu */}
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setShowSavingsMenu(!showSavingsMenu)}
                        style={{
                          background: "#F8FAFC",
                          border: "none",
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94A3B8",
                          cursor: "pointer",
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {showSavingsMenu && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            [dir === "rtl" ? "left" : "right"]: 0,
                            background: "#FFF",
                            borderRadius: 12,
                            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                            border: "1px solid #E2E8F0",
                            zIndex: 100,
                            minWidth: 120,
                            padding: 8,
                            marginTop: 8,
                          }}
                        >
                          <button
                            onClick={handleOpenEditSavings}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              textAlign: dir === "rtl" ? "right" : "left",
                              background: "none",
                              border: "none",
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0A192F",
                              cursor: "pointer",
                              borderRadius: 8,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            {lang === "ar" ? "تعديل الهدف" : "Edit Goal"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 0" }}>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#0A192F",
                      fontFamily: "'Manrope', sans-serif",
                      letterSpacing: "-0.02em",
                      textAlign: "center"
                    }}
                  >
                    {formatCurrency(savingsSummary?.totalSavings || 0)}
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    color: "#64748B", 
                    fontWeight: 600, 
                    marginTop: 6,
                    textAlign: "center",
                    marginBottom: 16
                  }}>
                    {lang === "ar" ? "إجمالي المبلغ المدخر" : "Total Amount Saved"}
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0A192F" }}>
                        {lang === "ar" ? "التقدم الشهري" : "Monthly Progress"}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#10B981", fontFamily: "'Manrope', sans-serif" }}>
                        {savingsProgress.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div style={{ width: "100%", height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ 
                        width: `${savingsProgress}%`, 
                        height: "100%", 
                        background: "#10B981", 
                        borderRadius: 4,
                        transition: "width 1s ease-in-out"
                      }} />
                    </div>
                    
                    <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, textAlign: dir === "rtl" ? "right" : "left" }}>
                      {lang === "ar" ? "المتبقي للهدف:" : "Remaining for goal:"} <span style={{ color: "#0A192F", fontWeight: 700, fontFamily: "'Manrope', sans-serif" }}>{new Intl.NumberFormat("en-US", { style: "currency", currency: onboardingData.currency || "USD" }).format(remainingSavings)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Transactions Card */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                border: "1px solid #E2E8F0",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0A192F",
                  }}
                >
                  {t("dash_recent")}
                </h3>
                <button
                  onClick={() => navigate("/transactions")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#10B981",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Inter', 'Cairo', sans-serif",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.7)}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
                >
                  {t("dash_view_all")}
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  flex: 1,
                }}
              >
                {displayTransactions.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "32px 0",
                      textAlign: "center",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94A3B8",
                        marginBottom: 16,
                      }}
                    >
                      <Wallet size={32} />
                    </div>
                    <p
                      style={{
                        color: "#64748B",
                        fontSize: 14,
                        fontWeight: 500,
                        lineHeight: 1.6,
                        maxWidth: 200,
                      }}
                    >
                      {t("dash_empty_tx")}
                    </p>
                  </div>
                ) : (
                  displayTransactions.slice(0, 4).map((tx) => {
                    const catStyle =
                      CAT_COLORS[tx.category] || CAT_COLORS.default;
                    const IconComp = CAT_ICONS[tx.category?.toLowerCase()] || (tx.type === "income" ? Briefcase : ShoppingCart);

                    return (
                      <div
                        key={tx.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          padding: "12px 0",
                          borderBottom: "1px solid #F8FAFC",
                          transition: "background 0.2s",
                          borderRadius: 8,
                          cursor: "default",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F8FAFC")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: catStyle.bg,
                            color: catStyle.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IconComp size={20} strokeWidth={2.5} />
                        </div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "#0A192F",
                              marginBottom: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {tx.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#94A3B8",
                              fontWeight: 500,
                            }}
                          >
                            {t(`cat_${tx.category}`)} • {tx.date}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 800,
                            fontFamily: "'Manrope', sans-serif",
                            color: tx.type === "expense" || tx.amount < 0 ? "#0A192F" : "#10B981",
                          }}
                        >
                          {tx.type === "expense" || tx.amount < 0 ? "-" : "+"}
                          {formatCurrency(Math.abs(tx.amount))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Financial Goals Progress */}
            <div
              onClick={() => navigate("/goals")}
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                padding: 32,
                boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
                border: "1px solid #E2E8F0",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 15px 45px rgba(10,25,47,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 10px 40px rgba(10,25,47,0.03)";
              }}
            >
              <h3
                style={{
                  margin: "0 0 24px",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#0A192F",
                }}
              >
                {t("dash_financial_goals")}
              </h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#0A192F",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <GoalIcon size={16} color="#64748B" />
                    {mainGoal.name}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: "#10B981",
                    }}
                  >
                    {goalProgress.toFixed(1)}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div
                  style={{
                    width: "100%",
                    height: 10,
                    background: "#F1F5F9",
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                >
                  {/* Progress Fill */}
                  <div
                    style={{
                      width: `${goalProgress}%`,
                      height: "100%",
                      background: "#10B981",
                      borderRadius: 5,
                      transition: "width 1s ease-in-out",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748B",
                      fontWeight: 600,
                    }}
                  >
                    {t("dash_goal_saved")}:{" "}
                    <span style={{ color: "#0A192F", fontWeight: 700 }}>
                      {formatCurrency(savedAmount)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748B",
                      fontWeight: 600,
                    }}
                  >
                    {t("dash_goal_remaining")}:{" "}
                    <span style={{ color: "#0A192F", fontWeight: 700 }}>
                      {formatCurrency(
                        Math.max(0, targetAmount - savedAmount),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <AddTransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={async () => {
          const txData = await fetchTransactions();
          setTransactions(Array.isArray(txData) ? txData : getTransactions());
        }}
      />
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
        
        .savings-card-hover .savings-more-btn {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .savings-card-hover:hover .savings-more-btn {
          opacity: 1;
        }
        @media (max-width: 1024px) {
          .savings-card-hover .savings-more-btn {
            opacity: 1;
          }
        }
      `}</style>
      {/* Savings Box Modal (Amount-based) */}
      {showSavingsModal && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 25, 47, 0.65)", // Premium Backdrop
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 20,
            direction: dir,
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div
            style={{
              background: "#FFF",
              borderRadius: 28,
              width: "100%",
              maxWidth: 420,
              padding: "40px 32px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              textAlign: "center",
              animation: "modalZoom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.1)",
                color: "#10B981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <PiggyBank size={32} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0A192F", marginBottom: 8 }}>
                {isEditingSavings 
                  ? (lang === "ar" ? "تحديد هدف الادخار" : "Set Savings Goal")
                  : (lang === "ar" ? "إيداع في الحصالة" : "Piggy Bank Deposit")
                }
              </h3>
              <div style={{ 
                display: "inline-block", 
                padding: "6px 12px", 
                borderRadius: 10, 
                background: "#F0FDF4", 
                color: "#10B981", 
                fontSize: 14, 
                fontWeight: 700 
              }}>
                {lang === "ar" ? "رصيدك الحالي: " : "Current Balance: "}
                {formatCurrency(totalBalance)}
              </div>
            </div>

            <div style={{ textAlign: dir === "rtl" ? "right" : "left", marginBottom: 32 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#64748B", marginBottom: 12 }}>
                {isEditingSavings
                  ? (lang === "ar" ? "كم هو هدفك للتوفير هذا الشهر؟" : "What is your savings goal for this month?")
                  : (lang === "ar" ? "كم تريد الإيداع الآن؟" : "How much do you want to deposit now?")
                }
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={savingsAmount || ""}
                  onChange={(e) => {
                    // Allow only English digits
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setSavingsAmount(val ? Number(val) : 0);
                  }}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 16,
                    border: "2px solid #E2E8F0",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#0A192F",
                    outline: "none",
                    transition: "border-color 0.2s",
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box",
                    textAlign: "center"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#10B981")}
                  onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                />
                <div style={{
                  position: "absolute",
                  [dir === "rtl" ? "left" : "right"]: 20,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#94A3B8",
                }}>
                  {onboardingData.currency || "₪"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleSavingsConfirm}
                disabled={isSavingsLoading || !savingsAmount}
                style={{
                  flex: 1,
                  background: "#10B981",
                  color: "#FFF",
                  border: "none",
                  padding: "16px",
                  borderRadius: 16,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: (isSavingsLoading || !savingsAmount) ? 0.7 : 1,
                  boxShadow: "0 10px 20px rgba(16,185,129,0.2)"
                }}
              >
                {isSavingsLoading
                  ? (lang === "ar" ? "جاري الحفظ..." : "Saving...")
                  : (lang === "ar" ? "تأكيد الحفظ" : "Confirm Savings")}
              </button>
              <button
                onClick={() => {
                  setShowSavingsModal(false);
                  setIsEditingSavings(false);
                }}
                disabled={isSavingsLoading}
                style={{
                  flex: 0.5,
                  background: "#F1F5F9",
                  color: "#64748B",
                  border: "none",
                  padding: "16px",
                  borderRadius: 16,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


