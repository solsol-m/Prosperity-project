import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { fetchDashboardSummary } from "../services/dashboardService";
import { fetchTransactions, getOnboardingData } from "../services/transactionService";
import { fetchGoals } from "../services/goalService";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown, TrendingUp, Minus, AlertTriangle, ShieldCheck, Lightbulb } from "lucide-react";

const cv = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const iv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } };

const CATEGORY_META = {
  food:          { ar: "طعام ومطاعم",    en: "Food & Dining",    color: "#F43F5E" },
  shopping:      { ar: "تسوق",           en: "Shopping",         color: "#3B82F6" },
  transport:     { ar: "مواصلات",        en: "Transport",        color: "#10B981" },
  housing:       { ar: "سكن وإيجار",     en: "Housing & Rent",   color: "#8B5CF6" },
  utilities:     { ar: "فواتير",         en: "Utilities",        color: "#F59E0B" },
  entertainment: { ar: "ترفيه",          en: "Entertainment",    color: "#EC4899" },
  investment:    { ar: "توفير واستثمار", en: "Savings & Invest", color: "#06B6D4" },
};

const GOAL_NAMES = {
  "Buy a car": "شراء سيارة", "Emergency Fund": "صندوق الطوارئ",
  "Buy a house": "شراء منزل", "Vacation": "عطلة",
  "Education": "تعليم", "Retirement": "تقاعد", "Travel": "سفر",
};

function SkeletonCard({ h = 120 }) {
  return (
    <div style={{
      height: h, borderRadius: 16,
      background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)",
      backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
      border: "1px solid #E2E8F0",
    }} />
  );
}

