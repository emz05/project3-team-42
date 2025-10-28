import axios from 'axios';

// axios instance for making API requests
const api = axios.create({
    baseURL: 'http://localhost:8081/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const employeeAPI = {
    // res: login employee with given password
    // rep: backend returns employee data if valid password
    login: (password) => api.post('/cashier/login', { password }),
};


export default { employeeAPI };
