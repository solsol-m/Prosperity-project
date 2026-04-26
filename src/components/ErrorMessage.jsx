/**
 * ErrorMessage — مكوّن عرض الأخطاء والتنبيهات
 *
 * يستخدم:
 *   - Primary (#0A192F) لخلفية الـ header
 *   - أزرار Outlined & Primary من الـ Style Guide
 *
 * الاستخدام:
 *   <ErrorMessage message="فشل تحميل البيانات" />
 *   <ErrorMessage message={error} onRetry={refetch} />
 *   <ErrorMessage type="warning" message="تحذير..." />
 *   <ErrorMessage type="info"    message="ملاحظة..." />
 *   <ErrorMessage type="success" message="تم بنجاح!" />
 */

// ── Variant Config ─────────────────────────────────────────────
const VARIANTS = {
  error: {
    bg: "#FEF2F2",
    border: "#FECACA",
    headerBg: "#0A192F", // Primary — كحلي
    headerColor: "#FFFFFF",
    iconBg: "#EF4444",
    bodyColor: "#7F1D1D",
    title: "حدث خطأ",
    btnOutlined: {
      color: "#0A192F",
      borderColor: "#0A192F",
    },
  },
  warning: {
    bg: "#FFFBEB",
    border: "#FDE68A",
    headerBg: "#92400E",
    headerColor: "#FFFFFF",
    iconBg: "#F59E0B",
    bodyColor: "#78350F",
    title: "تحذير",
    btnOutlined: {
      color: "#92400E",
      borderColor: "#F59E0B",
    },
  },
  info: {
    bg: "#EFF6FF",
    border: "#BFDBFE",
    headerBg: "#1E3A8A",
    headerColor: "#FFFFFF",
    iconBg: "#3B82F6",
    bodyColor: "#1E3A8A",
    title: "ملاحظة",
    btnOutlined: {
      color: "#1E3A8A",
      borderColor: "#3B82F6",
    },
  },
  success: {
    bg: "#ECFDF5",
    border: "#A7F3D0",
    headerBg: "#065F46",
    headerColor: "#FFFFFF",
    iconBg: "#10B981",
    bodyColor: "#064E3B",
    title: "تم بنجاح",
    btnOutlined: {
      color: "#065F46",
      borderColor: "#10B981",
    },
  },
};

// ── SVG Icons ──────────────────────────────────────────────────
const Icons = {
  error: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
  ),
  warning: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  ),
  info: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  success: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  retry: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.82" />
    </svg>
  ),
  dismiss: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

// ── Component ──────────────────────────────────────────────────
export default function ErrorMessage({
  message = "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.",
  type = "error",
  onRetry = null,
  onDismiss = null,
  title = "",
  compact = false, // وضع مضغوط بدون header شريط
}) {
  const v = VARIANTS[type] || VARIANTS.error;
  const text = message instanceof Error ? message.message : String(message);
  const displayTitle = title || v.title;

  // ── Compact Mode ─────────────────────────────────────────
  if (compact) {
    return (
      <div
        className="animate-fadeIn"
        role="alert"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 16px",
          background: v.bg,
          border: `1.5px solid ${v.border}`,
          borderRadius: 10,
          margin: "8px 0",
        }}
      >
        <span style={{ color: v.iconBg, marginTop: 1, flexShrink: 0 }}>
          {Icons[type] || Icons.error}
        </span>
        <p
          style={{
            fontSize: 13,
            color: v.bodyColor,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.6,
            flex: 1,
            margin: 0,
          }}
        >
          {text}
        </p>
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: v.bodyColor,
              opacity: 0.6,
              padding: 2,
              flexShrink: 0,
            }}
          >
            {Icons.dismiss}
          </button>
        )}
      </div>
    );
  }

  // ── Full Mode ─────────────────────────────────────────────
  return (
    <div
      className="animate-fadeIn"
      role="alert"
      style={{
        background: v.bg,
        border: `1.5px solid ${v.border}`,
        borderRadius: 12,
        overflow: "hidden",
        margin: "16px 0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Header Bar (Primary background) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: v.headerBg, // ← Primary #0A192F للـ error
          color: v.headerColor,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Icon circle */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Icons[type] || Icons.error}
          </div>
          <span
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 0.2,
            }}
          >
            {displayTitle}
          </span>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            title="إغلاق"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              transition: "background 0.18s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
            }
          >
            {Icons.dismiss}
          </button>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "16px 18px 18px" }}>
        <p
          style={{
            fontSize: 14,
            color: v.bodyColor,
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1.7,
            margin: "0 0 16px",
            wordBreak: "break-word",
          }}
        >
          {text}
        </p>

        {/* ── Action Buttons (Outlined + Primary من الـ Style Guide) ── */}
        {onRetry && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* PRIMARY button */}
            <button
              onClick={onRetry}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 20px",
                background: v.headerBg,
                color: "#FFFFFF",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                border: `2px solid ${v.headerBg}`,
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.88";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {Icons.retry}
              إعادة المحاولة
            </button>

            {/* OUTLINED button */}
            <button
              onClick={onDismiss}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 20px",
                background: "transparent",
                color: v.btnOutlined.color,
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 600,
                fontSize: 13,
                border: `2px solid ${v.btnOutlined.borderColor}`,
                borderRadius: 8,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = v.headerBg;
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = v.headerBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = v.btnOutlined.color;
                e.currentTarget.style.borderColor = v.btnOutlined.borderColor;
              }}
            >
              {Icons.dismiss}
              تجاهل
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
