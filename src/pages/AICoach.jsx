import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { getTransactions, getOnboardingData } from "../services/transactionService";
import { Bot, Sparkles, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, ChevronRight } from "lucide-react";

export default function AICoach() {
  const { lang, dir } = useLanguage();
  
  // Data logic
  const [transactions, setTransactions] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [advice, setAdvice] = useState(null);

  useEffect(() => {
    setTransactions(getTransactions() || []);
  }, []);

  const totalIncome = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Math.abs(t.amount), 0);

  const generateAdvice = () => {
    setIsThinking(true);
    setAdvice(null);

    setTimeout(() => {
      let newAdvice = {};
      const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 0;

      if (totalIncome === 0 && totalExpense === 0) {
        newAdvice = {
          type: "neutral",
          bg: "#EFF6FF",
          border: "#BFDBFE",
          color: "#2563EB",
          icon: <Sparkles size={28} color="#2563EB" />,
          arTitle: "مرحلة البداية",
          enTitle: "Starting Phase",
          ar: "أهلاً بك! دعنا نبدأ بتسجيل عملياتك المالية الأولى لنتمكن من تقديم نصائح دقيقة ومخصصة لك.",
          en: "Welcome! Let's start by recording your first financial transactions so we can provide accurate personalized advice."
        };
      } else if (expenseRatio > 0.8) {
        newAdvice = {
          type: "warning",
          bg: "#FEF2F2",
          border: "#FECACA",
          color: "#DC2626",
          icon: <AlertTriangle size={28} color="#DC2626" />,
          arTitle: "تنبيه هام",
          enTitle: "Important Alert",
          ar: "مصروفاتك قريبة جداً من دخلك! حاول تقليل النفقات غير الضرورية هذا الشهر لتجنب أي عجز مالي.",
          en: "Your expenses are very close to your income! Try to reduce unnecessary spending this month to avoid a deficit."
        };
      } else if (expenseRatio > 0.5) {
        newAdvice = {
          type: "info",
          bg: "#FFFBEB",
          border: "#FDE68A",
          color: "#D97706",
          icon: <TrendingUp size={28} color="#D97706" />,
          arTitle: "مسار جيد",
          enTitle: "Good Track",
          ar: "أنت في المسار الصحيح، لكن حاول تخصيص جزء أكبر من راتبك للادخار لضمان استقرارك المالي في المستقبل.",
          en: "You are on the right track, but try allocating a larger portion of your salary to savings to ensure future financial stability."
        };
      } else {
        newAdvice = {
          type: "success",
          bg: "#ECFDF5",
          border: "#A7F3D0",
          color: "#059669",
          icon: <CheckCircle size={28} color="#059669" />,
          arTitle: "أداء ممتاز",
          enTitle: "Excellent Performance",
          ar: "أداء مالي ممتاز! إدارتك لمصروفاتك رائعة، استمر في هذا الأداء وفكر في استثمار الفائض من أموالك.",
          en: "Excellent financial performance! Your expense management is great, keep it up and consider investing your surplus funds."
        };
      }

      setAdvice(newAdvice);
      setIsThinking(false);
    }, 2000);
  };

  const fontBody = lang === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif";
  const fontHead = lang === "ar" ? "'Cairo', sans-serif" : "'Manrope', sans-serif";

  return (
    <div
      className="animate-fadeIn"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        fontFamily: fontBody,
        direction: dir,
        minHeight: "80vh"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#0A192F", fontFamily: fontHead }}>
          {lang === "ar" ? "مدرب الذكاء الاصطناعي" : "AI Coach"}
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "#64748B" }}>
          {lang === "ar" 
            ? "احصل على نصائح مالية ذكية ومخصصة بناءً على سلوكك المالي لتصل إلى أهدافك بسرعة." 
            : "Get smart, personalized financial advice based on your spending behavior to reach your goals faster."}
        </p>
      </div>

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
      }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: 24,
          padding: 40,
          width: "100%",
          maxWidth: 600,
          boxShadow: "0 20px 40px rgba(10,25,47,0.04)",
          border: "1px solid #E2E8F0",
          textAlign: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* خلفية تزيينية للكرت */}
          <div style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 300,
            height: 300,
            background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, rgba(255,255,255,0) 70%)",
            borderRadius: "50%",
            zIndex: 0
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            
            {/* الحالة الافتراضية قبل التوليد */}
            {!isThinking && !advice && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ 
                  width: 80, height: 80, borderRadius: "50%", background: "#F0FDF4", color: "#10B981", 
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" 
                }}>
                  <Bot size={40} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0A192F", marginBottom: 12 }}>
                  {lang === "ar" ? "هل أنت مستعد لنصيحة اليوم؟" : "Ready for today's advice?"}
                </h2>
                <p style={{ fontSize: 15, color: "#64748B", marginBottom: 32, lineHeight: 1.6 }}>
                  {lang === "ar" 
                    ? "يقوم الذكاء الاصطناعي بتحليل مصاريفك ودخلك لتقديم استراتيجية مالية تناسب وضعك الحالي."
                    : "The AI analyzes your income and expenses to provide a financial strategy that fits your current situation."}
                </p>
              </motion.div>
            )}

            {/* حالة التفكير (Loading) */}
            {isThinking && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: "20px 0" }}
              >
                <div style={{ position: "relative", width: 100, height: 100 }}>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ position: "absolute", inset: 0, background: "#10B981", borderRadius: "50%", filter: "blur(20px)" }}
                  />
                  <div style={{ 
                    position: "relative", width: "100%", height: "100%", background: "#FFFFFF", 
                    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 30px rgba(16,185,129,0.3)", border: "2px solid #10B981"
                  }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Bot size={40} color="#10B981" />
                    </motion.div>
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#10B981", animation: "pulse 1.5s infinite" }}>
                  {lang === "ar" ? "جاري تحليل البيانات المالية..." : "Analyzing financial data..."}
                </div>
              </motion.div>
            )}

            {/* عرض النتيجة */}
            {!isThinking && advice && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div style={{
                  background: advice.bg,
                  border: `2px solid ${advice.border}`,
                  borderRadius: 20,
                  padding: 32,
                  marginBottom: 32,
                  textAlign: dir === "rtl" ? "right" : "left"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ 
                      background: "#FFFFFF", padding: 12, borderRadius: 14, 
                      boxShadow: `0 8px 16px rgba(0,0,0,0.05)`
                    }}>
                      {advice.icon}
                    </div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: advice.color }}>
                      {lang === "ar" ? advice.arTitle : advice.enTitle}
                    </h3>
                  </div>
                  <p style={{ 
                    margin: 0, fontSize: 17, fontWeight: 600, color: "#1E293B", 
                    lineHeight: 1.8, letterSpacing: -0.2 
                  }}>
                    {lang === "ar" ? advice.ar : advice.en}
                  </p>
                </div>
              </motion.div>
            )}

            {/* الزر الرئيسي */}
            <button
              onClick={generateAdvice}
              disabled={isThinking}
              style={{
                background: "#10B981",
                color: "#FFFFFF",
                border: "none",
                padding: "16px 32px",
                borderRadius: 16,
                fontSize: 16,
                fontWeight: 800,
                cursor: isThinking ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                transition: "all 0.3s",
                boxShadow: isThinking ? "none" : "0 10px 25px rgba(16,185,129,0.3)",
                opacity: isThinking ? 0.7 : 1,
                fontFamily: "inherit"
              }}
              onMouseEnter={(e) => {
                if (!isThinking) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 15px 35px rgba(16,185,129,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isThinking) {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "0 10px 25px rgba(16,185,129,0.3)";
                }
              }}
            >
              {isThinking ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  {lang === "ar" ? "لحظات..." : "Thinking..."}
                </>
              ) : (
                <>
                  <Bot size={20} />
                  {advice 
                    ? (lang === "ar" ? "تحديث النصيحة" : "Update Advice")
                    : (lang === "ar" ? "توليد نصيحة مخصصة" : "Generate Personalized Advice")}
                </>
              )}
            </button>

          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
