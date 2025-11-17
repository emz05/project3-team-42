import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// axios instance for making API requests
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ===========================
 * CASHIER / EMPLOYEE
 * =========================== */
export const employeeAPI = {
  // login employee with given password
  login: (password) => api.post('/cashier/login', { password }),
};

/* ===========================
 * DRINKS (Cashier/Kiosk)
 * =========================== */
export const drinkAPI = {
  getDrinks: () => api.get('/cashier/drinks'),
  getDrinksByCategory: (category) => api.get(`/cashier/drinks/${category}`),
};

/* ===========================
 * ORDER PROCESSING (Cashier)
 * =========================== */
export const orderAPI = {
  getNextOrderNum: () => api.get('/cashier/next-order-num'),
  processOrder: (orderObjs) => api.post('/cashier/process-order', orderObjs),
};

/* ===========================
 * MANAGER API (drinks, analytics, employees, inventory, orders)
 * =========================== */
export const managerAPI = {
  /* ----- DRINKS (Menu Management) ----- */
  listDrinks: () => api.get('/manager/drinks'),
  addDrink: (payload) => api.post('/manager/drinks', payload),
  updateDrink: (id, payload) => api.put(`/manager/drinks/${id}`, payload),
  deleteDrink: (id) => api.delete(`/manager/drinks/${id}`),

  /* ----- DASHBOARD ANALYTICS ----- */
  dashboard: () => api.get('/manager/dashboard'),
  weeklySales: () => api.get('/manager/analytics/weekly-sales'),
  hourlySales: () => api.get('/manager/analytics/hourly-sales'),
  peakDay: () => api.get('/manager/analytics/peak-day'),

  /* ----- ORDER HISTORY ----- */
  listOrders: (params) => api.get('/manager/orders', { params }),

  /* ----- EMPLOYEE MANAGEMENT ----- */
  listEmployees: () => api.get('/manager/employees'),
  addEmployee: (payload) => api.post('/manager/employees', payload),
  updateEmployee: (id, payload) => api.put(`/manager/employees/${id}`, payload),

  /* ----- INVENTORY MANAGEMENT ----- */
  listInventory: () => api.get('/manager/inventory'),
  addInventoryItem: (payload) => api.post('/manager/inventory', payload),
  updateInventoryItem: (id, payload) =>
    api.put(`/manager/inventory/${id}`, payload),
};

/* ===========================
 * TRANSLATION API
 * =========================== */
export const translationAPI = {
  translate: (text, targetLanguage) =>
    api.post('/translate', { text, targetLanguage }),
};

/* ===========================
 * PENDING ORDER (Stripe polling)
 * =========================== */
export const pendingOrderAPI = {
  create: (payload) => api.post('/pending-orders', payload),
  status: (id) => api.get(`/pending-orders/${id}`),
};

/* ===========================
 * DEFAULT EXPORT
 * =========================== */
export default {
  employeeAPI,
  drinkAPI,
  orderAPI,
  managerAPI,
  translationAPI,
  pendingOrderAPI,
};
