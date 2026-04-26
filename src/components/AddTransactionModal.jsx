import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ShoppingCart,
  Bus,
  Building,
  Zap,
  Film,
  Utensils,
  Coins,
  Briefcase,
  Gift,
  TrendingUp,
  Tag,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ar, enUS } from "date-fns/locale";
import { useLanguage } from "../context/LanguageContext";
import {
  addTransaction,
  updateTransaction,
  fetchCategories,
} from "../services/transactionService";

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
  default: Tag,
};

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  editData = null,
}) {
  const { t, dir, lang } = useLanguage();
  const modalRef = useRef(null);
  const dropdownRef = useRef(null);

  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const [newTx, setNewTx] = useState({
    type: "expense",
    name: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Fetch Categories dynamically (Mock API)
  useEffect(() => {
    if (isOpen) {
      let isMounted = true;
      setIsLoadingCats(true);
      fetchCategories().then((data) => {
        if (isMounted) {
          setCategories(data);
          setIsLoadingCats(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen]);

  // Handle data initialization when modal opens or editData/categories change
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setNewTx({
          type:
            editData.type ||
            (categories.income?.includes(editData.category)
              ? "income"
              : "expense"),
          name: editData.name,
          amount: Math.abs(editData.amount).toString(),
          category: editData.category,
          date: editData.date,
        });
      } else {
        setNewTx((prev) => ({
          ...prev,
          name: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
        }));
      }
    }
  }, [editData, isOpen, categories]);

  // Ensure default category is selected if none is set
  useEffect(() => {
    if (!isLoadingCats && !editData && !newTx.category) {
      setNewTx((prev) => ({
        ...prev,
        category:
          prev.type === "income" ? categories.income[0] : categories.expense[0],
      }));
    }
  }, [isLoadingCats, newTx.type, editData, newTx.category, categories]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setShowCatDropdown(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowCatDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  function handleSave() {
    if (!newTx.name || !newTx.amount) return;

    const isIncome = newTx.type === "income";
    const amountVal = parseFloat(newTx.amount);
    const finalAmount = isIncome ? Math.abs(amountVal) : -Math.abs(amountVal);

    const txObj = {
      name: newTx.name,
      amount: finalAmount,
      date: newTx.date || new Date().toISOString().split("T")[0],
      category: newTx.category,
      type: newTx.type,
    };

    if (editData) {
      updateTransaction(editData.id, txObj);
    } else {
      addTransaction(txObj);
    }

    if (onSuccess) onSuccess();
    onClose();
  }

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const currentCatsList =
    newTx.type === "income" ? categories.income : categories.expense;
  const SelectedIcon = CAT_ICONS[newTx.category] || CAT_ICONS.default;

  const modalContent = (
    <div
      onClick={handleBackdropClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(10, 25, 47, 0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: dir,
        padding: "20px",
      }}
    >
      <div
        ref={modalRef}
        className="animate-fadeIn"
        style={{
          background: "#FFF",
          borderRadius: 28,
          padding: "32px",
          width: "100%",
          maxWidth: 460,
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: "#0A192F",
              letterSpacing: -0.5,
            }}
          >
            {editData
              ? dir === "rtl"
                ? "تعديل عملية"
                : "Edit Transaction"
              : t("dash_add_trans_title")}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "#F8FAFC",
              border: "none",
              color: "#94A3B8",
              cursor: "pointer",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 24,
              padding: "12px 16px",
              background: "#F8FAFC",
              borderRadius: 14,
              border: "1px solid #E2E8F0",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="txType"
                checked={newTx.type === "expense"}
                onChange={() =>
                  setNewTx({
                    ...newTx,
                    type: "expense",
                    category: categories.expense[0],
                  })
                }
                style={{ accentColor: "#10B981", width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#475569" }}>
                {t("tx_expense")}
              </span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="txType"
                checked={newTx.type === "income"}
                onChange={() =>
                  setNewTx({
                    ...newTx,
                    type: "income",
                    category: categories.income[0],
                  })
                }
                style={{ accentColor: "#10B981", width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#475569" }}>
                {t("tx_income")}
              </span>
            </label>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#64748B",
              }}
            >
              {t("dash_trans_name")}
            </label>
            <input
              type="text"
              value={newTx.name}
              onChange={(e) => setNewTx({ ...newTx, name: e.target.value })}
              placeholder={t("dash_name_placeholder")}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                outline: "none",
                fontSize: 15,
                fontFamily: "inherit",
                boxSizing: "border-box",
                background: "#FBFDFF",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#10B981")}
              onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "#64748B",
              }}
            >
              {t("dash_trans_amount")}
            </label>
            <input
              type="number"
              value={newTx.amount}
              onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
              placeholder={t("dash_amount_placeholder")}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #E2E8F0",
                outline: "none",
                fontSize: 15,
                fontFamily: "inherit",
                boxSizing: "border-box",
                textAlign: dir === "rtl" ? "right" : "left",
                background: "#FBFDFF",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#10B981")}
              onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* Custom Category Dropdown */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#64748B",
                }}
              >
                {t("dash_trans_cat")}
              </label>

              <div
                onClick={() => setShowCatDropdown(!showCatDropdown)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: showCatDropdown
                    ? "1px solid #10B981"
                    : "1px solid #E2E8F0",
                  background: "#FBFDFF",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                {isLoadingCats ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      color: "#94A3B8",
                    }}
                  >
                    <Loader2 size={18} className="animate-spin" />
                    <span style={{ fontSize: 14 }}>
                      {dir === "rtl" ? "جاري التحميل..." : "Loading..."}
                    </span>
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: "#F1F5F9",
                        color: "#64748B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SelectedIcon size={14} />
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#0A192F",
                      }}
                    >
                      {newTx.category ? t(`cat_${newTx.category}`) : ""}
                    </span>
                  </div>
                )}
                <ChevronDown
                  size={18}
                  color="#94A3B8"
                  style={{
                    transform: showCatDropdown ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </div>

              {/* Dropdown Menu */}
              {showCatDropdown && !isLoadingCats && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    [dir === "rtl" ? "right" : "left"]: 0,
                    width: "100%",
                    marginTop: 8,
                    background: "#FFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                    zIndex: 10,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {currentCatsList?.map((cat) => {
                    const IconComp = CAT_ICONS[cat] || CAT_ICONS.default;
                    const isSelected = newTx.category === cat;
                    return (
                      <div
                        key={cat}
                        onClick={() => {
                          setNewTx({ ...newTx, category: cat });
                          setShowCatDropdown(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          background: isSelected ? "#F0FDF4" : "#FFF",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "#F8FAFC";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected)
                            e.currentTarget.style.background = "#FFF";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: isSelected ? "#DCFCE7" : "#F1F5F9",
                              color: isSelected ? "#10B981" : "#64748B",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <IconComp size={16} />
                          </div>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: isSelected ? 700 : 500,
                              color: isSelected ? "#059669" : "#475569",
                            }}
                          >
                            {t(`cat_${cat}`)}
                          </span>
                        </div>
                        {isSelected && <Check size={16} color="#10B981" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#64748B",
                }}
              >
                {t("dash_trans_date")}
              </label>
              <DatePicker
                selected={new Date(newTx.date)}
                onChange={(date) => {
                  if (date)
                    setNewTx({
                      ...newTx,
                      date: date.toISOString().split("T")[0],
                    });
                }}
                locale={lang === "ar" ? ar : enUS}
                dateFormat="yyyy/MM/dd"
                customInput={
                  <input
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: 14,
                      border: "1px solid #E2E8F0",
                      outline: "none",
                      fontSize: 15,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      background: "#FBFDFF",
                      color: "#0A192F",
                      cursor: "pointer",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#10B981")}
                    onBlur={(e) => (e.target.style.borderColor = "#E2E8F0")}
                  />
                }
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "14px",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              color: "#64748B",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#F1F5F9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F8FAFC";
            }}
          >
            {t("dash_cancel")}
          </button>
          <button
            disabled={isLoadingCats}
            onClick={handleSave}
            style={{
              flex: 1,
              padding: "14px",
              background: isLoadingCats ? "#A7F3D0" : "#10B981",
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              color: "#FFF",
              cursor: isLoadingCats ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: isLoadingCats
                ? "none"
                : "0 4px 12px rgba(16,185,129,0.2)",
            }}
            onMouseEnter={(e) => {
              if (!isLoadingCats) e.currentTarget.style.background = "#059669";
            }}
            onMouseLeave={(e) => {
              if (!isLoadingCats) e.currentTarget.style.background = "#10B981";
            }}
          >
            {editData ? (dir === "rtl" ? "تعديل" : "Update") : t("dash_save")}
          </button>
        </div>
      </div>
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

  return createPortal(modalContent, document.body);
}
