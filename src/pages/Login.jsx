/**
 * Login Page — صفحة تسجيل الدخول
 *
 * التصميم: Split Layout
 *   AR (RTL): Form يمين ← Branding يسار
 *   EN (LTR): Branding يسار → Form يمين
 *
 * الألوان من الـ Style Guide:
 *   Primary   #0A192F — خلفية الـ Branding panel، الـ header
 *   Secondary #10B981 — زر Login، الـ accents
 *   Neutral   #64748B — النصوص الثانوية
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Wallet, TrendingUp, Shield, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// ── Fonts per language ─────────────────────────────────────────
const FONT = {
  ar: { headline: "'Manrope', 'Cairo', sans-serif", body: "'Cairo', 'Inter', sans-serif" },
  en: { headline: "'Manrope', sans-serif",          body: "'Inter', sans-serif" },
};

// ── Stats shown on the Branding panel ─────────────────────────
const STATS = [
  { key: 'stat1_label', value: '$124,500', icon: Wallet },
  { key: 'stat2_label', value: '+23.7%',  icon: TrendingUp },
  { key: 'stat3_label', value: '48K+',    icon: Shield },
];

// ── Google Icon SVG ────────────────────────────────────────────
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

// ── Branding Panel (Left/Right based on RTL) ──────────────────
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
          <div style={{ fontFamily: font.headline, fontWeight: 800, fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3 }}>
            Prosperity
          </div>
          <div style={{ fontFamily: font.body, fontSize: 11, color: '#64748B', marginTop: 1 }}>
            {lang === 'ar' ? 'ذكاء الثروة' : 'Wealth Intelligence'}
          </div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Accent line */}
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
        <p style={{
          fontFamily: font.body,
          fontSize: 15,
          color: '#94A3B8',
          lineHeight: 1.7,
          maxWidth: 360,
          margin: 0,
        }}>
          {t('brand_sub')}
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
        {STATS.map(({ key, value, icon: Icon }) => (
          <div key={key} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={17} color="#10B981" />
            </div>
            <div>
              <div style={{ fontFamily: font.headline, fontSize: 16, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.3 }}>
                {value}
              </div>
              <div style={{ fontFamily: font.body, fontSize: 11, color: '#64748B', marginTop: 2 }}>
                {t(key)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Login Form Panel ───────────────────────────────────────────
function FormPanel({ onLogin }) {
  const { t, lang, dir, toggleLang } = useLanguage();
  const font = FONT[lang];

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [remember,  setRemember]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [errors,    setErrors]    = useState({});

  // ── Validation ───────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('err_email');
    if (!password || password.length < 6) errs.password = t('err_password');
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    // محاكاة طلب API
    await new Promise(r => setTimeout(r, 1400));
    setLoading(false);

    // Mock Backend Logic
    const savedUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const MOCK_USERS = [
      { email: 'test@test.com', password: '12345678', fullname: 'مستخدم تجريبي' },
      ...savedUsers
    ];

    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      setErrors({ authError: 'not_found' });
      return;
    }
    if (user.password !== password) {
      setErrors({ authError: 'wrong_password' });
      return;
    }

    if (onLogin) onLogin({ email, password, fullname: user.fullname });
  }

  return (
    <div style={{
      width: 480,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '52px 60px',
      background: '#FFFFFF',
      minHeight: '100%',
      position: 'relative',
    }}>
      {/* Language Toggle — top corner */}
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

      {/* Form Header */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{
          fontFamily: font.headline,
          fontSize: 28,
          fontWeight: 800,
          color: '#0A192F',
          margin: '0 0 8px',
          letterSpacing: -0.5,
        }}>
          {t('login_title')}
        </h1>
        <p style={{
          fontFamily: font.body,
          fontSize: 14,
          color: '#64748B',
          margin: 0,
        }}>
          {t('login_subtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: '#0A192F' }}>
            {t('email_label')}
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
            placeholder={t('email_placeholder')}
            autoComplete="email"
            style={{
              padding: '11px 14px',
              fontFamily: font.body,
              fontSize: 14,
              color: '#0A192F',
              background: '#F8FAFC',
              border: `1.5px solid ${errors.email ? '#EF4444' : '#E2E8F0'}`,
              borderRadius: 8,
              outline: 'none',
              transition: 'border-color 0.18s, box-shadow 0.18s',
              direction: 'ltr',      // البريد دائماً LTR
              textAlign: dir === 'rtl' ? 'right' : 'left',
            }}
            onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = errors.email ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
          />
          {errors.email && (
            <span style={{ fontFamily: font.body, fontSize: 12, color: '#EF4444' }}>{errors.email}</span>
          )}
          {errors.authError === 'not_found' && (
            <div style={{
              fontFamily: font.body, fontSize: 12, color: '#EF4444',
              background: '#FEF2F2', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
              flexWrap: 'wrap'
            }}>
              <span>هذا الحساب غير موجود،</span>
              <Link to="/register" style={{ color: '#DC2626', fontWeight: 700, textDecoration: 'underline' }}>
                يرجى إنشاء حساب جديد
              </Link>
            </div>
          )}
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontFamily: font.body, fontSize: 13, fontWeight: 600, color: '#0A192F' }}>
              {t('password_label')}
            </label>
            <button
              type="button"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: font.body, fontSize: 12, fontWeight: 600,
                color: '#10B981', padding: 0,
              }}
            >
              {t('forgot_password')}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
              placeholder={t('password_placeholder')}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '11px 42px 11px 14px',
                fontFamily: font.body,
                fontSize: 14,
                color: '#0A192F',
                background: '#F8FAFC',
                border: `1.5px solid ${errors.password ? '#EF4444' : '#E2E8F0'}`,
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.18s, box-shadow 0.18s',
                direction: 'ltr',
                textAlign: dir === 'rtl' ? 'right' : 'left',
              }}
              onFocus={e => { e.target.style.borderColor = '#10B981'; e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = errors.password ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'none'; }}
            />
            {/* Show/Hide Toggle */}
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              style={{
                position: 'absolute',
                top: '50%', left: 12,
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#94A3B8',
                display: 'flex', alignItems: 'center',
                padding: 0, transition: 'color 0.18s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#0A192F'}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <span style={{ fontFamily: font.body, fontSize: 12, color: '#EF4444' }}>{errors.password}</span>
          )}
          {errors.authError === 'wrong_password' && (
            <span style={{ fontFamily: font.body, fontSize: 12, color: '#EF4444' }}>كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.</span>
          )}
        </div>

        {/* Remember Me */}
        <label style={{
          display: 'flex', alignItems: 'center',
          gap: 10, cursor: 'pointer',
          fontFamily: font.body, fontSize: 13, color: '#64748B',
        }}>
          <input
            id="login-remember"
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            style={{
              width: 16, height: 16,
              accentColor: '#10B981',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          {t('remember_me')}
        </label>

        {/* Submit Button */}
        <button
          id="login-submit"
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
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.35)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = loading ? '#6EE7B7' : '#10B981'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 16px rgba(16,185,129,0.3)'; }}
        >
          {loading ? (
            <>
              {/* Inline spinner */}
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 0.85s linear infinite' }}>
                <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                <path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          ) : null}
          {t('login_btn')}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          <span style={{ fontFamily: font.body, fontSize: 12, color: '#94A3B8', flexShrink: 0 }}>
            {t('divider')}
          </span>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        </div>

        {/* Google Button */}
        <button
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '12px',
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 10,
            cursor: 'pointer',
            fontFamily: font.body,
            fontWeight: 600,
            fontSize: 14,
            color: '#0A192F',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,25,47,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <GoogleIcon />
          {t('google_btn')}
        </button>
      </form>

      {/* Sign Up Link */}
      <p style={{
        marginTop: 28,
        textAlign: 'center',
        fontFamily: font.body,
        fontSize: 13,
        color: '#64748B',
      }}>
        {t('no_account')}{' '}
        <Link to="/register" style={{
          color: '#0A192F',
          fontWeight: 700,
          textDecoration: 'none',
          transition: 'color 0.18s',
        }}
          onMouseEnter={e => e.target.style.color = '#10B981'}
          onMouseLeave={e => e.target.style.color = '#0A192F'}
        >
          {t('signup_link')}
        </Link>
      </p>
    </div>
  );
}

// ── Main Login Page ────────────────────────────────────────────
function LoginContent({ onLogin }) {
  const { dir, lang } = useLanguage();
  const font = FONT[lang];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        direction: dir,
        fontFamily: font.body,
        background: '#EFF3FA',
      }}
    >
      {/*
        RTL (AR): Branding يسار, Form يمين  → flexDirection: row-reverse
        LTR (EN): Branding يسار, Form يمين  → flexDirection: row
        في كلتا الحالتين: Branding على يسار الشاشة، Form على يمين
      */}
      <div style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
        flexDirection: dir === 'rtl' ? 'row-reverse' : 'row',
      }}>
        {/* Branding Panel */}
        <BrandingPanel />

        {/* Form Panel */}
        <FormPanel onLogin={onLogin} />
      </div>
    </div>
  );
}

export default function Login({ onLogin }) {
  return <LoginContent onLogin={onLogin} />;
}