export default function AIInsights() {
  const { dir, lang } = useLanguage();
  const [summary, setSummary]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const onboarding = getOnboardingData();

  useEffect(() => {
    let dead = false;
    Promise.all([
      fetchDashboardSummary(50, 6),
      fetchTransactions(),
      fetchGoals(),
    ]).then(([s, txs, gs]) => {
      if (dead) return;
      setSummary(s);
      setTransactions(Array.isArray(txs) ? txs : []);
      setGoals(Array.isArray(gs) ? gs : []);
      setLoading(false);
    });
    return () => { dead = true; };
  }, []);

  // ── Currency ─────────────────────────────────────────────────
  const currency   = localStorage.getItem("preferred_currency") || onboarding.currency || "ILS";
  const currSymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₪";
  const fmt = (v) => {
    const n = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.abs(Number(v) || 0));
    return lang === "ar" ? `${n} ${currSymbol}` : `${currSymbol}${n}`;
  };

  // ── Totals — from transactions so savings deposits are counted ─
  const incomeFromTxs   = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + Math.abs(t.amount), 0), [transactions]);
  const expensesFromTxs = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0), [transactions]);
  const income   = transactions.length > 0 ? incomeFromTxs   : Number(summary?.totalIncome   ?? onboarding.income ?? 0);
  const expenses = transactions.length > 0 ? expensesFromTxs : Number(summary?.totalExpenses ?? 0);
  const balance  = income - expenses;

  // ── Active goal ───────────────────────────────────────────────
  const topGoal  = goals[0] || null;
  const goalName = topGoal
    ? (lang === "ar" ? (GOAL_NAMES[topGoal.name] || topGoal.name) : topGoal.name)
    : (lang === "ar" ? "لا يوجد أهداف" : "No goals yet");

  // ── Monthly comparison ────────────────────────────────────────
  const monthlyOverview = summary?.monthlyOverview || [];
  const currentMonth    = monthlyOverview[monthlyOverview.length - 1] || null;
  const previousMonth   = monthlyOverview[monthlyOverview.length - 2] || null;
  const curExp  = currentMonth?.expenses  ?? 0;
  const prevExp = previousMonth?.expenses ?? 0;
  const curInc  = currentMonth?.income    ?? 0;
  const prevInc = previousMonth?.income   ?? 0;
  const expTrend = curExp > prevExp ? "up" : curExp < prevExp ? "down" : "neutral";
  const incTrend = curInc > prevInc ? "up" : curInc < prevInc ? "down" : "neutral";

  // ── Category breakdown ────────────────────────────────────────
  const categoryTotals = useMemo(() => {
    const expTxs   = transactions.filter(t => t.type === "expense");
    const totalAmt = expTxs.reduce((s, t) => s + Math.abs(t.amount), 0);
    const map = {};
    expTxs.forEach(t => {
      const k = t.category || "shopping";
      map[k] = (map[k] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map)
      .map(([cat, amt]) => ({
        cat, amt,
        pct:  totalAmt > 0 ? Math.round((amt / totalAmt) * 100) : 0,
        meta: CATEGORY_META[cat] || { ar: cat, en: cat, color: "#64748B" },
      }))
      .sort((a, b) => b.amt - a.amt);
  }, [transactions]);

  const top3    = categoryTotals.slice(0, 3);
  const pieData = useMemo(() =>
    categoryTotals.slice(0, 6).map(c => ({
      name:  lang === "ar" ? c.meta.ar : c.meta.en,
      value: c.pct,
      color: c.meta.color,
    })),
  [categoryTotals, lang]);

  // ── Alerts ────────────────────────────────────────────────────
  const alerts = categoryTotals.filter(c => c.pct >= 40);

  // ── Financial Score ───────────────────────────────────────────
  const score = useMemo(() => {
    let s = 40;
    if (income > 0) {
      const r = expenses / income;
      if (r <= 0.5) s += 30; else if (r <= 0.7) s += 20; else if (r <= 0.9) s += 10;
    }
    if (topGoal) s += 15;
    if (alerts.length === 0) s += 15;
    return Math.min(s, 100);
  }, [income, expenses, topGoal, alerts]);

  const scoreLabel = score >= 80
    ? { ar: "أداء ممتاز 🌟",         en: "Excellent 🌟",          color: "#10B981" }
    : score >= 60
    ? { ar: "أداء جيد 👍",           en: "Good 👍",               color: "#F59E0B" }
    : { ar: "يحتاج تحسين ⚠️",       en: "Needs Improvement ⚠️",  color: "#F43F5E" };

  const scoreMsg = score >= 80
    ? { ar: "أداؤك المالي ممتاز! استمر في إدارة مصاريفك بذكاء وستحقق أهدافك قريباً.", en: "Excellent financial management! Keep it up and you'll reach your goals soon." }
    : score >= 60
    ? { ar: "أداؤك جيد ولكن هناك مجال للتحسين. حاول تقليل المصاريف غير الضرورية.", en: "Good performance, but there is room for improvement. Try cutting unnecessary expenses." }
    : { ar: "مصاريفك تتجاوز دخلك. راجع ميزانيتك وحدد فئات التوفير بشكل عاجل.", en: "Your expenses exceed your income. Urgently review your budget." };

  // ── Actionable tip ────────────────────────────────────────────
  const topCat = categoryTotals[0];
  const actionableTip = topCat
    ? lang === "ar"
      ? `الفئة الأعلى إنفاقاً لديك هي "${topCat.meta.ar}" بنسبة ${topCat.pct}% من مصاريفك. تخفيض هذه الفئة بنسبة 20% سيوفر لك ${fmt(topCat.amt * 0.2)} شهرياً.`
      : `Your top spending category is "${topCat.meta.en}" at ${topCat.pct}% of expenses. Cutting it by 20% saves you ${fmt(topCat.amt * 0.2)} monthly.`
    : lang === "ar"
    ? "أضف بعض المعاملات لرؤية نصائح مخصصة بناءً على أنماط إنفاقك."
    : "Add some transactions to see tips tailored to your spending patterns.";

  // ── Shared styles ─────────────────────────────────────────────
  const card    = { background: "#FFFFFF", borderRadius: 16, padding: 24, border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(10,25,47,0.05)" };
  const titleSt = { margin: "0 0 18px", fontSize: 16, fontWeight: 700, color: "#0A192F", fontFamily: "'Manrope','Cairo',sans-serif" };

  const TrendIcon = ({ t }) =>
    t === "up" ? <TrendingUp size={17} /> : t === "down" ? <TrendingDown size={17} /> : <Minus size={17} />;
  const tColor = (t, isExp) =>
    t === "neutral" ? "#64748B" : isExp ? (t === "up" ? "#F43F5E" : "#10B981") : (t === "up" ? "#10B981" : "#F43F5E");

  const G16 = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 };

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .month-row { transition: background 0.2s ease; cursor: default; }
        .month-row:hover { background: #EFF6FF !important; }
        .alert-row { transition: background 0.2s ease; cursor: default; }
        .alert-row:hover { background: #FEF3C7 !important; border-color: #FCD34D !important; }
      `}</style>
      <motion.div variants={cv} initial="hidden" animate="visible"
        style={{ display: "flex", flexDirection: "column", gap: 20, direction: dir, fontFamily: "'Inter','Cairo',sans-serif" }}>

        {/* Header */}
        <motion.div variants={iv}>
          <h1 style={{ margin: "0 0 5px", fontSize: 26, fontWeight: 800, color: "#0A192F", fontFamily: "'Manrope','Cairo',sans-serif", letterSpacing: -0.5 }}>
            {lang === "ar" ? "رؤى الذكاء الاصطناعي" : "AI Insights"}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#64748B" }}>
            {lang === "ar" ? "تحليل حقيقي مبني على معاملاتك الفعلية." : "Real analysis computed from your actual transactions."}
          </p>
        </motion.div>

        {loading ? (
          <motion.div variants={cv} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              {[1,2,3,4].map(i => <SkeletonCard key={i} h={100} />)}
            </div>
            <div style={G16}>{[1,2,3,4].map(i => <SkeletonCard key={i} h={280} />)}</div>
          </motion.div>
        ) : (
          <>
            {/* ── Summary Cards (4 columns) ── */}
            <motion.div variants={cv}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
              {[
                { id: "bal",  label: lang === "ar" ? "الرصيد الحالي"    : "Current Balance", value: fmt(balance),  accent: "#10B981" },
                { id: "inc",  label: lang === "ar" ? "إجمالي الدخل"     : "Total Income",    value: fmt(income),   accent: "#3B82F6" },
                { id: "exp",  label: lang === "ar" ? "إجمالي المصروفات" : "Total Expenses",  value: fmt(expenses), accent: "#F43F5E" },
                { id: "goal", label: lang === "ar" ? "الهدف النشط"      : "Active Goal",     value: goalName,      accent: "#8B5CF6" },
              ].map(c => (
                <motion.div key={c.id} variants={iv}
                  whileHover={{ boxShadow: "0 8px 24px rgba(10,25,47,0.09)", y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  style={{ ...card, borderTop: `3px solid ${c.accent}`, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0A192F", fontFamily: "'Manrope','Cairo',sans-serif", wordBreak: "break-word" }}>{c.value}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Row 1: Pie Chart + Monthly Comparison ── */}
            <motion.div variants={cv} style={G16}>

              <motion.div variants={iv} style={card}>
                <h3 style={titleSt}>{lang === "ar" ? "توزيع المصاريف حسب الفئة" : "Expense Breakdown by Category"}</h3>
                {pieData.length === 0 ? (
                  <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 14 }}>
                    {lang === "ar" ? "لا توجد بيانات كافية بعد" : "No data available yet"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="45%" innerRadius={48} outerRadius={76} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontWeight: 600, fontSize: 13 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle"
                        formatter={(v) => <span style={{ color: "#334155", fontWeight: 600, fontSize: 12 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              <motion.div variants={iv} style={card}>
                <h3 style={titleSt}>{lang === "ar" ? "مقارنة الشهر الحالي بالسابق" : "Current vs Previous Month"}</h3>
                {!currentMonth ? (
                  <div style={{ color: "#94A3B8", fontSize: 14 }}>
                    {lang === "ar" ? "لا توجد بيانات شهرية متاحة بعد." : "No monthly data available yet."}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: lang === "ar" ? "المصروفات" : "Expenses", cur: curExp, prev: prevExp, trend: expTrend, isExp: true  },
                      { label: lang === "ar" ? "الدخل"     : "Income",   cur: curInc, prev: prevInc, trend: incTrend, isExp: false },
                    ].map((row, i) => (
                      <div key={i} className="month-row" style={{ padding: 14, background: "#F8FAFC", borderRadius: 12, border: "1px solid #F1F5F9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#0A192F" }}>{row.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, color: tColor(row.trend, row.isExp), fontWeight: 700, fontSize: 13, direction: "ltr" }}>
                            <TrendIcon t={row.trend} />
                            <span>{row.cur > 0 || row.prev > 0 ? fmt(Math.abs(row.cur - row.prev)) : "—"}</span>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: "#64748B" }}>
                          <span style={{ fontWeight: 700, color: "#0A192F" }}>{fmt(row.cur)}</span>
                          <span style={{ margin: "0 8px", opacity: 0.4 }}>{lang === "ar" ? "مقابل" : "vs"}</span>
                          <span>{fmt(row.prev)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* ── Row 2: Top Categories + Alerts ── */}
            <motion.div variants={cv} style={G16}>

              <motion.div variants={iv} style={card}>
                <h3 style={titleSt}>{lang === "ar" ? "أين تذهب أموالك؟" : "Where Does Your Money Go?"}</h3>
                {top3.length === 0 ? (
                  <div style={{ color: "#94A3B8", fontSize: 14 }}>{lang === "ar" ? "لا توجد معاملات مصروفات بعد." : "No expense transactions yet."}</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {top3.map((c, i) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.meta.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 14, fontWeight: 700, color: "#0A192F" }}>
                              {lang === "ar" ? c.meta.ar : c.meta.en}
                            </span>
                          </div>
                          <div style={{ textAlign: "end" }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#0A192F", display: "block", direction: "ltr" }}>{fmt(c.amt)}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: c.meta.color }}>{c.pct}%</span>
                          </div>
                        </div>
                        <div style={{ width: "100%", height: 7, background: "#F1F5F9", borderRadius: 8, overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${c.pct}%` }}
                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 + i * 0.15 }}
                            style={{ height: "100%", background: c.meta.color, borderRadius: 8 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              <motion.div variants={iv} style={card}>
                <h3 style={titleSt}>{lang === "ar" ? "تنبيهات الإنفاق" : "Spending Alerts"}</h3>
                {alerts.length === 0 ? (
                  <div style={{ display: "flex", gap: 12, padding: 16, background: "#F0FDF4", borderRadius: 12, border: "1px solid #BBF7D0" }}>
                    <ShieldCheck size={22} color="#10B981" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 14, color: "#065F46", fontWeight: 700 }}>
                        {lang === "ar" ? "مصاريفك متوازنة!" : "Your spending is balanced!"}
                      </p>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "#047857", lineHeight: 1.5 }}>
                        {lang === "ar" ? "لا توجد فئة تستهلك أكثر من 40% من مصاريفك." : "No single category exceeds 40% of your expenses."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {alerts.map((a, i) => (
                      <div key={i} className="alert-row" style={{ display: "flex", gap: 12, padding: 16, background: "#FFF7ED", borderRadius: 12, border: "1px solid #FED7AA" }}>
                        <AlertTriangle size={21} color="#EA580C" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#9A3412" }}>
                            {lang === "ar" ? `فئة "${a.meta.ar}" مرتفعة` : `"${a.meta.en}" is high`}
                          </p>
                          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#C2410C", lineHeight: 1.5 }}>
                            {lang === "ar"
                              ? `تمثل ${a.pct}% من مصاريفك (${fmt(a.amt)}).`
                              : `${a.pct}% of expenses (${fmt(a.amt)}).`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* ── Actionable Tip (full width) ── */}
            <motion.div variants={iv}
              whileHover={{ boxShadow: "0 8px 28px rgba(124,58,237,0.13)", y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ ...card, display: "flex", gap: 14, padding: "16px 20px", background: "#F5F3FF", border: "1px solid #EDE9FE", cursor: "default" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Lightbulb size={20} color="#7C3AED" />
              </div>
              <div>
                <h4 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#5B21B6" }}>
                  {lang === "ar" ? "نصيحة مخصصة بناءً على بياناتك" : "Personalized Tip"}
                </h4>
                <p style={{ margin: 0, fontSize: 14, color: "#6D28D9", lineHeight: 1.6 }}>
                  {actionableTip}
                </p>
              </div>
            </motion.div>

            {/* ── Financial Score (full width) ── */}
            <motion.div variants={iv}
              style={{ ...card, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
                <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="55" cy="55" r="46" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                  <motion.circle
                    cx="55" cy="55" r="46" fill="none"
                    stroke={scoreLabel.color} strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 46}
                    initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - score / 100) }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "#0A192F", fontFamily: "'Manrope',sans-serif" }}>{score}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>/ 100</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <ShieldCheck size={20} color={scoreLabel.color} />
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0A192F", fontFamily: "'Manrope','Cairo',sans-serif" }}>
                    {lang === "ar" ? "التقييم المالي الشامل" : "Financial Score"}
                  </h3>
                </div>
                <div style={{ display: "inline-block", background: `${scoreLabel.color}18`, color: scoreLabel.color, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  {lang === "ar" ? scoreLabel.ar : scoreLabel.en}
                </div>
                <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.65 }}>
                  {lang === "ar" ? scoreMsg.ar : scoreMsg.en}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </>
  );
}
