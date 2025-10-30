import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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


export default { employeeAPI, drinkAPI, orderAPI };
