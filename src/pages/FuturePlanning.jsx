import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function FuturePlanning() {
  const { dir, lang } = useLanguage();
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
            {lang === "ar" ? "التخطيط المستقبلي" : "Future Planning"}
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "#64748B" }}>
            {lang === "ar"
              ? "قريباً... سيتم عرض خططك المالية المستقبلية هنا."
              : "Coming soon... your future financial plans will be shown here."}
          </p>
        </div>
      </motion.div>

      <motion.div variants={cardVariants}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            padding: 32,
            border: "1px solid #E2E8F0",
            boxShadow: "0 10px 40px rgba(10,25,47,0.03)",
          }}
        >
          <div style={{ color: "#64748B", fontSize: 15, lineHeight: 1.8 }}>
            {lang === "ar"
              ? "نعمل على بناء صفحة تخطيط مستقبلية متقدمة تعرض سيناريوهات الادخار، وتتبع الأهداف طويلة الأمد، وتوصيات مخصصة."
              : "We're building an advanced planning page that will show saving scenarios, long-term goals tracking, and personalized recommendations."}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
