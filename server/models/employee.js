const pool = require('../database');

const Employee = {
    // queries DB for employee matching given password
    // returns first matching employee's data
    getEmployeePassword: async (password) => {
        const res = await pool.query(
            'SELECT id, password, first_name, last_name, role FROM Employee WHERE password = $1 LIMIT 1',
            [password]
        );
        return res.rows[0];
    }
}

// list all employees (for manager view)
async function listEmployees(connection = pool) {
  const { rows } = await connection.query(
    'SELECT id, password, first_name, last_name, role, phone_number FROM Employee ORDER BY id ASC'
  );
  return rows;
}

// create a new employee (manager view)
async function createEmployee(
  { first_name, last_name, role, password, phone_number },
  connection = pool
) {
  if (!first_name || !last_name || !role || !password || !phone_number) {
    throw new Error('MISSING_FIELDS');
  }

  const { rows } = await connection.query(
    `INSERT INTO Employee (first_name, last_name, role, password, phone_number)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, first_name, last_name, role, phone_number`,
    [
      first_name.trim(),
      last_name.trim(),
      role.trim(),
      password.trim(),
      phone_number.trim()
    ]
  );
  return rows[0];
}



module.exports = {
  ...Employee,
  listEmployees,
  createEmployee,   
};
