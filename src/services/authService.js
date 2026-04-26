/**
 * ============================================================
 *  🔐 Auth Service — خدمة المصادقة
 *  يدير عمليات: تسجيل الدخول، إنشاء الحساب، تسجيل الخروج
 * ============================================================
 *
 *  حالياً: يعمل بـ localStorage (Mock Mode)
 *  مستقبلاً: استبدل الدوال أدناه باستدعاءات API حقيقية
 *
 * ============================================================
 */

// TODO (أنيس): روابط الـ Auth endpoints
//   POST /api/auth/login     ← بيانات: { email, password }
//   POST /api/auth/register  ← بيانات: { fullname, email, password }
//   POST /api/auth/logout    ← لا يحتاج بيانات (يمسح التوكن من الخادم)
//   GET  /api/auth/me        ← يجيب ببيانات المستخدم الحالي من التوكن

// ── قراءة حالة تسجيل الدخول ────────────────────────────────
/**
 * هل المستخدم مسجل دخول؟
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!localStorage.getItem("auth_token");
}

// ── جلب اسم المستخدم الحالي ────────────────────────────────
/**
 * @returns {string} اسم المستخدم أو "Guest"
 */
export function getCurrentUser() {
  return localStorage.getItem("auth_user") || "Guest";
}

// ── تسجيل الدخول (Mock) ─────────────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   const res = await postRequest('/auth/login', { email, password });
 *   saveSession(res.data.token, res.data.user.fullname);
 *
 * @param {{ email: string, fullname?: string }} user
 */
export function loginUser({ email, fullname }) {
  const mockName = fullname || email.split("@")[0];
  saveSession("mock_token_prosperity_v1", mockName);

  const isOnboarded = localStorage.getItem("onboardingComplete") === "true";
  window.location.href = isOnboarded ? "/dashboard" : "/onboarding";
}

// ── إنشاء حساب (Mock) ─────────────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   const res = await postRequest('/auth/register', { fullname, email, password });
 *   saveSession(res.data.token, res.data.user.fullname);
 *
 * @param {{ fullname: string, email: string, password: string }} data
 */
export function registerUser({ fullname, email, password }) {
  // حفظ المستخدم محلياً ليعمل في شاشة الدخول
  const users = JSON.parse(localStorage.getItem("registered_users") || "[]");
  users.push({ email, fullname, password });
  localStorage.setItem("registered_users", JSON.stringify(users));

  saveSession("mock_token_prosperity_v1", fullname);
  window.location.href = "/onboarding";
}

// ── تسجيل الخروج ─────────────────────────────────────────
/**
 * TODO (أنيس): أضف بعد مسح localStorage:
 *   await postRequest('/auth/logout');
 */
export function logoutUser() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
  window.location.href = "/login";
}

// ── دالة مساعدة داخلية ─────────────────────────────────────
function saveSession(token, name) {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_user", name);
}
