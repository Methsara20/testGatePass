const db = require('../config/db');

exports.getApprovals = (req, res) => {
    db.query('SELECT * FROM approvals', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};