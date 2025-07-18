const db = require('../config/db');

// Get all gate pass requests
exports.getPasses = (req, res) => {
  db.query('SELECT * FROM gate_pass_requests', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Add a new gate pass request
exports.addGatepass = (req, res) => {
  try {
    // ✅ Now req.body is populated
    const {
      request_type,
      request_date,
      request_time,
      location,
      purpose,
      additional_notes,
      status,
      is_draft,
      is_printable,
      delivery_status,
      delivery_comment,
      receiver_name,
      destination_address,
      transport_mode,
      vehicle_no,
      driver_name,
      remarks,
      created_by,
      approved_by
    } = req.body;

    // ✅ Parse 'materials' field from string to array
    let materials = [];
    if (req.body.materials) {
      materials = JSON.parse(req.body.materials); // be cautious here
    }

    const documentFile = req.file; // ✅ contains uploaded file info if sent

    const query = `
      INSERT INTO gate_pass_requests (
        request_type, request_date, request_time, location, purpose,
        additional_notes, status, is_draft, is_printable, delivery_status,
        delivery_comment, receiver_name, destination_address, transport_mode,
        vehicle_no, driver_name, remarks, created_by, approved_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      request_type, request_date, request_time, location, purpose,
      additional_notes, status, is_draft, is_printable, delivery_status,
      delivery_comment, receiver_name, destination_address, transport_mode,
      vehicle_no, driver_name, remarks, created_by, approved_by
    ];

    db.query(query, values, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const gatePassId = result.insertId;

      if (Array.isArray(materials)) {
        const insertMaterialQuery = `
          INSERT INTO gate_pass_materials (
            gate_pass_id, description, serial_number, qty, uom, returnable, return_date
          ) VALUES ?`;

        const materialValues = materials.map(item => [
          gatePassId,
          item.description,
          item.serial,
          item.qty,
          item.uom,
          item.returnable,
          item.returnable ? item.returnDate : null
        ]);

        db.query(insertMaterialQuery, [materialValues], (matErr) => {
          if (matErr) return res.status(500).json({ error: matErr.message });
          res.status(201).json({ message: 'Gatepass and materials added successfully', gatePassId });
        });
      } else {
        res.status(201).json({ message: 'Gatepass added without materials', gatePassId });
      }
    });
  } catch (err) {
    console.error("Gatepass submit error:", err);
    res.status(400).json({ message: "Invalid form data", error: err.message });
  }
};


// Update gate pass request
exports.updateGatepass = (req, res) => {
  const { id } = req.params;
  const {
    request_type,
    request_date,
    request_time,
    location,
    purpose,
    additional_notes,
    status,
    is_draft,
    is_printable,
    delivery_status,
    delivery_comment,
    receiver_name,
    destination_address,
    transport_mode,
    vehicle_no,
    driver_name,
    remarks,
    created_by,
    approved_by
  } = req.body;

  const query = `
    UPDATE gate_pass_requests
    SET request_type = ?, request_date = ?, request_time = ?, location = ?,
        purpose = ?, additional_notes = ?, status = ?, is_draft = ?, is_printable = ?,
        delivery_status = ?, delivery_comment = ?, receiver_name = ?,
        destination_address = ?, transport_mode = ?, vehicle_no = ?,
        driver_name = ?, remarks = ?, created_by = ?, approved_by = ?
    WHERE gate_pass_id = ?`;

  db.query(query, [
    request_type, request_date, request_time, location,
    purpose, additional_notes, status, is_draft, is_printable,
    delivery_status, delivery_comment, receiver_name,
    destination_address, transport_mode, vehicle_no,
    driver_name, remarks, created_by, approved_by, id
  ], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Gate Pass not found' });
    }
    res.json({ message: 'Gate Pass updated successfully' });
  });
};

// Delete gate pass request
exports.deleteGatepass = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM gate_pass_requests WHERE gate_pass_id = ?';
  db.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Gate Pass not found' });
    }
    res.json({ message: 'Gate Pass deleted successfully' });
  });
};

// Return three separate lists: Pending, Approved, Rejected
exports.getPassSummary = (req, res) => {
  db.query('SELECT * FROM gate_pass_requests ORDER BY gate_pass_id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      Pending: rows.filter(r => r.status === 'Pending'),
      Approved: rows.filter(r => r.status === 'Approved'),
      Rejected: rows.filter(r => r.status === 'Rejected'),
    });
  });
};

// Approve gate pass
exports.approveGatepass = (req, res) => {
  const { id } = req.params;
  db.query('UPDATE gate_pass_requests SET status = "Approved", is_printable = true WHERE gate_pass_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Request approved' });
  });
};

// Reject gate pass
exports.rejectGatepass = (req, res) => {
  const { id } = req.params;
  db.query('UPDATE gate_pass_requests SET status = "Rejected" WHERE gate_pass_id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Request rejected' });
  });
};

// Get gate passes by user
exports.getMyRequests = (req, res) => {
  const { userId } = req.params;
  db.query('SELECT * FROM gate_pass_requests WHERE created_by = ? ORDER BY gate_pass_id DESC', [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      Pending: rows.filter(r => r.status === 'Pending'),
      Approved: rows.filter(r => r.status === 'Approved'),
      Rejected: rows.filter(r => r.status === 'Rejected'),
    });
  });
};

// Get all approved but not delivered gate passes
exports.getDeliverablePasses = (req, res) => {
  db.query(
    'SELECT * FROM gate_pass_requests WHERE status = "Approved" AND delivery_status = "Waiting" ORDER BY gate_pass_id DESC',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};

// Accept delivery
exports.acceptDelivery = (req, res) => {
  const { id } = req.params;
  db.query(
    'UPDATE gate_pass_requests SET delivery_status = "Accepted", delivery_comment = NULL WHERE gate_pass_id = ?',
    [id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Gate-pass marked as Accepted' });
    }
  );
};

// Reject delivery with comment
exports.rejectDelivery = (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  db.query(
    'UPDATE gate_pass_requests SET delivery_status = "Issue", delivery_comment = ? WHERE gate_pass_id = ?',
    [comment || '', id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Delivery issue recorded' });
    }
  );
};
