const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/summary', (req, res) => {
  const summaryQuery = `
    SELECT 
      COUNT(*) AS total,
      SUM(status = 'Approved') AS approved,
      SUM(status = 'Pending') AS pending,
      SUM(status = 'Rejected') AS rejected
    FROM gate_pass_requests
  `;

  const recentQuery = `
    SELECT 
      gpr.gate_pass_id,
      gpr.request_type,
      gpr.status,
      gpr.request_date,
      gpr.created_by,
      SUM(gpm.qty) AS total_qty
    FROM gate_pass_requests gpr
    LEFT JOIN gate_pass_materials gpm ON gpr.gate_pass_id = gpm.gate_pass_id
    GROUP BY gpr.gate_pass_id
    ORDER BY gpr.request_date DESC
    LIMIT 5
  `;

  const trendQuery = `
    SELECT DATE(request_date) as date, COUNT(*) as count
    FROM gate_pass_requests
    GROUP BY DATE(request_date)
    ORDER BY date ASC
    LIMIT 12
  `;

  db.query(summaryQuery, (err, summaryResult) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(recentQuery, (err, recentResult) => {
      if (err) return res.status(500).json({ error: err.message });

      db.query(trendQuery, (err, trendResult) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({
          summary: summaryResult[0],
          recent: recentResult,
          trend: trendResult,
        });
      });
    });
  });
});

module.exports = router;
