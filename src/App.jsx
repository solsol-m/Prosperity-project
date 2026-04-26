/**
 * ============================================================
 *  App.jsx — نظام التوجيه الرئيسي لـ Prosperity
 * ============================================================
 *
 *  هيكل المسارات:
 *    /login        → صفحة تسجيل الدخول      (خارج MainLayout)
 *    /register     → صفحة إنشاء الحساب       (خارج MainLayout)
 *    /onboarding   → إعداد الحساب الأولي     (خارج MainLayout)
 *    /dashboard    → لوحة البيانات           (داخل MainLayout)
 *    /transactions → العمليات المالية         (داخل MainLayout)
 *    /goals        → أهداف الادخار           (داخل MainLayout)
 *    /ai-insights  → رؤى الذكاء الاصطناعي   (داخل MainLayout)
 *    /future       → التخطيط المستقبلي        (داخل MainLayout)
 *
 *  TODO (أنيس): عند ربط الـ Backend، أنشئ AuthContext حقيقي
 *    ويضيف Route Guard يمنع غير المسجلين من الدخول للـ Dashboard
 * ============================================================
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider }  from './context/LanguageContext';
import { loginUser, registerUser } from './services/authService';

// Layout
import MainLayout from './layout/MainLayout';

// Pages — Auth
import Login      from './pages/Login';
import Register   from './pages/Register';
import Onboarding from './pages/Onboarding';

// Pages — App
import Dashboard     from './pages/Dashboard';
import Transactions  from './pages/Transactions';
import Goals         from './pages/Goals';
import AIInsights    from './pages/AIInsights';
import FuturePlanning from './pages/FuturePlanning';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>

          {/* ── صفحات الـ Auth (خارج MainLayout — شاشة كاملة) ── */}
          <Route path="/login"      element={<Login      onLogin={loginUser}          />} />
          <Route path="/register"   element={<Register   onRegister={registerUser}    />} />
          <Route path="/onboarding" element={<Onboarding                              />} />

          {/* ── صفحات التطبيق (داخل MainLayout: Sidebar + Navbar) ── */}
          <Route element={<MainLayout />}>
            {/* إعادة التوجيه من الجذر للداشبورد */}
            <Route index                    element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"        element={<Dashboard      />} />
            <Route path="/transactions"     element={<Transactions   />} />
            <Route path="/goals"            element={<Goals          />} />
            <Route path="/ai-insights"      element={<AIInsights     />} />
            <Route path="/future"           element={<FuturePlanning />} />

            {/* Catch-all: أي مسار غير معروف ← الداشبورد */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
