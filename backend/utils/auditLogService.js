const db = require('../config/db');

exports.logAction = (userId, userName, action, gatePassId) => {
    const query = `
        INSERT INTO audit_logs (user_id, user_name, action, gate_pass_id)
        VALUES (?, ?, ?, ?)
    `;
    db.query(query, [userId, userName, action, gatePassId], (err) => {
        if (err) console.error('Failed to log audit action:', err);
    });
};
