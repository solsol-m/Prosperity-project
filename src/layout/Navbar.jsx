import { Bell, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { dir, t, lang } = useLanguage();

  const PAGE_TITLES = {
    '/dashboard':    { title: t('nav_dashboard'),  sub: t('page_sub_dash') },
    '/transactions': { title: t('nav_transactions'),    sub: t('page_sub_trans') },
    '/ai-insights':  { title: t('nav_ai'),   sub: t('page_sub_ai') },
    '/goals':        { title: t('nav_goals'),      sub: t('page_sub_goals') },
    '/future':       { title: t('nav_future'),      sub: t('page_sub_future') },
    '/settings':     { title: lang === 'ar' ? 'الإعدادات' : 'Settings',    sub: t('page_sub_settings') },
  };

  const page = PAGE_TITLES[pathname] || { title: 'Prosperity', sub: lang === 'ar' ? 'ذكاء الثروة' : 'Wealth Intelligence' };

  return (
    <header style={{
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      direction: dir
    }}>

      {/* Page Title & Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          className="mobile-menu-btn"
          onClick={onMenuClick}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 8px 8px 0', color: '#0A192F', display: 'none'
          }}
        >
          <Menu size={24} />
        </button>
        <div>
          <h1 style={{
            fontFamily: "'Manrope', 'Cairo', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: '#0A192F',
            margin: 0,
            letterSpacing: -0.2,
          }}>
            {page.title}
          </h1>
          <p className="desktop-sub" style={{
            fontFamily: "'Inter', 'Cairo', sans-serif",
            fontSize: 13,
            color: '#64748B',
            margin: '2px 0 0',
            fontWeight: 500
          }}>
            {page.sub}
          </p>
        </div>
      </div>

      {/* Controls: Only Notification */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <NotifButton />
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .mobile-menu-btn { display: block !important; }
          .desktop-sub { display: none !important; }
          header { padding: 0 20px !important; }
        }
      `}</style>
    </header>
  );
}

function NotifButton() {
  const [hover, setHover] = useState(false);
  return (
    <button
      id="notif-btn"
      aria-label="الإشعارات"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: 44, height: 44,
        background: hover ? '#F1F5F9' : '#FFFFFF',
        border: `1.5px solid ${hover ? '#CBD5E1' : '#E2E8F0'}`,
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: hover ? '#0A192F' : '#64748B',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        boxShadow: hover ? '0 4px 12px rgba(0,0,0,0.03)' : 'none'
      }}
    >
      <Bell size={20} strokeWidth={2} />
      {/* Badge */}
      <span style={{
        position: 'absolute',
        top: 10, right: 10,
        width: 8, height: 8,
        background: '#EF4444',
        borderRadius: '50%',
        border: '2px solid #fff',
      }} />
    </button>
  );
}
