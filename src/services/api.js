/**
 * ============================================================
 *  🔌 API Service Layer — Prosperity
 *  طبقة الخدمات المركزية للتواصل مع الـ Backend
 * ============================================================
 *
 *  📋 طريقة الاستخدام:
 *    import api from '@/services/api';
 *    const data = await api.get('/transactions');
 *
 *  🔧 الإعداد:
 *    - أنشئ ملف .env.local في جذر المشروع
 *    - أضف: VITE_API_BASE_URL=https://your-backend.com/api
 *
 * ============================================================
 */

// ──────────────────────────────────────────────────────────────
//  TODO (أنيس): عند ربط الـ Backend الحقيقي:
//  1. اضبط VITE_API_BASE_URL في ملف .env.local
//  2. تأكد أن الـ Backend يرجع JSON بصيغة: { data: ..., message: ... }
//  3. فعّل الـ withCredentials إذا كنت تستخدم PHP Sessions
// ──────────────────────────────────────────────────────────────

import axios from "axios";

// ── رابط الـ API الأساسي ────────────────────────────────────
// TODO (أنيس): استبدل القيمة الافتراضية برابط الـ Backend الحقيقي
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/prosperity-api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // withCredentials: true, // ← فعّل هذا إذا كنت تستخدم PHP Sessions أو Cookies
});

// ── Request Interceptor ─────────────────────────────────────
// يضيف تلقائياً التوكن من localStorage قبل كل طلب
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ────────────────────────────────────
// يعالج الأخطاء الشائعة بشكل مركزي
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // انتهت الجلسة — أعد التوجيه لصفحة تسجيل الدخول
    if (status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }

    if (status === 403) console.warn("[API] ⛔ ليس لديك صلاحية لهذا المورد");
    if (status === 500)
      console.error("[API] 🔥 خطأ في الخادم — تواصل مع المطوّر");

    const message =
      error.response?.data?.message ||
      error.message ||
      "حدث خطأ غير متوقع، حاول مرة أخرى";

    return Promise.reject(new Error(message));
  },
);

export default api;

// ── دوال مساعدة مختصرة ─────────────────────────────────────
export const getRequest = (endpoint, params = {}) =>
  api.get(endpoint, { params }).then((r) => r.data);
export const postRequest = (endpoint, data = {}) =>
  api.post(endpoint, data).then((r) => r.data);
export const putRequest = (endpoint, data = {}) =>
  api.put(endpoint, data).then((r) => r.data);
export const deleteRequest = (endpoint) =>
  api.delete(endpoint).then((r) => r.data);
