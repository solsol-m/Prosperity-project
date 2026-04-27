/**
 * ============================================================
 *  🎯 Goal Service — خدمة الأهداف المالية
 *  Real API only
 * ============================================================
 */

import api from './api';
import { getAuthToken, getCurrentEmail } from './authService';

// ── Normalize API goal → local format ───────────────────────
function normalizeGoal(g) {
  const title = g.title || g.name || 'Goal';
  const normalizedTitle = String(title).toLowerCase();
  let inferredCategory = g.category || g.goalType;
  if (!inferredCategory) {
    if (normalizedTitle.includes('car') || normalizedTitle.includes('سيار')) inferredCategory = 'car';
    else if (normalizedTitle.includes('travel') || normalizedTitle.includes('سفر')) inferredCategory = 'travel';
    else if (normalizedTitle.includes('home') || normalizedTitle.includes('منزل')) inferredCategory = 'home';
    else if (normalizedTitle.includes('emergency') || normalizedTitle.includes('طوار')) inferredCategory = 'emergency';
    else inferredCategory = 'other';
  }

  return {
    id: g.id,
    name: title,
    subname: g.subname || 'High Priority',
    target: g.targetAmount ?? g.target ?? 0,
    saved: g.currentAmount ?? g.saved ?? 0,
    category: inferredCategory,
    priority: g.priority || 'high',
    dateEst: g.deadline ? g.deadline.split('T')[0] : g.dateEst || null,
    createdAt: g.createdAt || new Date().toISOString(),
  };
}

// ── Default deadline (1 year from now) ──────────────────────
function defaultDeadline() {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
}

function getAuthConfig() {
  const token = getAuthToken();
  return {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

function clearInitialGoalFromBrowser() {
  const email = getCurrentEmail();
  const keys = ['user_goals', email ? `user_goals_${email}` : null].filter(Boolean);
  keys.forEach((key) => localStorage.removeItem(key));
}

// ── GET all goals ────────────────────────────────────────────
export async function fetchGoals() {
  try {
    const { data } = await api.get('/api/Goal', getAuthConfig());
    if (Array.isArray(data)) {
      clearInitialGoalFromBrowser();
      return data.map(normalizeGoal);
    }
    throw new Error('Invalid response');
  } catch (err) {
    console.warn('[GoalService] fetchGoals API failed:', err.message);
    return [];
  }
}

// ── POST create goal ─────────────────────────────────────────
export async function createGoal(goalData) {
  const deadline = goalData.dateEst
    ? new Date(goalData.dateEst).toISOString()
    : defaultDeadline();

  try {
    await api.post('/api/Goal', {
      title: goalData.name,
      targetAmount: Number(goalData.target),
      currentAmount: Number(goalData.saved) || 0,
      deadline,
    }, getAuthConfig());
    return await fetchGoals();
  } catch (err) {
    console.warn('[GoalService] createGoal API failed:', err.message);
    throw err;
  }
}

// ── PUT update goal ──────────────────────────────────────────
export async function modifyGoal(id, goalData) {
  const deadline = goalData.dateEst
    ? new Date(goalData.dateEst).toISOString()
    : defaultDeadline();

  try {
    await api.put(`/api/Goal/${id}`, {
      id,
      title: goalData.name || 'Goal',
      targetAmount: Number(goalData.target) || 1,
      currentAmount: Number(goalData.saved) || 0,
      deadline,
    }, getAuthConfig());
    return await fetchGoals();
  } catch (err) {
    console.warn('[GoalService] modifyGoal API failed:', err.message);
    throw err;
  }
}

// ── DELETE goal ──────────────────────────────────────────────
export async function removeGoal(id) {
  try {
    await api.delete(`/api/Goal/${id}`, getAuthConfig());
    return await fetchGoals();
  } catch (err) {
    console.warn('[GoalService] removeGoal API failed:', err.message);
    throw err;
  }
}
