import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
// axios instance for making API requests
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const employeeAPI = {
    // res: login employee with given password
    // rep: backend returns employee data if valid password
    login: (password) => api.post('/cashier/login', { password }),
};

export const drinkAPI = {
    getDrinks: () => api.get('/cashier/drinks'),
    getDrinksByCategory: (category) => api.get(`/cashier/drinks/${category}`),
};

export const orderAPI = {
    getNextOrderNum: () => api.get('/cashier/next-order-num'),
    processOrder: (orderObjs) => api.post('/cashier/process-order', orderObjs),

};

export const managerAPI = {
    listDrinks: () => api.get('/manager/drinks'),
    addDrink: (payload) => api.post('/manager/drinks', payload),
    updateDrink: (id, payload) => api.put(`/manager/drinks/${id}`, payload),
    deleteDrink: (id) => api.delete(`/manager/drinks/${id}`),
    dashboard: () => api.get('/manager/analytics/dashboard'),
    weeklySales: () => api.get('/manager/analytics/weekly-sales'),
    hourlySales: () => api.get('/manager/analytics/hourly-sales'),
    peakDay: () => api.get('/manager/analytics/peak-day'),
};

export const translationAPI = {
    translate: (text, targetLanguage) =>
        api.post('/translate', { text, targetLanguage}),
};

export const pendingOrderAPI = {
    create: (payload) => api.post('/pending-orders', payload),
    status: (id) => api.get(`/pending-orders/${id}`),
};

export default { employeeAPI, drinkAPI, orderAPI, managerAPI, translationAPI, pendingOrderAPI };
