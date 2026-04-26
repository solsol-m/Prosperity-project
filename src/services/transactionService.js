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

const STORAGE_KEY = 'user_transactions';

// ── جلب كل العمليات ─────────────────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   return await getRequest('/transactions');
 *
 * @returns {Array} مصفوفة العمليات مرتبة تنازلياً حسب التاريخ
 */
export function getTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── إضافة عملية جديدة ───────────────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   return await postRequest('/transactions', tx);
 *
 * @param {{ name: string, amount: number, category: string, date: string }} tx
 * @returns {Array} المصفوفة المحدّثة بعد الإضافة
 */
export function addTransaction(tx) {
  const current = getTransactions();
  const newTx = {
    id: Date.now(),
    name: tx.name,
    amount: tx.amount,
    category: tx.category,
    date: tx.date,
    createdAt: new Date().toISOString(),
  };

  // ترتيب تنازلي حسب التاريخ
  const updated = [newTx, ...current].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// ── حذف عملية ───────────────────────────────────────────────
/**
 * TODO (أنيس): استبدل هذه الدالة بـ:
 *   await deleteRequest(`/transactions/${id}`);
 *   return await getTransactions();
 *
 * @param {number} id
 * @returns {Array} المصفوفة بعد الحذف
 */
export function deleteTransaction(id) {
  const updated = getTransactions().filter(tx => tx.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// ── جلب بيانات الـ Onboarding ─────────────────────────────
/**
 * يُعيد بيانات الإعداد الأولي (الدخل، العملة، الهدف)
 * TODO (أنيس): استبدل بـ: getRequest('/user/profile')
 *
 * @returns {{ income: number, currency: string, goal: string }}
 */
export function getOnboardingData() {
  try {
    return JSON.parse(localStorage.getItem('userOnboardingData') || '{}');
  } catch {
    return {};
  }
}
