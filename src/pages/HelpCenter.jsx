import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";
import { Mail, ChevronDown, MessageCircle, HelpCircle } from "lucide-react";

const FAQ_DATA = [
  {
    id: 1,
    arQ: "كيف يمكنني إضافة معاملة مالية جديدة (دخل أو مصروف)؟",
    enQ: "How can I add a new financial transaction (income or expense)?",
    arA: "يمكنك إضافة معاملة مالية من خلال الضغط على زر '+' الموجود في لوحة التحكم (Dashboard)، ثم اختيار نوع المعاملة والمبلغ والتصنيف المناسب.",
    enA: "You can add a transaction by clicking the '+' button on the Dashboard, then selecting the transaction type, amount, and appropriate category.",
  },
  {
    id: 2,
    arQ: "كيف يتم حساب هدف الادخار الشهري الخاص بي؟",
    enQ: "How is my monthly savings goal calculated?",
    arA: "يتم حسابه تلقائياً بناءً على النسبة التي حددتها من راتبك الشهري (مثلاً 10%). يمكنك تعديل هذه النسبة في أي وقت من خلال بطاقة الحصالة في لوحة التحكم.",
    enA: "It is calculated automatically based on the percentage of your monthly salary you set (e.g., 10%). You can adjust this anytime from the Piggy Bank card on the Dashboard.",
  },
  {
    id: 3,
    arQ: "كيف يعمل مدرب الذكاء الاصطناعي (AI Coach)؟",
    enQ: "How does the AI Coach work?",
    arA: "يقوم المدرب الذكي بتحليل مصروفاتك ودخلك وتقديم نصائح مالية مخصصة وفورية لمساعدتك في اتخاذ قرارات مالية أذكى وتجنب العجز.",
    enA: "The AI Coach analyzes your expenses and income to provide personalized, real-time financial advice to help you make smarter financial decisions and avoid deficits.",
  },
  {
    id: 4,
    arQ: "ما هي صفحة 'رؤى الذكاء الاصطناعي' (AI Insights)؟",
    enQ: "What is the 'AI Insights' page?",
    arA: "هي صفحة تقدم لك تقييماً رقمياً لسلامتك المالية، وتوضح لك أين تنفق أموالك بالتحديد من خلال رسومات بيانية تفاعلية بناءً على بياناتك.",
    enA: "It's a page that gives you a numerical assessment of your financial health and shows exactly where your money goes through interactive charts based on your data.",
  },
  {
    id: 5,
    arQ: "هل بياناتي المالية آمنة؟",
    enQ: "Is my financial data secure?",
    arA: "نعم، نحن نستخدم أحدث تقنيات التشفير لضمان أن جميع بياناتك وحركاتك المالية آمنة تماماً وخاصة بك، ولا يتم مشاركتها مع أي طرف خارجي.",
    enA: "Yes, we use the latest encryption technologies to ensure that all your financial data and transactions are completely secure, private, and not shared with any third party.",
  },
  {
    id: 6,
    arQ: "كيف يمكنني تغيير العملة المستخدمة في الموقع؟",
    enQ: "How can I change the currency used on the site?",
    arA: "يمكنك تغيير العملة المفضلة من خلال الذهاب إلى إعدادات الحساب الشخصي (Profile) واختيار العملة المناسبة لك، وسيتم تحديثها فوراً في كل الموقع.",
    enA: "You can change your preferred currency by going to your profile settings and selecting your currency; it will be instantly updated across the entire site.",
  },
  {
    id: 7,
    arQ: "كيف تعمل الأهداف المستقبلية (Future Goals)؟",
    enQ: "How do Future Goals work?",
    arA: "تسمح لك هذه الميزة بتحديد أهداف طويلة الأمد (مثل شراء سيارة أو منزل). يمكنك تحديد المبلغ المطلوب وتتبع مقدار ما وفرته حتى الآن نحو تحقيق هذا الهدف.",
    enA: "This feature allows you to set long-term goals (like buying a car or a house). You can specify the required amount and track how much you've saved toward achieving it.",
  },
  {
    id: 8,
    arQ: "هل يمكنني تعديل المعاملات السابقة؟",
    enQ: "Can I edit past transactions?",
    arA: "يمكنك تتبع ومراجعة جميع معاملاتك السابقة عبر صفحة المعاملات (Transactions) لضمان دقة سجلاتك المالية ومراجعة تفاصيلها متى شئت.",
    enA: "You can track and review all your past transactions via the Transactions page to ensure the accuracy of your financial records and review details whenever you wish.",
  },
  {
    id: 9,
    arQ: "كيف أقوم بتغيير لغة الموقع؟",
    enQ: "How do I change the website language?",
    arA: "المنصة تدعم اللغتين العربية والإنجليزية بطلاقة. يمكنك التبديل بينهما في أي وقت من خلال القائمة المنسدلة (Dropdown) الخاصة بملفك الشخصي في القائمة الجانبية.",
    enA: "The platform fully supports Arabic and English. You can switch between them anytime from your profile dropdown menu in the sidebar.",
  },
  {
    id: 10,
    arQ: "كيف يتم تحديد الدخل الشهري الأساسي الخاص بي؟",
    enQ: "How is my base monthly income determined?",
    arA: "يتم تحديد دخلك الشهري بناءً على ما أدخلته في الشاشات الترحيبية (Onboarding) عند تسجيل حسابك، ويمكن تحديثه لاحقاً عبر إضافة معاملة 'دخل' ثابتة.",
    enA: "Your monthly income is determined based on what you entered during onboarding when you created your account, and it can be updated later by adding a fixed 'Income' transaction.",
  }
];

