const express = require('express');
const router = express.Router();
const Employee = require('../models/employee');

// GET /api/employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.listEmployees();
    res.json({ employees });
  } catch (e) {
    console.error('EMPLOYEE_LIST_FAILED', e);
    res.status(500).json({ error: 'EMPLOYEE_LIST_FAILED', details: e.message });
  }
});

// POST /api/employees
router.post('/', async (req, res) => {
  try {
    const { first_name, last_name, role, password, phone_number } = req.body || {};
    if (!first_name || !last_name || !role || !password || !phone_number) {
      return res.status(400).json({ error: 'MISSING_FIELDS' });
    }
    const created = await Employee.createEmployee({
      first_name, last_name, role, password, phone_number
    });
    res.status(201).json(created);
  } catch (e) {
    console.error('EMPLOYEE_CREATE_FAILED', e);
    res.status(500).json({ error: 'EMPLOYEE_CREATE_FAILED', details: e.message });
  }
});

// PATCH /api/employees/:id
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    const { first_name, last_name, role, phone_number } = req.body || {};
    if (!first_name && !last_name && !role && !phone_number) {
      return res.status(400).json({ error: 'NO_FIELDS_TO_UPDATE' });
    }

    const fields = {};
    if (first_name) fields.first_name = first_name.trim();
    if (last_name) fields.last_name = last_name.trim();
    if (role) fields.role = role.trim();
    if (phone_number) fields.phone_number = phone_number.trim();

    const set = Object.keys(fields).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = Object.values(fields);

    const { rows } = await require('../database').query(
      `UPDATE Employee SET ${set}
       WHERE id = $${values.length + 1}
       RETURNING id, first_name, last_name, role, phone_number`,
      [...values, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(rows[0]);
  } catch (e) {
    console.error('EMPLOYEE_UPDATE_FAILED', e);
    res.status(500).json({ error: 'EMPLOYEE_UPDATE_FAILED', details: e.message });
  }
});

// GET /api/employees/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'INVALID_ID' });

    const { rows } = await require('../database').query(
      `SELECT id, first_name, last_name, role, phone_number
       FROM Employee
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(rows[0]);
  } catch (e) {
    console.error('EMPLOYEE_DETAIL_FAILED', e);
    res.status(500).json({ error: 'EMPLOYEE_DETAIL_FAILED', details: e.message });
  }
});



module.exports = router;
