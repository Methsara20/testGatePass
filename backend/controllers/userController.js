const db = require('../config/db');
const bcrypt = require('bcrypt');


exports.getUsers = (req, res) => {
    db.query('SELECT * FROM users ', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.addUser = (req, res) => {
    
    const { username, password, full_name, role, email, phone_number, location, department } = req.body;

    const query = `
        INSERT INTO users (username, password, full_name, role, email, phone_number, location, department)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [username, password, full_name, role, email, phone_number, location, department ], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    });
};


exports.updateUser = (req, res) => {
    
    const { id } = req.params;
    const { username, password, full_name, role, email, phone_number, location, department  } = req.body;

    const query = `
        UPDATE users
        SET username = ?, password = ?, full_name = ?, role = ?, email = ?, phone_number = ?, location = ?, department = ?
        WHERE id = ?
    `;
    db.query(query, [username, password, full_name, role, email, phone_number, location, department , id], (err, result) => {
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


exports.loginUser = (req, res) => {
    const { email, password, location } = req.body;

    const query = `
        SELECT * FROM users WHERE username = ? AND password = ? AND location = ?
    `;
    db.query(query, [email, password, location], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json(results[0]); // send back the user data
    });
};

exports.getUserById = (req, res) => {
    const { id } = req.params;

    const query = `SELECT * FROM users WHERE id = ?`;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(results[0]); // return single user
    });
};


// //update password only 
// exports.updatePassword = (req, res) => {
//     const { id } = req.params;
//     const { currentPassword, newPassword } = req.body;

//     const getUserQuery = `SELECT * FROM users WHERE id = ?`;
//     db.query(getUserQuery, [id], async (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         if (results.length === 0) return res.status(404).json({ message: 'User not found' });

//         const user = results[0];

//         // Check current password
//         const isMatch = await bcrypt.compare(currentPassword, user.password);
//         if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

//         // Hash new password
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
//         db.query(updateQuery, [hashedPassword, id], (err) => {
//             if (err) return res.status(500).json({ error: err.message });
//             res.json({ message: 'Password updated successfully' });
//         });
//     });
// };

//update password only 
exports.updatePassword = (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const getUserQuery = `SELECT * FROM users WHERE id = ?`;
    db.query(getUserQuery, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];

        // 🔑 Check current password (plain text)
        if (currentPassword !== user.password) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update with new plain text password
        const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
        db.query(updateQuery, [newPassword, id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Password updated successfully' });
        });
    });
};
