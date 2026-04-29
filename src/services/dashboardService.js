/**
 * ============================================================
 *  📊 Dashboard Service — خدمة لوحة التحكم
 *  Real API only
 * ============================================================
 */

import api from './api';
import { getAuthToken } from './authService';

function getAuthConfig(params = {}) {
  const token = getAuthToken();
  return {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

// ── Normalize API transaction → local format ─────────────────
// TransactionType enum: 0 = Income, 1 = Expense
export function normalizeApiTransaction(tx) {
  const isSavingsDeposit = (tx.description || '').includes('إيداع توفير') || (tx.description || '').includes('Savings Deposit');
  const isExpense = tx.type === 1 || isSavingsDeposit; // Force savings to be expense
  const rawCategoryName = (tx.categoryName || '').toLowerCase().trim();

  let mappedCategory = isExpense ? 'shopping' : 'income';
  if (isSavingsDeposit) mappedCategory = 'investment';

  if (rawCategoryName && !isSavingsDeposit) {
    if (rawCategoryName.includes('shopping') || rawCategoryName.includes('تسوق') || rawCategoryName.includes('مشتريات')) mappedCategory = 'shopping';
    else if (rawCategoryName.includes('food') || rawCategoryName.includes('طعام') || rawCategoryName.includes('مطاعم') || rawCategoryName.includes('وجبة')) mappedCategory = 'food';
    else if (rawCategoryName.includes('transport') || rawCategoryName.includes('مواصلات') || rawCategoryName.includes('نقل')) mappedCategory = 'transport';
    else if (rawCategoryName.includes('housing') || rawCategoryName.includes('سكن') || rawCategoryName.includes('عقار')) mappedCategory = 'housing';
    else if (rawCategoryName.includes('rent') || rawCategoryName.includes('ايجار') || rawCategoryName.includes('إيجار')) mappedCategory = 'rent';
    else if (rawCategoryName.includes('utilities') || rawCategoryName.includes('فاتورة') || rawCategoryName.includes('فواتير') || rawCategoryName.includes('كهرباء')) mappedCategory = 'utilities';
    else if (rawCategoryName.includes('entertainment') || rawCategoryName.includes('ترفيه') || rawCategoryName.includes('سينما')) mappedCategory = 'entertainment';
    else if (rawCategoryName.includes('salary') || rawCategoryName.includes('راتب')) mappedCategory = 'salary';
    else if (rawCategoryName.includes('freelance') || rawCategoryName.includes('عمل حر') || rawCategoryName.includes('عمل_حر')) mappedCategory = 'freelance';
    else if (rawCategoryName.includes('bonus') || rawCategoryName.includes('مكافأة') || rawCategoryName.includes('هدية')) mappedCategory = 'bonus';
    else if (rawCategoryName.includes('investment') || rawCategoryName.includes('استثمار')) mappedCategory = 'investment';
    else mappedCategory = rawCategoryName;
  }

  if (!isExpense && !['salary', 'freelance', 'bonus', 'investment', 'income'].includes(mappedCategory)) {
    mappedCategory = 'income';
  }

  return {
    id: tx.id,
    name: tx.description || (isExpense ? 'مصروف' : 'دخل'),
    amount: isExpense ? -Math.abs(tx.amount) : Math.abs(tx.amount),
    date: tx.transactionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    category: mappedCategory,
    type: isExpense ? 'expense' : 'income',
  };
}

// ── GET /api/Dashboard/summary ───────────────────────────────
export async function fetchDashboardSummary(recentCount = 10, months = 6) {
  try {
    const { data } = await api.get('/api/Dashboard/summary', getAuthConfig({ recentCount, months }));

    // Handle different possible field names from API
    const totalIncome = data.totalIncome ?? data.income ?? data.Income ?? 0;
    const totalExpenses = data.totalExpenses ?? data.expenses ?? data.Expenses ?? 0;
    const totalBalance =
      data.netBalance ?? data.balance ?? data.Balance ?? totalIncome - totalExpenses;

    const monthlyOverview = (data.monthlyOverview || data.MonthlyOverview || []).map(
      (m) => ({
        month: m.month || m.Month || '',
        year: m.year || m.Year || new Date().getFullYear(),
        income: m.income ?? m.Income ?? 0,
        expenses: m.expenses ?? m.Expenses ?? 0,
      }),
    );

    const recentTransactions = (
      data.recentTransactions ||
      data.RecentTransactions ||
      []
    ).map(normalizeApiTransaction);

    return {
      success: true,
      totalIncome,
      totalExpenses,
      totalBalance,
      monthlyOverview,
      recentTransactions,
    };
  } catch (err) {
    console.warn('[DashboardService] summary API failed:', err.message);
    return {
      success: false,
      totalIncome: 0,
      totalExpenses: 0,
      totalBalance: 0,
      monthlyOverview: [],
      recentTransactions: [],
    };
  }
}

// ── GET /api/Dashboard/recent-transactions ───────────────────
export async function fetchRecentTransactions(count = 10) {
  try {
    const { data } = await api.get('/api/Dashboard/recent-transactions', getAuthConfig({ count }));
    return Array.isArray(data) ? data.map(normalizeApiTransaction) : [];
  } catch (err) {
    console.warn('[DashboardService] recent-transactions API failed:', err.message);
    return [];
  }
}

// ── SAVINGS BOX API ──────────────────────────────────────────

/**
 * GET /api/savings/summary
 * Returns: { totalSavings, monthlyTarget, currentMonthSaved, remainingForMonth, savingRate, monthlyIncome, monthsRecorded }
 */
export async function fetchSavingsSummary() {
  try {
    const { data } = await api.get('/api/savings/summary', getAuthConfig());
    return {
      success: true,
      totalSavings: Number(data.totalSavings || 0),
      monthlyTarget: Number(data.monthlyTarget || 0),
      currentMonthSaved: Number(data.currentMonthSaved || 0),
      remainingForMonth: Number(data.remainingForMonth || 0),
      savingRate: Number(data.savingRate || 0),
      monthlyIncome: Number(data.monthlyIncome || 0),
    };
  } catch (err) {
    console.warn('[DashboardService] savings/summary failed:', err.message);
    return {
      success: false,
      totalSavings: 0,
      monthlyTarget: 0,
      currentMonthSaved: 0,
      remainingForMonth: 0,
      savingRate: 0,
      monthlyIncome: 0,
    };
  }
}

/**
 * POST /api/savings/deposit
 * Payload: { amount: number, date: string, description: string }
 */
export async function depositSavings(amount, date, desc = "Savings Deposit") {
  try {
    const payload = {
      amount: Number(amount),
      date: date || new Date().toISOString(),
      description: desc,
    };
    await api.post('/api/savings/deposit', payload, getAuthConfig());
    return { success: true };
  } catch (err) {
    console.error('[DashboardService] savings/deposit failed:', err);
    return { success: false, error: err.message };
  }
}
