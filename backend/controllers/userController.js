const db = require('../config/db');

exports.getUsers = (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.addUser = (req, res) => {
    
    const { username, password, full_name, role, email, phone_number, location } = req.body;

    const query = `
        INSERT INTO users (username, password, full_name, role, email, phone_number, location)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [username, password, full_name, role, email, phone_number, location], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    });
};


exports.updateUser = (req, res) => {
    
    const { id } = req.params;
    const { username, full_name, role, email, phone_number, location } = req.body;

    const query = `
        UPDATE users
        SET username = ?, full_name = ?, role = ?, email = ?, phone_number = ?, location = ?
        WHERE id = ?
    `;
    db.query(query, [username, full_name, role, email, phone_number, location, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
};



exports.deleteUser = (req, res) => {
    const { id } = req.params; // Extract `id` from URL parameters

    const query = `
        DELETE FROM users
        WHERE id = ?
    `;
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
};
