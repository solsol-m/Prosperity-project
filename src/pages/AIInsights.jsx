import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { fetchDashboardSummary } from "../services/dashboardService";
import { fetchGoals } from "../services/goalService";
import { getOnboardingData } from "../services/transactionService";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function AIInsights() {
  const { dir, lang } = useLanguage();
  const [summary, setSummary] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const onboardingData = getOnboardingData();

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchDashboardSummary(10, 6), fetchGoals()]).then(
      ([summaryData, goalsData]) => {
        if (!cancelled) {
          setSummary(summaryData);
          setGoals(Array.isArray(goalsData) ? goalsData : []);
          setLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const baseIncome = Number(onboardingData.income || 0);
  const income = Number(summary?.totalIncome ?? baseIncome);
  const expenses = Number(summary?.totalExpenses ?? 0);
  const balance = Number(summary?.totalBalance ?? Math.max(0, income - expenses));
  const topGoal = goals[0] || null;
  const formatCurrency = (val) =>
    new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency: onboardingData.currency || "USD",
      minimumFractionDigits: 2,
    }).format(val);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        direction: dir,
        fontFamily: "'Inter', 'Cairo', sans-serif",
      }}
    >
      <motion.div variants={cardVariants}>
        <div>
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
            {lang === "ar" ? "رؤى الذكاء الاصطناعي" : "AI Insights"}
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "#64748B" }}>
            {lang === "ar"
              ? "ملخص سريع يساعدك على فهم وضعك المالي الحالي."
              : "A quick summary to understand your current financial situation."}
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: 140,
                border: "1px solid #E2E8F0",
                background: "#E2E8F0",
                boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
              }}
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
          }}
        >
          {[
            {
              id: "balance",
              title: lang === "ar" ? "الرصيد الحالي" : "Current Balance",
              value: formatCurrency(balance),
            },
            {
              id: "income",
              title: lang === "ar" ? "إجمالي الدخل" : "Total Income",
              value: formatCurrency(income),
            },
            {
              id: "expenses",
              title: lang === "ar" ? "إجمالي المصروفات" : "Total Expenses",
              value: formatCurrency(expenses),
            },
            {
              id: "goal",
              title: lang === "ar" ? "الهدف النشط" : "Active Goal",
              value: topGoal ? topGoal.name : lang === "ar" ? "لا يوجد أهداف بعد" : "No goals yet",
            },
          ].map((card) => (
            <motion.div
              key={card.id}
              variants={cardVariants}
              style={{
                background: "#FFFFFF",
                borderRadius: 24,
                padding: 24,
                border: "1px solid #E2E8F0",
                boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginBottom: 10 }}>
                {card.title}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0A192F",
                  fontFamily: "'Manrope', 'Cairo', sans-serif",
                  wordBreak: "break-word",
                }}
              >
                {card.value}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
