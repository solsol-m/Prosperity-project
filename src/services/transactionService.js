/**
 * ============================================================
 *  💰 Transaction Service — خدمة العمليات المالية
 *  يدير: جلب، إضافة، حذف العمليات
 * ============================================================
 *
 *  حالياً: يعمل بـ localStorage (Mock Mode)
 *  مستقبلاً: استبدل الدوال أدناه باستدعاءات API حقيقية
 *
 * ============================================================
 */

// TODO (أنيس): روابط الـ Transactions endpoints
//   GET    /api/transactions          ← جلب كل عمليات المستخدم (يتطلب Auth Token)
//   POST   /api/transactions          ← إضافة عملية جديدة
//   DELETE /api/transactions/:id      ← حذف عملية بالـ ID

const STORAGE_KEY = "user_transactions";

// ── دالة جلب كل العمليات ─────────────────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   return await getRequest('/transactions');
 *
 * @returns {Array} مصفوفة العمليات مرتبة تنازلياً حسب التاريخ
 */
export function getTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── دالة إضافة عملية جديدة ───────────────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   return await postRequest('/transactions', tx);
 *
 * @param {{ name: string, amount: number, category: string, date: string, type: string }} tx
 * @returns {Array} المصفوفة المحدّثة بعد الإضافة
 */
export function addTransaction(tx) {
  const current = getTransactions();
  const newTx = {
    ...tx,
    id: tx.id || Date.now(),
    createdAt: new Date().toISOString(),
  };

  // ترتيب تنازلي حسب التاريخ
  const updated = [newTx, ...current].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// ── دالة تحديث عملية ─────────────────────────────────────────────
/**
 * @param {number} id
 * @param {Object} updatedData
 * @returns {Array} المصفوفة المحدّثة
 */
export function updateTransaction(id, updatedData) {
  const current = getTransactions();
  const updated = current
    .map((tx) => (tx.id === id ? { ...tx, ...updatedData } : tx))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// ── دالة حذف عملية ───────────────────────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   await deleteRequest(`/transactions/${id}`);
 *   return await getTransactions();
 *
 * @param {number} id
 * @returns {Array} المصفوفة بعد الحذف
 */
export function deleteTransaction(id) {
  const updated = getTransactions().filter((tx) => tx.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// ── دالة جلب بيانات الـ Onboarding ─────────────────────────────
/**
 * يُعيد بيانات الإعداد الأولي (الدخل، العملة، الهدف)
 * TODO (أنيس): استبدل بـ: getRequest('/user/profile')
 *
 * @returns {{ income: number, currency: string, goal: string }}
 */
export function getOnboardingData() {
  try {
    return JSON.parse(localStorage.getItem("userOnboardingData") || "{}");
  } catch {
    return {};
  }
}

// ── دالة جلب التصنيفات (محاكاة API) ─────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   return await getRequest('/categories');
 */
export async function fetchCategories() {
  // محاكاة تأخير السيرفر (1 ثانية)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // البيانات القادمة من السيرفر (كأسماء أو Keys)
  return {
    expense: [
      "food",
      "transport",
      "housing",
      "shopping",
      "utilities",
      "entertainment",
    ],
    income: ["salary", "freelance", "bonus", "investment", "gift", "other"],
  };
}
