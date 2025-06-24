const db = require('../config/db');

exports.getPasses = (req, res) => {
    db.query('SELECT * FROM gate_pass_requests', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

