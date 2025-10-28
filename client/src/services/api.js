import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8081/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const employeeAPI = {
    login: (password) => api.post('/cashier/login', { password }),
};


export default { employeeAPI };
