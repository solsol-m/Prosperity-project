import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useLanguage } from '../context/LanguageContext';

const SIDEBAR_WIDTH = 264;

export default function MainLayout() {
  const token = localStorage.getItem('auth_token');
  const { dir } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#EFF3FA',
      direction: dir,
    }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`layout-content ${dir}`} style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        overflow: 'hidden',
      }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main
          id="main-content"
          className="animate-fadeIn"
          style={{
            flex: 1,
            padding: '28px 32px',
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>

      <style>{`
        .layout-content { transition: margin 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        @media (min-width: 1024px) {
          .layout-content.rtl { margin-right: ${SIDEBAR_WIDTH}px; }
          .layout-content.ltr { margin-left: ${SIDEBAR_WIDTH}px; }
        }
        @media (max-width: 1023px) {
          main#main-content { padding: 20px 16px !important; }
        }
      `}</style>
    </div>
  );
}