export default function HelpCenter() {
  const { lang, dir } = useLanguage();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const fontBody = lang === "ar" ? "'Cairo', sans-serif" : "'Inter', sans-serif";
  const fontHead = lang === "ar" ? "'Cairo', sans-serif" : "'Manrope', sans-serif";

  // واتساب
  const whatsappContacts = [
    {
      value: "+972597937823",
      link: "https://wa.me/972597937823",
    },
    {
      value: "+972592159116",
      link: "https://wa.me/972592159116",
    }
  ];

  // الإيميلات
  const emailContacts = [
    {
      value: "malakhammza10@gmail.com",
      link: "mailto:malakhammza10@gmail.com",
    },
    {
      value: "email@gmail.com",
      link: "mailto:email@gmail.com",
    }
  ];

  const ContactCard = ({ link, value, icon, bg, hoverBorder, title }) => (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", gap: 16, padding: 24,
        background: "#FFFFFF", border: "2px solid #E2E8F0", borderRadius: 20,
        textDecoration: "none", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer", width: "100%", boxSizing: "border-box"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverBorder;
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.06)";
        e.currentTarget.style.background = bg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#E2E8F0";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.background = "#FFFFFF";
      }}
    >
      <div style={{ 
        width: 56, height: 56, borderRadius: 16, background: bg, 
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 
      }}>
        {icon}
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ 
          fontSize: 16, fontWeight: 800, color: "#0A192F", 
          fontFamily: "'Manrope', sans-serif", letterSpacing: -0.5,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
        }}>
          {value}
        </div>
      </div>
    </a>
  );

  return (
    <div className="animate-fadeIn" style={{ display: "flex", flexDirection: "column", gap: 32, fontFamily: fontBody, direction: dir, minHeight: "80vh" }}>
      {/* رأس الصفحة */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#0A192F", fontFamily: fontHead }}>
          {lang === "ar" ? "مركز المساعدة" : "Help Center"}
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "#64748B" }}>
          {lang === "ar" 
            ? "نحن هنا لمساعدتك! تصفح الأسئلة الشائعة أو تواصل معنا مباشرة." 
            : "We're here to help! Browse FAQs or contact us directly."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* قسم الأسئلة الشائعة (FAQ Accordion) - أصبح بالأعلى */}
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(10,25,47,0.04)", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "#F8FAFC", padding: 10, borderRadius: 12 }}>
              <HelpCircle size={24} color="#64748B" />
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#0A192F" }}>
              {lang === "ar" ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FAQ_DATA.map((faq) => {
              const isOpen = openFaq === faq.id;
              return (
                <div 
                  key={faq.id} 
                  style={{ 
                    border: `2px solid ${isOpen ? "#10B981" : "#E2E8F0"}`, 
                    borderRadius: 16, overflow: "hidden", transition: "all 0.3s" 
                  }}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    style={{
                      width: "100%", padding: "20px 24px", 
                      background: isOpen ? "#F0FDF4" : "#FFFFFF", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "space-between", 
                      cursor: "pointer", textAlign: dir === "rtl" ? "right" : "left", 
                      transition: "background 0.3s", outline: "none"
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: isOpen ? "#059669" : "#0A192F" }}>
                      {lang === "ar" ? faq.arQ : faq.enQ}
                    </span>
                    <ChevronDown 
                      size={20} 
                      color={isOpen ? "#10B981" : "#64748B"} 
                      style={{ 
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", 
                        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)", flexShrink: 0
                      }} 
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ 
                          padding: "0 24px 24px", fontSize: 15, fontWeight: 600, color: "#475569", 
                          lineHeight: 1.8, background: "#F0FDF4" 
                        }}>
                          {lang === "ar" ? faq.arA : faq.enA}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* قسم تواصل معنا - أصبح بالأسفل مع ترتيب جديد */}
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: 32, boxShadow: "0 20px 40px rgba(10,25,47,0.04)", border: "1px solid #E2E8F0" }}>
          <h2 style={{ margin: "0 0 32px", fontSize: 20, fontWeight: 800, color: "#0A192F" }}>
            {lang === "ar" ? "فريق الدعم الفني" : "Support Team"}
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
            
            {/* عمود الواتساب */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <MessageCircle size={20} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0A192F" }}>
                  {lang === "ar" ? "دعم واتساب" : "WhatsApp Support"}
                </h3>
              </div>
              {whatsappContacts.map((contact, i) => (
                <ContactCard 
                  key={i}
                  link={contact.link}
                  value={contact.value}
                  title={lang === "ar" ? `قناة الدعم ${i + 1}` : `Support Channel ${i + 1}`}
                  icon={<MessageCircle size={24} color="#10B981" />}
                  bg="#F0FDF4"
                  hoverBorder="#10B981"
                />
              ))}
            </div>

            {/* عمود الإيميلات */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Mail size={20} color="#3B82F6" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0A192F" }}>
                  {lang === "ar" ? "دعم البريد الإلكتروني" : "Email Support"}
                </h3>
              </div>
              {emailContacts.map((contact, i) => (
                <ContactCard 
                  key={i}
                  link={contact.link}
                  value={contact.value}
                  title={lang === "ar" ? `بريد الدعم ${i + 1}` : `Support Email ${i + 1}`}
                  icon={<Mail size={24} color="#3B82F6" />}
                  bg="#EFF6FF"
                  hoverBorder="#3B82F6"
                />
              ))}
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
