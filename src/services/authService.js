/**
 * ============================================================
 *  🔐 Auth Service — خدمة المصادقة
 *  يدير: تسجيل الدخول، إنشاء الحساب، تسجيل الخروج
 *  Real API only
 * ============================================================
 */

import api, { postRequest, getRequest, setAuthToken } from './api';

const ALLOW_LOCAL_AUTH_FALLBACK = false;

// ── قراءة حالة تسجيل الدخول ────────────────────────────────
export function isAuthenticated() {
  const token =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken');

  if (!ALLOW_LOCAL_AUTH_FALLBACK && token === 'mock_token_prosperity_v1') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    return false;
  }

  return !!token;
}

export function getCurrentUser() {
  return localStorage.getItem('auth_user') || 'Guest';
}

export function getCurrentEmail() {
  return localStorage.getItem('auth_email') || '';
}

export function getAuthToken() {
  const token =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    '';

  if (!ALLOW_LOCAL_AUTH_FALLBACK && token === 'mock_token_prosperity_v1') {
    return '';
  }

  return token;
}

// ── دالة مساعدة لحفظ الجلسة ────────────────────────────────
async function saveSession(token, refreshToken, user) {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('token', token);
  localStorage.setItem('accessToken', token);
  // Ensure immediate Authorization header for the very next request.
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
  setAuthToken(token);
  await Promise.resolve();
  if (refreshToken) localStorage.setItem('auth_refresh_token', refreshToken);
  if (user) {
    const name = user.fullName || user.email?.split('@')[0] || 'User';
    localStorage.setItem('auth_user', name);
    localStorage.setItem('auth_email', user.email || '');
    if (user.id) localStorage.setItem('auth_user_id', user.id);
  }
}

function extractApiErrors(error, fallbackMessage) {
  const data = error?.response?.data;
  if (!data) return [fallbackMessage];

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors;
  }

  if (data.errors && typeof data.errors === 'object') {
    const modelStateErrors = Object.values(data.errors).flat().filter(Boolean);
    if (modelStateErrors.length > 0) return modelStateErrors;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return [data.message];
  }

  return [fallbackMessage];
}

// ── تسجيل الدخول (API) ──────────────────────────
/**
 * @returns {{ success: boolean, errors?: string[], fallback?: boolean }}
 */
export async function loginUser({ email, password, fullname }) {
  try {
    const res = await postRequest('/api/Auth/login', { email, password });
    const token = res?.token || res?.data?.token;
    const refreshToken = res?.refreshToken || res?.data?.refreshToken;
    const user = res?.user || res?.data?.user || { email, fullName: fullname || email?.split('@')[0] };

    if (token) {
      await saveSession(token, refreshToken, user);
      localStorage.setItem(`onboardingComplete_${email}`, 'true');
      return { success: true, token, user };
    }
    return { success: false, errors: res?.errors || ['فشل تسجيل الدخول'] };
  } catch (error) {
    console.log(error?.response?.data);
    return { success: false, errors: extractApiErrors(error, 'فشل تسجيل الدخول') };
  }
}

// ── إنشاء حساب (API) ────────────────────────────
/**
 * @returns {{ success: boolean, errors?: string[], fallback?: boolean }}
 */
export async function registerUser({
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  monthlyIncome,
  monthlyExpenses,
  financialGoal,
}) {
  try {
    const payload = {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      monthlyIncome: Number(monthlyIncome),
      monthlyExpenses: Number(monthlyExpenses),
      financialGoal,
    };

    const res = await postRequest('/api/Auth/register', payload);
    const token = res?.token || res?.data?.token;
    const refreshToken = res?.refreshToken || res?.data?.refreshToken;
    const user = res?.user || res?.data?.user || { email, fullName: `${firstName} ${lastName}`.trim() };

    const registerSucceeded =
      Boolean(token) ||
      res?.success === true ||
      res?.isSuccess === true ||
      res?.data?.success === true ||
      res?.data?.isSuccess === true ||
      (typeof res?.message === 'string' &&
        /(success|created|registered|نجاح|تم)/i.test(res.message)) ||
      (typeof res?.data?.message === 'string' &&
        /(success|created|registered|نجاح|تم)/i.test(res.data.message));

    if (token) {
      await saveSession(token, refreshToken, user);
      return { success: true, token, user };
    }
    if (registerSucceeded) {
      return { success: true, user, token: null };
    }
    return { success: false, errors: res?.errors || ['فشل إنشاء الحساب'] };
  } catch (error) {
    console.log(error?.response?.data);
    return { success: false, errors: extractApiErrors(error, 'فشل إنشاء الحساب') };
  }
}

// ── تسجيل الخروج ─────────────────────────────────────────
export async function logoutUser() {
  try {
    const refreshToken = localStorage.getItem('auth_refresh_token');
    if (refreshToken) {
      await postRequest('/api/Auth/logout', refreshToken);
    }
  } catch (err) {
    console.warn('[Auth] Logout API call failed:', err.message);
  } finally {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('auth_user_id');
    setAuthToken('');
    window.location.href = '/login';
  }
}

// ── جلب بيانات المستخدم الحالي ──────────────────────────────
export async function getCurrentUserProfile() {
  try {
    return await getRequest('/api/Auth/me');
  } catch (err) {
    console.warn('[Auth] Could not fetch user profile:', err.message);
    return { email: getCurrentEmail(), fullName: getCurrentUser() };
  }
}
