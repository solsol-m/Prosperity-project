import api from "./api";
import { getCurrentEmail, getAuthToken } from "./authService";

const UI_EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "housing",
  "shopping",
  "utilities",
  "entertainment",
  "investment",
];
const UI_INCOME_CATEGORIES = ["salary", "freelance", "bonus", "investment"];

const CATEGORY_ALIASES = {
  food: ["food", "foods", "food_dining", "food_&_dining", "restaurant", "restaurants", "مطاعم", "طعام", "غذاء"],
  transport: ["transport", "transportation", "taxi", "uber", "مواصلات", "نقل"],
  housing: ["housing", "rent", "home", "سكن", "ايجار", "إيجار"],
  shopping: ["shopping", "shop", "groceries", "تسوق", "مشتريات", "بقالة"],
  utilities: ["utilities", "utility", "bills", "فاتورة", "فواتير", "كهرباء", "ماء"],
  entertainment: ["entertainment", "fun", "movies", "ترفيه", "سينما"],
  salary: ["salary", "payroll", "راتب"],
  freelance: ["freelance", "freelancer", "project_income", "عمل_حر", "عمل حر"],
  bonus: ["bonus", "gift", "هدية", "مكافأة"],
  investment: ["investment", "investing", "stocks", "asset", "portfolio", "savings", "توفير", "استثمار"],
};

function getStorageKey() {
  const email = getCurrentEmail();
  return email ? `user_transactions_${email}` : "user_transactions";
}

function getOnboardingKey() {
  const email = getCurrentEmail();
  return email ? `userOnboardingData_${email}` : "userOnboardingData";
}

function getCategoriesKey() {
  const email = getCurrentEmail();
  return email ? `user_categories_${email}` : "user_categories";
}

function getAuthConfig(params = {}) {
  const token = getAuthToken();
  return {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}

function normalizeCategoryName(name = "") {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

function mapCategoryToUiKey(name = "", fallbackType = "expense") {
  const normalized = normalizeCategoryName(name);
  for (const [uiKey, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some((alias) => normalizeCategoryName(alias) === normalized)) {
      return uiKey;
    }
  }
  return fallbackType === "income" ? "salary" : "shopping";
}

function categoryBelongsToType(uiKey, type) {
  if (type === "income") return UI_INCOME_CATEGORIES.includes(uiKey);
  return UI_EXPENSE_CATEGORIES.includes(uiKey);
}

function normalizeApiTransaction(tx) {
  const rawType = tx.type ?? tx.transactionType ?? 1;
  const description = String(tx.description || tx.name || "").toLowerCase();
  
  // Force Savings Deposit to be Expense
  const isSavingsDeposit = description.includes('إيداع توفير') || description.includes('savings deposit');
  
  const isExpense = Number(rawType) === 1 || isSavingsDeposit;
  const uiType = isExpense ? "expense" : "income";
  
  const rawCategory = tx.categoryName || tx.category?.name || tx.category || "";
  const isGoalAllocation =
    description.includes("تخصيص مبلغ") ||
    description.includes("allocation for") ||
    description.includes("goal allocation") ||
    isSavingsDeposit;

  return {
    id: tx.id,
    name: tx.description || tx.name || (isExpense ? "مصروف" : "دخل"),
    amount: isExpense ? -Math.abs(Number(tx.amount || 0)) : Math.abs(Number(tx.amount || 0)),
    date:
      tx.transactionDate?.split("T")[0] ||
      tx.date?.split?.("T")?.[0] ||
      new Date().toISOString().split("T")[0],
    category: isGoalAllocation ? "investment" : mapCategoryToUiKey(rawCategory, uiType),
    categoryId: tx.categoryId || tx.category?.id || null,
    type: uiType,
  };
}

function writeTransactionsCache(items) {
  localStorage.setItem(getStorageKey(), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("transactions:updated"));
}

function readTransactionsCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(getStorageKey()) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOnboardingCache(profile) {
  localStorage.setItem(getOnboardingKey(), JSON.stringify(profile));
}

function writeCategoriesCache(categories) {
  localStorage.setItem(getCategoriesKey(), JSON.stringify(categories));
}

function readCategoriesCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(getCategoriesKey()) || "{}");
    return parsed?.expense && parsed?.income
      ? parsed
      : { expense: UI_EXPENSE_CATEGORIES, income: UI_INCOME_CATEGORIES, raw: [] };
  } catch {
    return { expense: UI_EXPENSE_CATEGORIES, income: UI_INCOME_CATEGORIES, raw: [] };
  }
}

export function getTransactions() {
  return readTransactionsCache();
}

export async function fetchTransactions(params = {}) {
  try {
    const { data } = await api.get("/api/Transaction", getAuthConfig(params));
    const list = Array.isArray(data) ? data.map(normalizeApiTransaction) : [];
    const sorted = list.sort((a, b) => new Date(b.date) - new Date(a.date));
    writeTransactionsCache(sorted);
    return sorted;
  } catch (err) {
    console.warn("[TransactionService] fetchTransactions failed, using cache:", err.message);
    return readTransactionsCache();
  }
}

