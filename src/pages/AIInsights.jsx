import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { fetchDashboardSummary } from "../services/dashboardService";
import { fetchGoals } from "../services/goalService";
import { getOnboardingData } from "../services/transactionService";

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
    <div
      className="animate-fadeIn"
      style={{ padding: 24, direction: dir, fontFamily: "'Cairo', sans-serif" }}
    >
      <h2 style={{ color: "#0A192F" }}>رؤى الذكاء الاصطناعي</h2>
      {loading ? (
        <p style={{ color: "#64748B" }}>
          {lang === "ar" ? "جاري تحميل البيانات..." : "Loading insights..."}
        </p>
      ) : (
        <div style={{ color: "#64748B", lineHeight: 1.8 }}>
          <p>
            {lang === "ar" ? "الرصيد الحالي:" : "Current Balance:"}{" "}
            <strong style={{ color: "#0A192F" }}>{formatCurrency(balance)}</strong>
          </p>
          <p>
            {lang === "ar" ? "إجمالي الدخل:" : "Total Income:"}{" "}
            <strong style={{ color: "#0A192F" }}>{formatCurrency(income)}</strong>
          </p>
          <p>
            {lang === "ar" ? "إجمالي المصروفات:" : "Total Expenses:"}{" "}
            <strong style={{ color: "#0A192F" }}>{formatCurrency(expenses)}</strong>
          </p>
          <p>
            {lang === "ar" ? "الهدف النشط:" : "Active Goal:"}{" "}
            <strong style={{ color: "#0A192F" }}>
              {topGoal ? topGoal.name : lang === "ar" ? "لا يوجد أهداف بعد" : "No goals yet"}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
