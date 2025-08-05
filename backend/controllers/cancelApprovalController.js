const db = require('../config/db');

// Fetch Approvals Eligible for Cancellation (Approved + Waiting)
exports.getCancellableApprovals = (req, res) => {
  const { location, department } = req.query;

  if (!location || !department) {
    return res.status(400).json({ error: "Location and department are required" });
  }

  const sql = `
    SELECT 
      gpr.gate_pass_id,
      gpr.request_type,
      gpr.destination_address,
      u.full_name AS requester_name,
      gpr.request_date
    FROM gate_pass_requests gpr
    LEFT JOIN users u ON gpr.created_by = u.id
    WHERE gpr.status = 'Approved'
      AND gpr.delivery_status = 'Waiting'
      AND u.location = ?
      AND u.department = ?
    ORDER BY gpr.gate_pass_id DESC;
  `;

  db.query(sql, [location, department], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Fetch Cancelled Gate Passes
exports.getCancelledApprovals = (req, res) => {
  const { location, department } = req.query;

  if (!location || !department) {
    return res.status(400).json({ error: "Location and department are required" });
  }

  const sql = `
    SELECT 
      gpr.gate_pass_id,
      gpr.request_type,
      gpr.destination_address,
      u.full_name AS requester_name,
      gpr.cancel_remark,
      gpr.cancelled_at
    FROM gate_pass_requests gpr
    LEFT JOIN users u ON gpr.created_by = u.id
    WHERE gpr.status = 'Cancelled'
      AND u.location = ?
      AND u.department = ?
    ORDER BY gpr.cancelled_at DESC;
  `;

  db.query(sql, [location, department], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.cancelApproval = (req, res) => {
  const { gate_pass_id, cancel_remark, cancelled_by } = req.body;

  if (!gate_pass_id || !cancel_remark || !cancelled_by) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sql = `
    UPDATE gate_pass_requests 
    SET status = 'Cancelled', cancel_remark = ?, cancelled_by = ?, cancelled_at = NOW(), approved_by = NULL
    WHERE gate_pass_id = ? AND status = 'Approved'
  `;

  db.query(sql, [cancel_remark, cancelled_by, gate_pass_id], (err, result) => {
    if (err) {
      console.error('Cancel approval error:', err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "No matching approved request found" });
    }
    res.json({ message: "Approval cancelled successfully" });
  });
};