async function resolveCategoryId(categoryKey, type, description = "") {
  const categories = await fetchCategories();
  const categoryName = String(categoryKey || "").toLowerCase();
  const pool = categories.raw?.filter((c) => c.type === type) || [];
  const mappedUiKey = mapCategoryToUiKey(categoryName, type);
  const exactMatch =
    pool.find((c) => mapCategoryToUiKey(c.name, type) === mappedUiKey) ||
    categories.raw?.find((c) => normalizeCategoryName(c.name) === normalizeCategoryName(categoryName));
  if (exactMatch?.id) return exactMatch.id;

  try {
    const { data } = await api.get("/api/Category/suggest", getAuthConfig({ description }));
    if (typeof data === "string") return data;
    if (data?.id) return data.id;
  } catch {
    // ignore and fallback to first category
  }

  return pool[0]?.id || categories.raw?.[0]?.id || null;
}

export async function addTransaction(tx) {
  const categoryId = await resolveCategoryId(tx.category, tx.type, tx.name);
  const payload = {
    categoryId,
    amount: Math.abs(Number(tx.amount)),
    type: tx.type === "income" ? 0 : 1,
    description: tx.name || "",
    transactionDate: new Date(tx.date || new Date()).toISOString(),
  };
  await api.post("/api/Transaction", payload, getAuthConfig());
  return await fetchTransactions();
}

export async function updateTransaction(id, updatedData) {
  const categoryId = await resolveCategoryId(
    updatedData.category,
    updatedData.type,
    updatedData.name,
  );
  const payload = {
    id,
    categoryId,
    amount: Math.abs(Number(updatedData.amount)),
    type: updatedData.type === "income" ? 0 : 1,
    description: updatedData.name || "",
    transactionDate: new Date(updatedData.date || new Date()).toISOString(),
  };
  await api.put(`/api/Transaction/${id}`, payload, getAuthConfig());
  return await fetchTransactions();
}

export async function deleteTransaction(id) {
  await api.delete(`/api/Transaction/${id}`, getAuthConfig());
  return await fetchTransactions();
}

export function getOnboardingData() {
  try {
    return JSON.parse(localStorage.getItem(getOnboardingKey()) || "{}");
  } catch {
    return {};
  }
}

export async function fetchUserProfile() {
  try {
    const { data } = await api.get("/api/user-profile", getAuthConfig());
    const normalized = {
      income: Number(data?.monthlyIncome || 0),
      goal: data?.financialGoalType || "emergency",
      goalType: data?.financialGoalType || "emergency",
      goalTitle: data?.financialGoalType || "Emergency Fund",
      targetAmount: Number(data?.targetAmount || 50000),
      currency: data?.preferredCurrency || "ILS",
    };
    writeOnboardingCache(normalized);
    // ثبات العملة: احفظ العملة في مفتاح منفصل لا يُطغى عليه عند Refresh
    if (data?.preferredCurrency && !localStorage.getItem("preferred_currency")) {
      localStorage.setItem("preferred_currency", data.preferredCurrency);
    }
    return normalized;
  } catch (err) {
    console.warn("[TransactionService] fetchUserProfile failed, using cache:", err.message);
    return getOnboardingData();
  }
}

export async function updateUserOnboardingProfile({
  monthlyIncome,
  financialGoalType,
  preferredCurrency,
}) {
  await Promise.all([
    api.post(
      "/api/user-profile/monthly-income",
      { monthlyIncome: Number(monthlyIncome) },
      getAuthConfig(),
    ),
    api.post(
      "/api/user-profile/financial-goal-type",
      { financialGoalType },
      getAuthConfig(),
    ),
    api.post(
      "/api/user-profile/preferred-currency",
      { preferredCurrency },
      getAuthConfig(),
    ),
  ]);
  return await fetchUserProfile();
}

export async function fetchCategories() {
  try {
    const { data } = await api.get("/api/Category", getAuthConfig());
    const list = Array.isArray(data) ? data : [];
    const normalizedRaw = list.map((c) => ({
      id: c.id || c.categoryId,
      name: c.name || c.title || "",
      type:
        Number(c.type ?? c.transactionType ?? c.categoryType ?? 1) === 0
          ? "income"
          : "expense",
    }));
    const expenseKeys = new Set(UI_EXPENSE_CATEGORIES);
    const incomeKeys = new Set(UI_INCOME_CATEGORIES);
    normalizedRaw.forEach((c) => {
      const uiKey = mapCategoryToUiKey(c.name, c.type);
      if (categoryBelongsToType(uiKey, c.type)) {
        if (c.type === "income") incomeKeys.add(uiKey);
        else expenseKeys.add(uiKey);
      }
    });

    const normalized = {
      expense: Array.from(expenseKeys),
      income: Array.from(incomeKeys),
      raw: normalizedRaw,
    };
    writeCategoriesCache(normalized);
    return normalized;
  } catch (err) {
    console.warn("[TransactionService] fetchCategories failed, using cache:", err.message);
    return readCategoriesCache();
  }
}

export function getGoals() {
  const email = getCurrentEmail();
  const key = email ? `user_goals_${email}` : "user_goals";
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
