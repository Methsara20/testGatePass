// const db = require('../config/db'); // adjust based on your structure

// // Get all departments
// exports.getAllDepartments = (req, res) => {
//   db.query('SELECT * FROM departments ORDER BY department_id DESC', (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(rows);
//   });
// };

// // Add a new department
// exports.addDepartment = (req, res) => {
//   const { department_name, status } = req.body;
//   if (!department_name) return res.status(400).json({ error: 'Department name required' });

//   db.query('INSERT INTO departments (department_name, status) VALUES (?, active)', [department_name, status], (err, result) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json({ message: 'Department added successfully', department_id: result.insertId });
//   });
// };

// // Delete a department
// exports.deleteDepartment = (req, res) => {
//   const { id } = req.params;
//   db.query('DELETE FROM departments WHERE department_id = ?', [id], (err) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json({ message: 'Department deleted successfully' });
//   });
// };

// // Update a department
// exports.updateDepartment = (req, res) => {
//   const { id } = req.params;
//   const { department_name } = req.body;

//   db.query('UPDATE departments SET department_name = ?, status = ? WHERE department_id = ?', [department_name, id], (err) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json({ message: 'Department updated successfully' });
//   });
// };


const db = require('../config/db');

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

  const query = 'INSERT INTO departments (department_name, status) VALUES (?, ?)';
  db.query(query, [department_name, 'active'], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Department added successfully', department_id: result.insertId });
  });
};

// Delete a department
exports.deleteDepartment = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM departments WHERE department_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  });
};

// Update a department
exports.updateDepartment = (req, res) => {
  const { id } = req.params;
  const { department_name, status } = req.body;

  const query = 'UPDATE departments SET department_name = ?, status = ? WHERE department_id = ?';
  db.query(query, [department_name, status, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department updated successfully' });
  });
};



// Get ONLY active departments → for Login & Gate Pass form
exports.getActiveDepartments = (req, res) => {
  db.query(
    "SELECT * FROM departments WHERE status = 'active' ORDER BY department_id ASC",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};
