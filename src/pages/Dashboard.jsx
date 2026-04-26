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
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  getTransactions,
  addTransaction,
  getOnboardingData,
} from "../services/transactionService";
import AddTransactionModal from "../components/AddTransactionModal";
import {
  Utensils,
  Fuel,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  BrainCircuit,
  ChevronDown,
  Wallet,
  Zap,
  Film,
  X,
  ShoppingCart,
  Building,
  Bus,
  Coins,
  TrendingUp,
  Gift,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
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
  shopping: ShoppingCart,
  utilities: Zap,
  entertainment: Film,
  salary: Coins,
  freelance: Briefcase,
  bonus: Gift,
  investment: TrendingUp,
  groceries: ShoppingCart,
  income: Coins,
};

const CAT_COLORS = {
  food: { color: "#EA580C", bg: "#FFF7ED" },
  transport: { color: "#64748B", bg: "#F1F5F9" },
  housing: { color: "#3B82F6", bg: "#EFF6FF" },
  shopping: { color: "#EC4899", bg: "#FDF2F8" },
  utilities: { color: "#F59E0B", bg: "#FFFBEB" },
  entertainment: { color: "#8B5CF6", bg: "#F5F3FF" },
  salary: { color: "#10B981", bg: "#ECFDF5" },
  freelance: { color: "#16A34A", bg: "#F0FDF4" },
  bonus: { color: "#CA8A04", bg: "#FEF9C3" },
  investment: { color: "#2563EB", bg: "#EFF6FF" },
  groceries: { color: "#16A34A", bg: "#F0FDF4" },
  income: { color: "#10B981", bg: "#ECFDF5" },
  default: { color: "#94A3B8", bg: "#F8FAFC" },
};

export default function Dashboard() {
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // ── حالة المكون ─────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [timeRange, setTimeRange] = useState(7); // نطاق زمني افتراضي: 7 أيام
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ── تحميل البيانات من transactionService ────────────────────
  // TODO (أنيس): استبدل getTransactions() بـ API call عند الربط
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    setTransactions(getTransactions());
    return () => clearTimeout(timer);
  }, []);

  // ── بيانات الـ Onboarding (الدخل الأساسي، العملة) ───────────
  // TODO (أنيس): استبدل بـ API call: GET /api/user/profile
  const onboardingData = getOnboardingData();
  const currencySymbol =
    onboardingData.currency === "ILS"
      ? "₪"
      : onboardingData.currency === "JOD"
        ? "د.أ"
        : "$";

  // Filter transactions by timeRange
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - timeRange);

  const filteredTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate >= pastDate && txDate <= now;
  });

  // Calculate Totals
  const addedIncome = filteredTxs
    .filter((t) => t.amount > 0)
    .reduce((acc, t) => acc + t.amount, 0);
  const addedExpenses = filteredTxs
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const baseIncome = onboardingData.income ? Number(onboardingData.income) : 0;
  const totalIncome = baseIncome + addedIncome;
  const totalExpenses = addedExpenses;
  const totalBalance = totalIncome - totalExpenses;

  // Chart Data (Grouped by Day)
  const chartData = [];
  // For 7 days, show 7 bars. For 30 days, showing 30 bars is fine in Recharts.
  for (let i = timeRange - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const daySpend = filteredTxs
      .filter((t) => t.date === dateStr && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    chartData.push({
      day: t(`day_${d.getDay() + 1}`),
      spend: daySpend,
    });
  }

  // AI Budget Data (Daily)
  const dailyBudget = totalIncome / 30;
  // Get expenses just for today
  const todayStr = new Date().toISOString().split("T")[0];
  const spentToday = transactions
    .filter((t) => t.date === todayStr && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const remainingToday = Math.max(0, dailyBudget - spentToday);
  const budgetRatio = dailyBudget > 0 ? spentToday / dailyBudget : 0;
  const budgetColor = budgetRatio > 0.8 ? "#EF4444" : "#10B981";

  const pieData = [
    { name: "Spent", value: spentToday, color: budgetColor },
    { name: "Remaining", value: remainingToday, color: "#F1F5F9" },
  ];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: onboardingData.currency || "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Calculate Category Breakdown (Expenses Only)
  const categoryData = filteredTxs
    .filter((tx) => tx.amount < 0)
    .reduce((acc, tx) => {
      const cat = tx.category || "default";
      acc[cat] = (acc[cat] || 0) + Math.abs(tx.amount);
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

  // Goal Progress Calculation
  const goalKey = onboardingData.goal || "emergency";
  const goalTargets = {
    car: 50000,
    home: 250000,
    travel: 10000,
    emergency: 20000,
    other: 15000,
  };
  const targetAmount = goalTargets[goalKey] || 50000;

  const savedAmount = Math.max(0, totalBalance);
  const goalProgress = Math.min(100, (savedAmount / targetAmount) * 100);

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
    <>
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
            {t("dash_new_trans")}
            {dir === "ltr" ? <Plus size={18} /> : null}
          </button>
        </div>

        {transactions.length === 0 ? (
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
                  <span
                    style={{
                      background: "#ECFDF5",
                      color: "#10B981",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ArrowUpRight size={14} /> 2.4%
                  </span>
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
                          style={{
                            padding: "10px 16px",
                            fontSize: 13,
                            cursor: "pointer",
                            transition: "background 0.2s",
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

                <div style={{ height: 240, width: "100%", direction: "ltr" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
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
                      <RechartsTooltip
                        cursor={{ fill: "#F8FAFC", radius: 4 }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                          fontFamily: "'Inter', 'Cairo', sans-serif",
                        }}
                        formatter={(value) => [
                          `${currencySymbol}${value.toLocaleString()}`,
                          t("dash_expenses"),
                        ]}
                      />
                      <Bar dataKey="spend" radius={[6, 6, 6, 6]}>
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.spend > 0 ? "#10B981" : "#DBEAFE"}
                            style={{
                              transition: "fill 0.2s",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </Bar>
                    </BarChart>
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

                {catPieData.length > 0 ? (
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
                )}
              </div>
            </div>

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

                {/* AI Radial Ring */}
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
                        animationDuration={1000}
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
                      {formatCurrency(remainingToday)}
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
                    color: budgetRatio > 0.8 ? "#EF4444" : "#0A192F",
                    fontSize: 13,
                    lineHeight: 1.6,
                    margin: 0,
                    fontWeight: budgetRatio > 0.8 ? 600 : 400,
                  }}
                >
                  {budgetRatio > 0.8
                    ? t("dash_pacing_bad")
                    : t("dash_pacing_good")}
                </p>
              </div>

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
                  {filteredTxs.length === 0 ? (
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
                    filteredTxs.slice(0, 4).map((tx) => {
                      const catStyle =
                        CAT_COLORS[tx.category] || CAT_COLORS.default;
                      const IconComp = CAT_ICONS[tx.category] || Coins;

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
                              color: tx.amount < 0 ? "#0A192F" : "#10B981",
                              flexShrink: 0,
                            }}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {formatCurrency(tx.amount)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Financial Goals Progress */}
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
                      }}
                    >
                      {t(`goal_${goalKey}`)}
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
      </div>
      <AddTransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setTransactions(getTransactions())}
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
      `}</style>
    </>
  );
}
