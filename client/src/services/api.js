import axios from 'axios';

// In dev, use Vite proxy by default (relative '/api'). In prod, use VITE_API_URL if provided.
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || '/api');
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
};

export default { employeeAPI, drinkAPI, orderAPI, managerAPI };
