import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Download,
  Tag,
  ShoppingCart,
  Bus,
  Building,
  Zap,
  Film,
  Utensils,
  Coins,
  Pencil,
  Trash2,
  Filter,
  X,
  ChevronDown,
  TrendingUp,
  Gift,
  Briefcase,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  getTransactions,
  getOnboardingData,
  deleteTransaction,
} from "../services/transactionService";
import AddTransactionModal from "../components/AddTransactionModal";
import { generateInvoicePDF } from "../utils/generateInvoicePDF";

// Category definitions (must match AddTransactionModal)
const EXPENSE_CATS = [
  "food",
  "transport",
  "housing",
  "shopping",
  "utilities",
  "entertainment",
];
const INCOME_CATS = ["salary", "freelance", "bonus", "investment"];
const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];

// Categories Icons mapping
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
  food: { bg: "#FFF7ED", color: "#EA580C" },
  transport: { bg: "#F1F5F9", color: "#64748B" },
  housing: { bg: "#EFF6FF", color: "#3B82F6" },
  shopping: { bg: "#FDF2F8", color: "#EC4899" },
  utilities: { bg: "#FFFBEB", color: "#F59E0B" },
  entertainment: { bg: "#F5F3FF", color: "#8B5CF6" },
  salary: { bg: "#ECFDF5", color: "#10B981" },
  freelance: { bg: "#F0FDF4", color: "#16A34A" },
  bonus: { bg: "#FEF9C3", color: "#CA8A04" },
  investment: { bg: "#EFF6FF", color: "#2563EB" },
  groceries: { bg: "#F0FDF4", color: "#16A34A" },
  income: { bg: "#ECFDF5", color: "#10B981" },
  default: { bg: "#F8FAFC", color: "#94A3B8" },
};

