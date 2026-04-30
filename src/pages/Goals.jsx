import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchGoals,
  createGoal,
  modifyGoal,
  removeGoal,
  addFundsToGoal,
} from "../services/goalService";
import { getTransactions, getOnboardingData } from "../services/transactionService";
import {
  ShieldAlert,
  Car,
  Plane,
  Home,
  Target,
  Plus,
  X,
  MoreVertical,
  AlertTriangle,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ar, enUS } from "date-fns/locale";

const GOAL_ICONS = {
  emergency: ShieldAlert,
  car: Car,
  travel: Plane,
  home: Home,
  other: Target,
};

const PRIORITY_LABELS = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
};

export default function Goals() {
  const { lang, dir } = useLanguage();
  const onboardingData = getOnboardingData();
  const localTxs = getTransactions();
  const baseIncome = onboardingData.income ? Number(onboardingData.income) : 5000;
  const initialBalance = Number(onboardingData.initialBalance || 0);
  const expensesOnly = localTxs
    .filter((t) => t.type === "expense" || (t.type !== "income" && t.amount < 0))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const initialMonthlySavings = Math.max(100, baseIncome - expensesOnly);
  const addedIncome = localTxs
    .filter((t) => t.type === "income" || (t.type !== "expense" && t.amount > 0))
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  // الرصيد الصحيح: رصيد البداية + مجموع الدخل الفعلي من المعاملات - المصروفات
  // (بدون إضافة baseIncome لتجنب الازدواجية مع معاملات الراتب)
  const initialTotalBalance = initialBalance + addedIncome - expensesOnly;

  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [monthlySavings] = useState(initialMonthlySavings);
  const [currency] = useState(onboardingData.currency || "USD");
  const [totalBalance, setTotalBalance] = useState(initialTotalBalance);
  const [addFundsGoal, setAddFundsGoal] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editGoal, setEditGoal] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [dateEst, setDateEst] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocatingFunds, setIsAllocatingFunds] = useState(false);

  const pickSingleInitialGoal = useCallback((list) => {
    if (!Array.isArray(list) || list.length === 0) return [];

    const onboardingGoalType = String(onboardingData.goalType || onboardingData.goal || "")
      .trim()
      .toLowerCase();
    const onboardingGoalTitle = String(onboardingData.goalTitle || onboardingData.goal || "")
      .trim()
      .toLowerCase();

    const matchedByOnboarding = list.find((g) => {
      const gCategory = String(g?.category || "").trim().toLowerCase();
      const gName = String(g?.name || "").trim().toLowerCase();
      const categoryMatches = onboardingGoalType && gCategory === onboardingGoalType;
      const titleMatches = onboardingGoalTitle && gName === onboardingGoalTitle;
      return categoryMatches || titleMatches;
    });

    if (matchedByOnboarding) return [matchedByOnboarding];

    // If onboarding mapping is unavailable, collapse duplicate goals and keep first.
    const deduped = list.filter((goal, index, arr) => {
      const key = `${String(goal?.name || "").trim().toLowerCase()}|${String(goal?.category || "").trim().toLowerCase()}|${Number(goal?.target || 0)}`;
      return (
        arr.findIndex((g) => {
          const k = `${String(g?.name || "").trim().toLowerCase()}|${String(g?.category || "").trim().toLowerCase()}|${Number(g?.target || 0)}`;
          return k === key;
        }) === index
      );
    });

    return deduped.length > 0 ? [deduped[0]] : [];
  }, [onboardingData.goalType, onboardingData.goal, onboardingData.goalTitle]);

  useEffect(() => {
    let cancelled = false;

    fetchGoals().then((loadedGoals) => {
      if (!cancelled) {
        const list = Array.isArray(loadedGoals) ? loadedGoals : [];

        if (list.length > 0) {
          // ✅ API returned goals — show all of them
          setGoals(list);
        } else {
          // ⚠️ API returned empty — build fallback from onboarding localStorage
          const goalType  = onboardingData.goalType  || onboardingData.goal || "emergency";
          const goalTitle = onboardingData.goalTitle || onboardingData.goal || "";
          const target    = Number(onboardingData.targetAmount) || 0;

          if (goalTitle && target > 0) {
            setGoals([{
              id: "local-onboarding",
              name: goalTitle,
              subname: "High Priority",
              target,
              saved: 0,
              category: goalType,
              priority: "high",
              dateEst: null,
            }]);
          } else {
            setGoals([]);
          }
        }

        setTimeout(() => {
          setIsLoading(false);
          setTimeout(() => setIsMounted(true), 100);
        }, 400);
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getProgressColor = (percent) => {
    if (percent >= 80) return "#10B981"; // Green
    if (percent >= 40) return "#3B82F6"; // Blue
    return "#F59E0B"; // Orange
  };

  const calculateEstimate = (remaining) => {
    if (remaining <= 0) return lang === "ar" ? "مكتمل!" : "Completed!";
    const months = Math.ceil(remaining / monthlySavings);
    const date = new Date();
    date.setMonth(date.getMonth() + months);

    return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = (formData.get("name") || "").trim();
    const target = Number(formData.get("target"));
    if (!name || !target || target <= 0) return;

    const goalData = {
      name,
      subname: PRIORITY_LABELS[formData.get("priority")] || "New Goal",
      target,
      category: formData.get("category") || "other",
      priority: formData.get("priority") || "medium",
      dateEst: dateEst ? dateEst.toISOString().split("T")[0] : null,
    };

    let updatedGoals;
    try {
      if (editGoal) {
        updatedGoals = await modifyGoal(editGoal.id, goalData);
      } else {
        goalData.saved = 0;
        updatedGoals = await createGoal(goalData);
      }
      // Show ALL goals (not just the onboarding-filtered one)
      if (Array.isArray(updatedGoals) && updatedGoals.length > 0) {
        setGoals(updatedGoals);
      }
    } catch (err) {
      console.error("Failed to save goal:", err);
    } finally {
      setShowModal(false);
      setEditGoal(null);
      setDateEst(null);
    }
  };

  const handleAddFundsSubmit = async (e) => {
    e.preventDefault();
    if (isAllocatingFunds) return;
    const amount = Number(new FormData(e.target).get("amount"));
    if (amount > totalBalance) {
      alert(lang === "ar" ? "الرصيد غير كافٍ!" : "Insufficient balance!");
      return;
    }
    setIsAllocatingFunds(true);
    try {
      const updatedGoals = await addFundsToGoal(addFundsGoal, amount);
      if (Array.isArray(updatedGoals)) setGoals(updatedGoals);
      setTotalBalance((prev) => prev - amount);
      setAddFundsGoal(null);
    } finally {
      setIsAllocatingFunds(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      const updatedGoals = await removeGoal(id);
      if (Array.isArray(updatedGoals)) setGoals(updatedGoals);
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      setGoalToDelete(null);
    }
  };

  return (
    <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto", direction: dir }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0A192F", margin: "0 0 8px", fontFamily: "'Manrope', sans-serif" }}>
            {lang === "ar" ? "أهداف الادخار" : "Savings Goals"}
          </h1>
          <p style={{ fontSize: 15, color: "#64748B", margin: 0, maxWidth: 500, lineHeight: 1.6 }}>
            {lang === "ar"
              ? "تتبع تقدمك نحو المعالم المالية الرئيسية. تحلل نماذج الذكاء الاصطناعي لدينا التدفق النقدي الخاص بك لتحسين طريقك."
              : "Track your progress toward key financial milestones. Our AI models analyze your cash flow to optimize your path to prosperity."}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "#10B981",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            borderRadius: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
          }}
        >
          <Plus size={18} />
          {lang === "ar" ? "إضافة هدف جديد" : "Add New Goal"}
        </button>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 24,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                height: 300,
                borderRadius: 24,
                background: "#E2E8F0",
                animation: "pulse 1.5s infinite",
                boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
              }}
            />
          ))}
        </div>
      ) : (
        goals.length === 0 ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 20,
              padding: "48px 24px",
              textAlign: "center",
              color: "#64748B",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {lang === "ar" ? "لا توجد أهداف" : "No goals found"}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {goals.map((goal) => {
          const Icon = GOAL_ICONS[goal.category] || Target;
          const progress = Math.min(100, Math.max(0, (goal.saved / goal.target) * 100));
          const color = getProgressColor(progress);
          const remaining = goal.target - goal.saved;

          return (
            <div
              key={goal.id}
              className="animate-fadeIn"
              style={{
                background: "#FFFFFF",
                borderRadius: 20,
                padding: 24,
                boxShadow: "0 10px 30px rgba(10,25,47,0.04)",
                border: "1px solid #E2E8F0",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 15px 35px rgba(10,25,47,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(10,25,47,0.04)";
              }}
            >
              <button
                onClick={() => setMenuOpenId(menuOpenId === goal.id ? null : goal.id)}
                style={{ position: "absolute", top: 20, [dir === "rtl" ? "left" : "right"]: 20, background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 4 }}
              >
                <MoreVertical size={20} />
              </button>

              {menuOpenId === goal.id && (
                <div style={{
                  position: "absolute", top: 48, [dir === "rtl" ? "left" : "right"]: 20,
                  background: "#FFF", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  border: "1px solid #E2E8F0", zIndex: 10, padding: 4, minWidth: 120
                }}>
                  <button
                    onClick={() => {
                      setEditGoal(goal);
                      setDateEst(goal?.dateEst ? new Date(goal.dateEst) : null);
                      setShowModal(true);
                      setMenuOpenId(null);
                    }}
                    style={{ width: "100%", textAlign: dir === "rtl" ? "right" : "left", padding: "8px 12px", background: "none", border: "none", fontSize: 13, cursor: "pointer", color: "#0A192F" }}
                  >
                    {lang === "ar" ? "تعديل" : "Edit"}
                  </button>
                  <button
                    onClick={() => {
                      setGoalToDelete(goal);
                      setMenuOpenId(null);
                    }}
                    style={{ width: "100%", textAlign: dir === "rtl" ? "right" : "left", padding: "8px 12px", background: "none", border: "none", fontSize: 13, cursor: "pointer", color: "#EF4444" }}
                  >
                    {lang === "ar" ? "حذف" : "Delete"}
                  </button>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#475569",
                  }}
                >
                  <Icon size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0A192F", margin: "0 0 4px", fontFamily: "'Manrope', sans-serif" }}>
                    {goal.name}
                  </h3>
                  <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                    {goal.subname}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0A192F" }}>
                    {formatCurrency(goal.saved)}
                  </div>
                  <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                    {lang === "ar" ? `من هدف ${formatCurrency(goal.target)}` : `of ${formatCurrency(goal.target)} target`}
                  </div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color }}>
                  {Math.round(progress)}%
                </div>
              </div>

              <div style={{ width: "100%", height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden", marginBottom: 24 }}>
                <div
                  style={{
                    width: isMounted ? `${progress}%` : "0%",
                    height: "100%",
                    background: color,
                    borderRadius: 4,
                    transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: 16, marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748B", fontWeight: 600 }}>
                  <Target size={14} />
                  {lang === "ar" ? "متوقع في" : "Est."} {goal.dateEst ? new Date(goal.dateEst).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", year: "numeric" }) : calculateEstimate(remaining)}
                </div>
                <button
                  onClick={() => setAddFundsGoal(goal)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#10B981",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {lang === "ar" ? "إضافة أموال" : "Add Funds"}
                </button>
              </div>
            </div>
          );
          })}
          </div>
        )
      )}

      {/* Add Goal Modal */}
      {showModal && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,25,47,0.5)", backdropFilter: "blur(4px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, direction: dir }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: 480, borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0A192F", margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                {editGoal ? (lang === "ar" ? "تعديل الهدف" : "Edit Goal") : (lang === "ar" ? "إضافة هدف جديد" : "Add New Goal")}
              </h2>
              <button onClick={() => { setShowModal(false); setEditGoal(null); setDateEst(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddGoal} style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0A192F", marginBottom: 8 }}>
                  {lang === "ar" ? "اسم الهدف" : "Goal Name"}
                </label>
                <input
                  name="name"
                  required
                  defaultValue={editGoal?.name}
                  placeholder={lang === "ar" ? "مثال: سيارة الأحلام" : "e.g. Dream Car"}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, outline: "none", background: "#F8FAFC" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0A192F", marginBottom: 8 }}>
                  {lang === "ar" ? "المبلغ المستهدف" : "Target Amount"}
                </label>
                <input
                  name="target"
                  type="number"
                  defaultValue={editGoal?.target}
                  required
                  min="1"
                  placeholder="0.00"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, outline: "none", background: "#F8FAFC" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0A192F", marginBottom: 8 }}>
                  {lang === "ar" ? "التاريخ المتوقع للإنجاز" : "Estimated Completion Date"}
                </label>
                <DatePicker
                  selected={dateEst}
                  onChange={(date) => setDateEst(date)}
                  locale={lang === "ar" ? ar : enUS}
                  dateFormat="yyyy/MM/dd"
                  placeholderText={lang === "ar" ? "حدد تاريخ (اختياري)" : "Select date (optional)"}
                  customInput={
                    <input
                      style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, outline: "none", background: "#F8FAFC", fontFamily: "inherit" }}
                      onFocus={(e) => (e.target.style.borderColor = "#10B981")}
                      onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                    />
                  }
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0A192F", marginBottom: 8 }}>
                    {lang === "ar" ? "الفئة" : "Category"}
                  </label>
                  <select name="category" defaultValue={editGoal?.category || "emergency"} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, outline: "none", background: "#F8FAFC" }}>
                    <option value="emergency">{lang === "ar" ? "طوارئ" : "Emergency"}</option>
                    <option value="car">{lang === "ar" ? "سيارة" : "Car"}</option>
                    <option value="travel">{lang === "ar" ? "سفر" : "Travel"}</option>
                    <option value="home">{lang === "ar" ? "منزل" : "Home"}</option>
                    <option value="other">{lang === "ar" ? "أخرى" : "Other"}</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0A192F", marginBottom: 8 }}>
                    {lang === "ar" ? "الأولوية" : "Priority"}
                  </label>
                  <select name="priority" defaultValue={editGoal?.priority || "high"} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, outline: "none", background: "#F8FAFC" }}>
                    <option value="high">{lang === "ar" ? "عالية" : "High"}</option>
                    <option value="medium">{lang === "ar" ? "متوسطة" : "Medium"}</option>
                    <option value="low">{lang === "ar" ? "منخفضة" : "Low"}</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditGoal(null); setDateEst(null); }}
                  style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#0A192F", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "#10B981", color: "#FFFFFF", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                  {lang === "ar" ? "حفظ الهدف" : "Save Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Funds Modal */}
      {addFundsGoal && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,25,47,0.5)", backdropFilter: "blur(4px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, direction: dir }}>
          <div style={{ background: "#FFFFFF", width: "100%", maxWidth: 400, borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0A192F", margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                {lang === "ar" ? "إضافة أموال للهدف" : "Add Funds to Goal"}
              </h2>
              <button onClick={() => setAddFundsGoal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFundsSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 14, color: "#64748B", fontWeight: 600 }}>
                  {lang === "ar" ? "رصيدك المتاح:" : "Available Balance:"}
                </div>
                <div style={{ fontSize: 18, color: "#0A192F", fontWeight: 800, fontFamily: "'Manrope', sans-serif" }}>
                  {formatCurrency(totalBalance)}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0A192F", marginBottom: 8 }}>
                  {lang === "ar" ? `كم تريد تخصيص لـ "${addFundsGoal.name}"؟` : `How much to allocate for "${addFundsGoal.name}"?`}
                </label>
                <input
                  name="amount"
                  type="number"
                  required
                  min="1"
                  max={totalBalance}
                  placeholder="0.00"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 15, outline: "none", background: "#FFFFFF" }}
                />
              </div>

              <button
                type="submit"
                disabled={isAllocatingFunds}
                style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: isAllocatingFunds ? "#86EFAC" : "#10B981", color: "#FFFFFF", fontWeight: 700, fontSize: 15, cursor: isAllocatingFunds ? "not-allowed" : "pointer", marginTop: 8 }}
              >
                {isAllocatingFunds
                  ? (lang === "ar" ? "جارٍ التنفيذ..." : "Processing...")
                  : (lang === "ar" ? "تأكيد الإضافة" : "Confirm Allocation")}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {goalToDelete && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,25,47,0.5)", backdropFilter: "blur(4px)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, direction: dir }}>
          <div className="animate-fadeIn" style={{ background: "#FFFFFF", width: "100%", maxWidth: 400, borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <AlertTriangle size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0A192F", margin: "0 0 8px", fontFamily: "'Manrope', sans-serif" }}>
                {lang === "ar" ? "حذف الهدف" : "Delete Goal"}
              </h2>
              <p style={{ color: "#64748B", fontSize: 15, margin: "0 0 24px", lineHeight: 1.6 }}>
                {lang === "ar"
                  ? `هل أنت متأكد من حذف هدف "${goalToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete the goal "${goalToDelete.name}"? This action cannot be undone.`}
              </p>

              <div style={{ display: "flex", gap: 12, width: "100%" }}>
                <button
                  onClick={() => setGoalToDelete(null)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #E2E8F0", background: "#FFFFFF", color: "#0A192F", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                  {lang === "ar" ? "لا، تراجع" : "No, cancel"}
                </button>
                <button
                  onClick={() => handleDeleteGoal(goalToDelete.id)}
                  style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#EF4444", color: "#FFFFFF", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                  {lang === "ar" ? "نعم، احذف" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .react-datepicker__header {
          background-color: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          padding-top: 16px;
        }
        .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
          color: #0A192F;
          font-weight: 800;
          font-size: 15px;
        }
        .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
          color: #475569;
          width: 2rem;
          line-height: 2rem;
          margin: 0.2rem;
        }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
          background-color: #10B981 !important;
          color: #FFF !important;
          border-radius: 8px;
          font-weight: 700;
        }
        .react-datepicker__day:hover {
          background-color: #ECFDF5;
          border-radius: 8px;
          color: #10B981;
        }
        @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
