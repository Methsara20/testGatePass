const db = require('../config/db'); // adjust based on your structure

// Get all departments
exports.getAllDepartments = (req, res) => {
  db.query('SELECT * FROM departments ORDER BY department_id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Add a new department
exports.addDepartment = (req, res) => {
  const { department_name } = req.body;
  if (!department_name) return res.status(400).json({ error: 'Department name required' });

  db.query('INSERT INTO departments (department_name) VALUES (?)', [department_name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Department added successfully', department_id: result.insertId });
  });
};

// Delete a department
exports.deleteDepartment = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM departments WHERE department_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Department deleted successfully' });
  });
};

// Update a department
exports.updateDepartment = (req, res) => {
  const { id } = req.params;
  const { department_name } = req.body;

  db.query('UPDATE departments SET department_name = ? WHERE department_id = ?', [department_name, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Department updated successfully' });
  });
};
