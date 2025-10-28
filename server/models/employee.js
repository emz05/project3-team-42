const pool = require('../database');

const Employee = {
    //
    getEmployeePassword: async (password) => {
        const res = await pool.query(
            'SELECT id, password, first_name, last_name, role FROM Employee WHERE password = $1 LIMIT 1',
            [password]
        );
        return res.rows[0];
    }
}

module.exports = Employee;