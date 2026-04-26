/**
 * Register Page — صفحة إنشاء الحساب
 *
 * التصميم: Split Layout (مطابق تماماً لصفحة Login)
 *   Primary   #0A192F — Branding panel + Headers
 *   Secondary #10B981 — Register button + Accents
 *   Neutral   #64748B — Secondary text
 *
 * الحقول:
 *   - الاسم الكامل (Full Name)
 *   - البريد الإلكتروني (Email)
 *   - كلمة المرور + مؤشر القوة (Password + Strength)
 *   - تأكيد كلمة المرور (Confirm Password)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Wallet, TrendingUp, Shield, Globe, User, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── Fonts ──────────────────────────────────────────────────────
const FONT = {
  ar: { headline: "'Manrope', 'Cairo', sans-serif", body: "'Cairo', 'Inter', sans-serif" },
  en: { headline: "'Manrope', sans-serif",          body: "'Inter', sans-serif" },
};

// ── Stats (نفس الـ Login) ──────────────────────────────────────
const STATS = [
  { key: 'stat1_label', value: '$124,500', icon: Wallet },
  { key: 'stat2_label', value: '+23.7%',  icon: TrendingUp },
  { key: 'stat3_label', value: '48K+',    icon: Shield },
];

// ── Google Icon ────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Password Strength Meter ────────────────────────────────────
function getStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8)               score++;
  if (/[A-Z]/.test(pwd))             score++;
  if (/[0-9]/.test(pwd))             score++;
  if (/[^A-Za-z0-9]/.test(pwd))      score++;
  return score; // 0-4
}

function StrengthBar({ password, font, t }) {
  const score = getStrength(password);
  if (!password) return null;

  const segments = [
    { minScore: 1, color: '#EF4444' },  // weak  — red
    { minScore: 2, color: '#F59E0B' },  // fair  — amber
    { minScore: 3, color: '#10B981' },  // good  — green
    { minScore: 4, color: '#059669' },  // strong — dark green
  ];

  const activeColor = score <= 1 ? '#EF4444'
    : score === 2 ? '#F59E0B'
    : score === 3 ? '#10B981'
    : '#059669';

  const label = score <= 1 ? t('password_strength_weak')
    : score === 2 ? t('password_strength_fair')
    : t('password_strength_strong');

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: score >= i ? activeColor : '#E2E8F0',
            transition: 'background 0.25s',
          }} />
        ))}
      </div>
      <div style={{
        fontFamily: font.body,
        fontSize: 11,
        color: activeColor,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        {score >= 3 && <Check size={11} />}
        {label}
      </div>
    </div>
  );
}

// ── Branding Panel (identical to Login) ───────────────────────
function BrandingPanel() {
  const { t, lang } = useLanguage();
  const font = FONT[lang];

  return (
    <div style={{
      flex: 1,
      background: '#0A192F',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '48px 52px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '100%',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -80,  right: -80,  width: 300, height: 300, borderRadius: '50%', background: 'rgba(16,185,129,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(59,130,246,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', left: '60%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(16,185,129,0.04)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 44, height: 44, background: '#10B981',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 24, color: '#FFFFFF'
        }}>
          P
        </div>
        <div>
          <div style={{ fontFamily: font.headline, fontWeight: 800, fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3 }}>Prosperity</div>
          <div style={{ fontFamily: font.body, fontSize: 11, color: '#64748B', marginTop: 1 }}>{lang === 'ar' ? 'ذكاء الثروة' : 'Wealth Intelligence'}</div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ width: 40, height: 3, background: '#10B981', borderRadius: 2, marginBottom: 20 }} />
        <h2 style={{
          fontFamily: font.headline,
          fontSize: lang === 'ar' ? 36 : 38,
          fontWeight: 800,
          color: '#FFFFFF',
          lineHeight: 1.25,
          letterSpacing: lang === 'ar' ? -0.5 : -1,
          margin: '0 0 16px',
        }}>
          {t('brand_headline')}
        </h2>
        <p style={{ fontFamily: font.body, fontSize: 15, color: '#94A3B8', lineHeight: 1.7, maxWidth: 360, margin: 0 }}>
          {t('brand_sub')}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
        {STATS.map(({ key, value, icon: Icon }) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={17} color="#10B981" />
            </div>
            <div>
              <div style={{ fontFamily: font.headline, fontSize: 16, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.3 }}>{value}</div>
              <div style={{ fontFamily: font.body, fontSize: 11, color: '#64748B', marginTop: 2 }}>{t(key)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Input Field Helper ─────────────────────────────────────────
function Field({ id, label, children, error, font }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: '#0A192F' }}>
        {label}
      </label>
      {children}
      {error && (
        <span style={{ fontFamily: font.body, fontSize: 12, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ── Register Form Panel ────────────────────────────────────────
function FormPanel({ onRegister }) {
  const { t, lang, dir, toggleLang } = useLanguage();
  const font = FONT[lang];

  const [fullname,    setFullname]    = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});

  // ── Input style factory ──────────────────────────────────────
  function inputStyle(hasError) {
    return {
      width: '100%',
      padding: '11px 14px',
      fontFamily: font.body,
      fontSize: 14,
      color: '#0A192F',
      background: '#F8FAFC',
      border: `1.5px solid ${hasError ? '#EF4444' : '#E2E8F0'}`,
      borderRadius: 8,
      outline: 'none',
      boxSizing: 'border-box',
      transition: 'border-color 0.18s, box-shadow 0.18s',
      direction: 'ltr',
      textAlign: dir === 'rtl' ? 'right' : 'left',
    };
  }

  function handleFocus(e) {
    e.target.style.borderColor = '#10B981';
    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)';
  }
  function handleBlur(e, hasErr) {
    e.target.style.borderColor = hasErr ? '#EF4444' : '#E2E8F0';
    e.target.style.boxShadow = 'none';
  }

  // ── Validation ───────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!fullname.trim() || fullname.trim().length < 2)
      errs.fullname = t('err_fullname');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = t('err_email');
    if (!password || password.length < 6)
      errs.password = t('err_password');
    if (!confirm || confirm !== password)
      errs.confirm = t('err_confirm');
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    await new Promise(r => setTimeout(r, 1600));
    setLoading(false);
    if (onRegister) onRegister({ fullname, email, password });
  }

  function clearErr(field) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  return (
    <div style={{
      width: 500,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '44px 56px',
      background: '#FFFFFF',
      minHeight: '100%',
      position: 'relative',
      overflowY: 'auto',
    }}>
      {/* Language Toggle */}
      <button
        type="button"
        onClick={toggleLang}
        title="تبديل اللغة / Switch language"
        style={{
          position: 'absolute',
          top: 24,
          [dir === 'rtl' ? 'left' : 'right']: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 14px',
          background: '#F8FAFC',
          border: '1.5px solid #E2E8F0',
          borderRadius: 20,
          cursor: 'pointer',
          fontFamily: font.body,
          fontSize: 12,
          fontWeight: 600,
          color: '#0A192F',
          transition: 'all 0.18s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.color = '#10B981'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#0A192F'; }}
      >
        <Globe size={13} />
        {t('switch_lang')}
      </button>

      {/* Header */}
      <div style={{ marginBottom: 28, paddingTop: 8 }}>
        <h1 style={{
          fontFamily: font.headline,
          fontSize: 26,
          fontWeight: 800,
          color: '#0A192F',
          margin: '0 0 8px',
          letterSpacing: -0.5,
        }}>
          {t('register_title')}
        </h1>
        <p style={{ fontFamily: font.body, fontSize: 13, color: '#64748B', margin: 0 }}>
          {t('register_subtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Full Name */}
        <Field id="reg-fullname" label={t('fullname_label')} error={errors.fullname} font={font}>
          <div style={{ position: 'relative' }}>
            <input
              id="reg-fullname"
              type="text"
              value={fullname}
              onChange={e => { setFullname(e.target.value); clearErr('fullname'); }}
              placeholder={t('fullname_placeholder')}
              autoComplete="name"
              style={{ ...inputStyle(!!errors.fullname), paddingLeft: 40 }}
              onFocus={handleFocus}
              onBlur={e => handleBlur(e, !!errors.fullname)}
            />
            <User size={15} color="#94A3B8" style={{ position: 'absolute', top: '50%', left: 13, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </Field>

        {/* Email */}
        <Field id="reg-email" label={t('email_label')} error={errors.email} font={font}>
          <input
            id="reg-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); clearErr('email'); }}
            placeholder={t('email_placeholder')}
            autoComplete="email"
            style={inputStyle(!!errors.email)}
            onFocus={handleFocus}
            onBlur={e => handleBlur(e, !!errors.email)}
          />
        </Field>

        {/* Password + Strength */}
        <Field id="reg-password" label={t('password_label')} error={errors.password} font={font}>
          <div style={{ position: 'relative' }}>
            <input
              id="reg-password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); clearErr('password'); }}
              placeholder={t('password_placeholder')}
              autoComplete="new-password"
              style={{ ...inputStyle(!!errors.password), paddingLeft: 40 }}
              onFocus={handleFocus}
              onBlur={e => handleBlur(e, !!errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: 'absolute', top: '50%', left: 12,
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94A3B8', padding: 0, display: 'flex', alignItems: 'center',
                transition: 'color 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#0A192F'}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Password Strength */}
          <StrengthBar password={password} font={font} t={t} />
        </Field>

        {/* Confirm Password */}
        <Field id="reg-confirm" label={t('confirm_password_label')} error={errors.confirm} font={font}>
          <div style={{ position: 'relative' }}>
            <input
              id="reg-confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); clearErr('confirm'); }}
              placeholder={t('confirm_password_placeholder')}
              autoComplete="new-password"
              style={{ ...inputStyle(!!errors.confirm), paddingLeft: 40 }}
              onFocus={handleFocus}
              onBlur={e => handleBlur(e, !!errors.confirm)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(p => !p)}
              style={{
                position: 'absolute', top: '50%', left: 12,
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94A3B8', padding: 0, display: 'flex', alignItems: 'center',
                transition: 'color 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#0A192F'}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            {/* Match indicator */}
            {confirm && !errors.confirm && confirm === password && (
              <div style={{
                position: 'absolute', top: '50%', right: 13,
                transform: 'translateY(-50%)',
                color: '#10B981',
              }}>
                <Check size={16} />
              </div>
            )}
          </div>
        </Field>

        {/* Submit Button */}
        <button
          id="reg-submit"
          type="submit"
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '13px',
            background: loading ? '#6EE7B7' : '#10B981',
            color: '#FFFFFF',
            fontFamily: font.headline,
            fontWeight: 700,
            fontSize: 15,
            border: 'none',
            borderRadius: 10,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            letterSpacing: 0.2,
            boxShadow: loading ? 'none' : '0 4px 16px rgba(16,185,129,0.3)',
            marginTop: 2,
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.35)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = loading ? '#6EE7B7' : '#10B981'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 16px rgba(16,185,129,0.3)'; }}
        >
          {loading && (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 0.85s linear infinite', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          )}
          {t('register_btn')}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          <span style={{ fontFamily: font.body, fontSize: 12, color: '#94A3B8', flexShrink: 0 }}>{t('divider')}</span>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        </div>

        {/* Google */}
        <button
          type="button"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            width: '100%', padding: '11px',
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            cursor: 'pointer',
            fontFamily: font.body, fontWeight: 600, fontSize: 14, color: '#0A192F',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,25,47,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <GoogleIcon />
          {t('google_register_btn')}
        </button>
      </form>

      {/* Terms */}
      <p style={{
        marginTop: 16,
        textAlign: 'center',
        fontFamily: font.body,
        fontSize: 11,
        color: '#94A3B8',
        lineHeight: 1.6,
      }}>
        {t('terms_text')}{' '}
        <a href="#" style={{ color: '#0A192F', fontWeight: 600, textDecoration: 'none' }}>{t('terms_link')}</a>
        {' '}{t('and')}{' '}
        <a href="#" style={{ color: '#0A192F', fontWeight: 600, textDecoration: 'none' }}>{t('privacy_link')}</a>
      </p>

      {/* ── Link to Login ── */}
      <p style={{
        marginTop: 20,
        textAlign: 'center',
        fontFamily: font.body,
        fontSize: 13,
        color: '#64748B',
        paddingBottom: 4,
      }}>
        {t('have_account')}{' '}
        <Link
          to="/login"
          style={{
            color: '#0A192F',
            fontWeight: 700,
            textDecoration: 'none',
            transition: 'color 0.18s',
          }}
          onMouseEnter={e => e.target.style.color = '#10B981'}
          onMouseLeave={e => e.target.style.color = '#0A192F'}
        >
          {t('login_link')}
        </Link>
      </p>
    </div>
  );
}

// ── Main Register Page ─────────────────────────────────────────
function RegisterContent({ onRegister }) {
  const { dir, lang } = useLanguage();
  const font = FONT[lang];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      direction: dir,
      fontFamily: font.body,
      background: '#EFF3FA',
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        flexDirection: dir === 'rtl' ? 'row-reverse' : 'row',
      }}>
        <BrandingPanel />
        <FormPanel onRegister={onRegister} />
      </div>
    </div>
  );
}

export default function Register({ onRegister }) {
  return <RegisterContent onRegister={onRegister} />;
}
