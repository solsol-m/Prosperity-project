/**
 * LoadingSpinner — مؤشر التحميل
 *
 * يستخدم لون الـ Secondary (#10B981 الأخضر الزمردي) كما في الـ Style Guide.
 *
 * الاستخدام:
 *   <LoadingSpinner />
 *   <LoadingSpinner size="lg" label="جاري تحميل البيانات..." />
 *   <LoadingSpinner fullScreen />
 *   <LoadingSpinner inline />          // داخل سطر نص أو زر
 */

// ── حجم السبينر ──────────────────────────────────────────────
const SIZE_MAP = {
  xs: { ring: 16, stroke: 2, label: 11 },
  sm: { ring: 24, stroke: 2.5, label: 12 },
  md: { ring: 40, stroke: 3.5, label: 13 },
  lg: { ring: 60, stroke: 4,   label: 14 },
  xl: { ring: 80, stroke: 5,   label: 15 },
};

// ── Secondary Green (Style Guide) ────────────────────────────
const COLOR_MAIN  = '#10B981';   // secondary-500
const COLOR_TRACK = '#D1FAE5';   // secondary-100

export default function LoadingSpinner({
  size      = 'md',
  label     = '',
  fullScreen = false,
  inline     = false,
}) {
  const { ring, stroke, label: labelSize } = SIZE_MAP[size] || SIZE_MAP.md;
  const r     = (ring - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = circ * 0.72;   // 72% ممتلئ، 28% فارغ

  // ── SVG Spinner ───────────────────────────────────────────
  const spinnerSVG = (
    <div
      role="status"
      aria-label={label || 'جاري التحميل'}
      style={{
        display: 'flex',
        flexDirection: inline ? 'row' : 'column',
        alignItems: 'center',
        gap: inline ? 8 : 12,
      }}
    >
      {/* حلقة النبض خلف السبينر */}
      <div style={{ position: 'relative', width: ring, height: ring, flexShrink: 0 }}>

        {/* Pulse ring — تشير إلى النشاط */}
        <div
          className="animate-pulse-ring"
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2px solid ${COLOR_MAIN}`,
            opacity: 0.35,
          }}
        />

        {/* SVG Spinner */}
        <svg
          className="animate-spin"
          width={ring}
          height={ring}
          viewBox={`0 0 ${ring} ${ring}`}
          style={{ display: 'block' }}
        >
          {/* Track (المسار الباهت) */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={r}
            fill="none"
            stroke={COLOR_TRACK}
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={r}
            fill="none"
            stroke={COLOR_MAIN}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ * 0.25}
            style={{ filter: `drop-shadow(0 0 4px ${COLOR_MAIN}66)` }}
          />
        </svg>
      </div>

      {/* Label */}
      {label && (
        <span style={{
          fontSize: labelSize,
          color: '#64748B',       // neutral
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          letterSpacing: 0.2,
          whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
      )}
    </div>
  );

  // ── Full Screen Overlay ────────────────────────────────────
  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 20,
          background: 'rgba(10, 25, 47, 0.55)',  // primary overlay
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          zIndex: 9999,
        }}
      >
        {/* Card wrapper */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 8px 40px rgba(10,25,47,0.2)',
        }}>
          {spinnerSVG}
          {!label && (
            <span style={{ fontSize: 13, color: '#64748B', fontFamily: "'Inter', sans-serif" }}>
              جاري التحميل...
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Inline Mode ───────────────────────────────────────────
  if (inline) {
    return spinnerSVG;
  }

  // ── Default (Block centered) ──────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 0',
      gap: 14,
    }}>
      {spinnerSVG}
    </div>
  );
}