export default function Transactions() {
  const { t, lang, dir } = useLanguage();
  const font =
    lang === "ar"
      ? { body: "'Cairo', sans-serif", headline: "'Cairo', sans-serif" }
      : { body: "'Inter', sans-serif", headline: "'Manrope', sans-serif" };

  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [currency, setCurrency] = useState("$");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'income', 'expense'
  const [catFilter, setCatFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30"); // '30', '7'

  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null); // tracks which tx is downloading
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

  function fetchTx() {
    setTransactions(getTransactions());
  }

  useEffect(() => {
    fetchTx();
    const onboard = getOnboardingData();
    if (onboard && onboard.currency) {
      setCurrency(onboard.currency);
    }
  }, []);

  useEffect(() => {
    if (showMobileFilters) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileFilters]);

  const filteredList = transactions.filter((tx) => {
    const q =
      tx.name.toLowerCase().includes(search.toLowerCase()) ||
      t(`cat_${tx.category}`).toLowerCase().includes(search.toLowerCase());
    const tMatch = typeFilter === "all" || tx.type === typeFilter;
    const cMatch = catFilter === "all" || tx.category === catFilter;

    // Date Filtering Logic
    const txDate = new Date(tx.date);
    const now = new Date();
    const diffTime = Math.abs(now - txDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const dMatch = diffDays <= parseInt(dateRange, 10);

    return q && tMatch && cMatch && dMatch;
  });

  // Group by date logic
  const grouped = filteredList.reduce((acc, tx) => {
    const d = tx.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {});

  // For nice date display
  function formatDateLabel(dateStr) {
    const today = new Date().toISOString().split("T")[0];
    const yest = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dateStr === today) return t("tx_today");
    if (dateStr === yest) return t("tx_yesterday");
    return new Date(dateStr).toLocaleDateString(
      lang === "ar" ? "ar-SA" : "en-US",
      { day: "numeric", month: "short", year: "numeric" },
    );
  }

  function handleEdit(tx) {
    setEditData(tx);
    setIsModalOpen(true);
  }

  async function handleDownload(tx) {
    setDownloadingId(tx.id);
    setToast({
      message:
        lang === "ar" ? "جارٍ إنشاء الفاتورة..." : "Generating invoice...",
      type: "loading",
    });
    try {
      await generateInvoicePDF(tx, t, lang, currency);
      setToast({
        message:
          lang === "ar"
            ? "تم تحميل الفاتورة بنجاح! ✓"
            : "Invoice downloaded! ✓",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("PDF error:", err);
      setToast({
        message:
          lang === "ar"
            ? "حدث خطأ أثناء إنشاء الفاتورة"
            : "Failed to generate invoice",
        type: "error",
      });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setDownloadingId(null);
    }
  }

  function handleDelete(id) {
    const confirmMsg =
      lang === "ar"
        ? "هل أنت متأكد أنك تريد حذف هذه العملية؟"
        : "Are you sure you want to delete this transaction?";
    if (window.confirm(confirmMsg)) {
      deleteTransaction(id);
      fetchTx();
    }
  }

  function handleAddNew() {
    setEditData(null);
    setIsModalOpen(true);
  }

  return (
    <>
      <div
        className="animate-fadeIn"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          paddingBottom: 40,
          fontFamily: font.body,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: font.headline,
                fontSize: 32,
                fontWeight: 800,
                color: "#0A192F",
                margin: "0 0 8px",
                letterSpacing: -1,
              }}
            >
              {t("tx_title")}
            </h1>
            <p style={{ fontSize: 15, color: "#64748B", margin: 0 }}>
              {t("tx_subtitle")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                color: "#0A192F",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <Filter size={16} />
            </button>
            <button
              onClick={handleAddNew}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#10B981",
                border: "none",
                borderRadius: 12,
                color: "#FFFFFF",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#059669")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#10B981")
              }
            >
              {t("tx_add_btn")}
            </button>
          </div>
        </div>

        {/* Main Content Layout */}
        <div style={{ display: "flex", gap: 24, flexDirection: "row" }}>
          {/* Desktop Filters Sidebar */}
          <div
            className="hidden lg:flex"
            style={{ width: 280, flexDirection: "column", gap: 20 }}
          >
            {/* Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <Search size={18} color="#94A3B8" />
              <input
                type="text"
                placeholder={t("tx_search_placeholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  width: "100%",
                  fontSize: 14,
                  fontFamily: "inherit",
                  color: "#0A192F",
                  background: "transparent",
                }}
              />
            </div>

            <FiltersContent
              t={t}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              catFilter={catFilter}
              setCatFilter={setCatFilter}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </div>

          {/* Transactions List */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              {/* Table Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "16px 24px",
                  background: "#F8FAFC",
                  borderBottom: "1px solid #F1F5F9",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: 1,
                  }}
                >
                  {t("tx_table_date")}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748B",
                    letterSpacing: 1,
                  }}
                >
                  {t("tx_table_amount")}
                </div>
              </div>

              {/* List */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {Object.keys(grouped)
                  .sort((a, b) => new Date(b) - new Date(a))
                  .map((date) => (
                    <div key={date}>
                      <div
                        style={{
                          padding: "12px 24px",
                          background: "#FAFBFC",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#475569",
                          borderBottom: "1px solid #F1F5F9",
                        }}
                      >
                        {formatDateLabel(date)}
                      </div>
                      {grouped[date].map((tx, idx) => {
                        const isIncome = tx.type === "income";
                        const catStyle =
                          CAT_COLORS[tx.category] || CAT_COLORS.default;
                        const Icon = CAT_ICONS[tx.category] || Tag;
                        const isLast = idx === grouped[date].length - 1;

                        return (
                          <div
                            key={tx.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "16px 24px",
                              borderBottom: isLast
                                ? "none"
                                : "1px solid #F1F5F9",
                              transition: "background 0.2s",
                              cursor: "default",
                            }}
                            className="group hover:bg-slate-50"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                              }}
                            >
                              <div
                                style={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 14,
                                  background: catStyle.bg,
                                  color: catStyle.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Icon size={22} />
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: "#0A192F",
                                    marginBottom: 2,
                                  }}
                                >
                                  {tx.name}
                                </div>
                                <div style={{ fontSize: 13, color: "#64748B" }}>
                                  {t(`cat_${tx.category}`)}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 20,
                              }}
                            >
                              <div
                                style={{
                                  textAlign: dir === "rtl" ? "left" : "right",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 800,
                                    fontFamily: font.headline,
                                    color: isIncome ? "#10B981" : "#EF4444",
                                  }}
                                >
                                  {isIncome ? "+" : "-"}
                                  {currency}
                                  {Math.abs(tx.amount).toLocaleString(
                                    undefined,
                                    { minimumFractionDigits: 2 },
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: "#94A3B8" }}>
                                  {tx.date}
                                </div>
                              </div>

                              {/* Actions */}
                              <div
                                style={{ display: "flex", gap: 8 }}
                                className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                              >
                                {/* Download Invoice */}
                                <button
                                  onClick={() => handleDownload(tx)}
                                  disabled={downloadingId === tx.id}
                                  title={
                                    lang === "ar"
                                      ? "تنزيل الفاتورة"
                                      : "Download Invoice"
                                  }
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: "none",
                                    background: "#F0FDF4",
                                    color: "#10B981",
                                    cursor:
                                      downloadingId === tx.id
                                        ? "wait"
                                        : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (downloadingId !== tx.id) {
                                      e.currentTarget.style.background =
                                        "#DCFCE7";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "#F0FDF4";
                                  }}
                                >
                                  {downloadingId === tx.id ? (
                                    <span
                                      style={{
                                        width: 14,
                                        height: 14,
                                        border: "2px solid #10B981",
                                        borderTopColor: "transparent",
                                        borderRadius: "50%",
                                        display: "inline-block",
                                        animation: "spin 0.7s linear infinite",
                                      }}
                                    />
                                  ) : (
                                    <Download size={14} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleEdit(tx)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: "none",
                                    background: "#F1F5F9",
                                    color: "#64748B",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "#E2E8F0")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "#F1F5F9")
                                  }
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => handleDelete(tx.id)}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: "none",
                                    background: "#FEF2F2",
                                    color: "#EF4444",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "#FEE2E2")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "#FEF2F2")
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                {filteredList.length === 0 && (
                  <div
                    style={{
                      padding: 64,
                      textAlign: "center",
                      color: "#94A3B8",
                    }}
                  >
                    <Search
                      size={40}
                      style={{ opacity: 0.3, marginBottom: 16 }}
                    />
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                      {t("dash_empty_tx")}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {filteredList.length > 0 && (
                <div
                  style={{
                    padding: "16px 24px",
                    background: "#F8FAFC",
                    borderTop: "1px solid #F1F5F9",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#64748B" }}>
                    {t("tx_showing").replace("{count}", filteredList.length)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Drawer Filters */}
        {showMobileFilters && (
          <MobileFiltersModal
            t={t}
            dir={dir}
            initialSearch={search}
            initialType={typeFilter}
            initialCat={catFilter}
            initialDateRange={dateRange}
            onApply={({
              search: s,
              typeFilter: tF,
              catFilter: cF,
              dateRange: dR,
            }) => {
              setSearch(s);
              setTypeFilter(tF);
              setCatFilter(cF);
              setDateRange(dR);
              setShowMobileFilters(false);
            }}
            onClose={() => setShowMobileFilters(false)}
          />
        )}
      </div>
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTx}
        editData={editData}
      />

      {/* Toast Notification */}
      {toast &&
        createPortal(
          <div
            style={{
              position: "fixed",
              bottom: 32,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 24px",
              borderRadius: 16,
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              background:
                toast.type === "success"
                  ? "#10B981"
                  : toast.type === "error"
                    ? "#EF4444"
                    : "#0A192F",
              color: "#fff",
              fontFamily: "inherit",
              direction: dir,
              animation: "slideUp 0.3s ease",
            }}
          >
            {toast.type === "loading" && (
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.7s linear infinite",
                  flexShrink: 0,
                }}
              />
            )}
            {toast.message}
          </div>,
          document.body,
        )}

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </>
  );
}

function FiltersContent({
  t,
  typeFilter,
  setTypeFilter,
  catFilter,
  setCatFilter,
  dateRange,
  setDateRange,
  isMobile,
  namePrefix = "desktop",
}) {
  return (
    <div
      style={{
        background: isMobile ? "transparent" : "#FFFFFF",
        border: isMobile ? "none" : "1px solid #E2E8F0",
        borderRadius: 16,
        padding: isMobile ? 0 : 20,
        display: "flex",
        flexDirection: "column",
        gap: 24,
        boxShadow: isMobile ? "none" : "0 4px 6px -1px rgba(0,0,0,0.01)",
      }}
    >
      <div>
        {!isMobile && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#94A3B8",
              marginBottom: 16,
              letterSpacing: 1,
            }}
          >
            {t("tx_filters")}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#0A192F" }}>
            {t("tx_type")}
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "all", label: t("tx_all") },
              { id: "income", label: t("tx_income") },
              { id: "expense", label: t("tx_expense") },
            ].map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name={`tx_type_${namePrefix}`}
                  checked={typeFilter === opt.id}
                  onChange={() => setTypeFilter(opt.id)}
                  style={{ accentColor: "#10B981", width: 16, height: 16 }}
                />
                <span style={{ fontSize: 14, color: "#475569" }}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#0A192F" }}>
          {t("tx_categories")}
        </label>
        <div style={{ position: "relative" }}>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              outline: "none",
              fontSize: 14,
              background: "#F8FAFC",
              cursor: "pointer",
              appearance: "none",
            }}
          >
            <option value="all">{t("tx_all_cat")}</option>
            {ALL_CATS.map((c) => (
              <option key={c} value={c}>
                {t(`cat_${c}`)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#94A3B8",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#0A192F" }}>
          {t("tx_date_range")}
        </label>
        <div style={{ position: "relative" }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              outline: "none",
              fontSize: 14,
              background: "#F8FAFC",
              cursor: "pointer",
              appearance: "none",
            }}
          >
            <option value="30">{t("tx_last_30")}</option>
            <option value="7">{t("tx_last_7")}</option>
          </select>
          <ChevronDown
            size={14}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
              color: "#94A3B8",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MobileFiltersModal({
  t,
  dir,
  initialSearch,
  initialType,
  initialCat,
  initialDateRange,
  onApply,
  onClose,
}) {
  const [search, setSearch] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [catFilter, setCatFilter] = useState(initialCat);
  const [dateRange, setDateRange] = useState(initialDateRange);

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 25, 47, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="animate-fadeIn"
        style={{
          width: "100%",
          maxWidth: 500,
          background: "#FFF",
          borderRadius: 28,
          padding: "24px 24px 40px",
          position: "relative",
          direction: dir,
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
              fontSize: 20,
              fontWeight: 800,
              color: "#0A192F",
            }}
          >
            {t("tx_filters")}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "#F8FAFC",
              border: "none",
              color: "#94A3B8",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#EF4444";
              e.currentTarget.style.background = "#FEF2F2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#94A3B8";
              e.currentTarget.style.background = "#F8FAFC";
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
            }}
          >
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder={t("tx_search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: 14,
                background: "transparent",
                color: "#0A192F",
              }}
            />
          </div>
        </div>

        <FiltersContent
          t={t}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          isMobile={true}
          namePrefix="mobile"
        />

        <button
          onClick={() => onApply({ search, typeFilter, catFilter, dateRange })}
          style={{
            width: "100%",
            marginTop: 28,
            padding: "16px",
            background: "#10B981",
            color: "#FFF",
            border: "none",
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(16,185,129,0.2)",
            cursor: "pointer",
          }}
        >
          {t("tx_apply_filters")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
