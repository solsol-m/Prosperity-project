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
  const isExpense = tx.type === 1;
  return {
    id: tx.id,
    name: tx.description || (isExpense ? 'مصروف' : 'دخل'),
    amount: isExpense ? -Math.abs(tx.amount) : Math.abs(tx.amount),
    date: tx.transactionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    category: (tx.categoryName || '').toLowerCase() || (isExpense ? 'shopping' : 'income'),
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
