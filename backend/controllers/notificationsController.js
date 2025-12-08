const db = require("../config/db");

// Get notifications (only pending)
exports.getNotifications = (req, res) => {
  const { location, department } = req.query;

  if (!location || !department) {
    return res.status(400).json({ error: "Location and Department are required" });
  }

  const sql = `
    SELECT gpr.gate_pass_id, gpr.status, gpr.created_at
    FROM gate_pass_requests gpr
    JOIN users u ON gpr.created_by = u.id
    WHERE u.location = ? 
      AND u.department = ? 
      AND gpr.status = 'Pending'
    ORDER BY gpr.created_at DESC
  `;

  db.query(sql, [location, department], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Only send notification message for pending
    const notifications = rows.map(r => ({
      id: r.gate_pass_id,
      message: "New approval request pending",
      created_at: r.created_at,
    }));

    res.json(notifications);
  });
};