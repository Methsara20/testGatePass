const db = require('../config/db');

exports.getPasses = (req, res) => {
    db.query('SELECT * FROM gate_pass_requests', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.addGatepass = (req, res) => {
    const {
        request_type,
        item_name,
        quantity,
        description,
        request_date,
        request_time,
        location,
        purpose,
        additional_notes,
        status,
        created_by,
        approved_by,
    } = req.body;

    const query = `
        INSERT INTO gate_pass_requests (
            request_type, item_name, quantity, description, request_date, 
            request_time, location, purpose, additional_notes, status, 
            created_by, approved_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query,
        [
            request_type,
            item_name,
            quantity,
            description,
            request_date,
            request_time,
            location,
            purpose,
            additional_notes,
            status,
            created_by,
            approved_by,
        ],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ 
                message: 'Gatepass added successfully', 
                gatePassId: result.insertId 
            });
        }
    );
};



exports.updateGatepass = (req, res) => {
    
    const { id } = req.params;
    const {
        request_type,
        item_name,
        quantity,
        description,
        request_date,
        request_time,
        location,
        purpose,
        additional_notes,
        status,
        created_by,
        approved_by,
    } = req.body;

    const query = `
        UPDATE gate_pass_requests
        SET request_type = ?, item_name = ?, quantity = ?, description = ?, 
            request_date = ?, request_time = ?, location = ?, purpose = ?, 
            additional_notes = ?, status = ?, created_by = ?, approved_by = ?
        WHERE gate_pass_id = ?
    `;
    db.query(
        query,
        [
            request_type,
            item_name,
            quantity,
            description,
            request_date,
            request_time,
            location,
            purpose,
            additional_notes,
            status,
            created_by,
            approved_by,
            id
        ],
        (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Gate Pass not found' });
        }
        res.json({ message: 'Gate Pass updated successfully' });
    });
};



exports.deleteGatepass = (req, res) => {
    const { id } = req.params; // Extract `id` from URL parameters

    const query = `
        DELETE FROM gate_pass_requests
        WHERE gate_pass_id = ?
    `;
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Gate Pass not found' });
        }
        res.json({ message: 'Gate Pass deleted successfully' });
    });
};


// 🔸  Return three separate lists: Pending, Approved, Rejected
exports.getPassSummary = (req, res) => {
  db.query('SELECT * FROM gate_pass_requests ORDER BY gate_pass_id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      Pending:  rows.filter(r => r.status === 'Pending'),
      Approved: rows.filter(r => r.status === 'Approved'),
      Rejected: rows.filter(r => r.status === 'Rejected'),
    });
  });
};

// 🔸  Approve
exports.approveGatepass = (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE gate_pass_requests SET status = "Approved" WHERE gate_pass_id = ?',
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Request approved' });
    }
  );
};

// 🔸  Reject
exports.rejectGatepass = (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE gate_pass_requests SET status = "Rejected" WHERE gate_pass_id = ?',
    [id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Request rejected' });
    }
  );
};

exports.getMyRequests = (req, res) => {
  const { userId } = req.params;
  db.query(
    'SELECT * FROM gate_pass_requests WHERE created_by = ? ORDER BY gate_pass_id DESC',
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        Pending:  rows.filter(r => r.status === 'Pending'),
        Approved: rows.filter(r => r.status === 'Approved'),
        Rejected: rows.filter(r => r.status === 'Rejected')
      });
    }
  );
};
