const db = require('../config/db');

// ✅ Fetch Eligible Returnable Passes (after delivery accepted at destination)
exports.getEligibleReturnPasses = (req, res) => {
  const { location, department } = req.query;

  if (!location || !department) {
    return res.status(400).json({ error: "Location and department are required" });
  }

  const sql = `
    SELECT 
      gpr.gate_pass_id,
      gpr.location AS original_location,
      gpr.destination_address,
      gpr.department AS original_department,
      u.full_name AS requester_name
    FROM gate_pass_requests gpr
    LEFT JOIN users u ON gpr.created_by = u.id
    WHERE gpr.request_type = 'Returnable'
      AND gpr.status = 'Approved'
      AND gpr.delivery_status = 'Accepted'
      AND gpr.is_return = 0
      AND gpr.destination_address = ?  
    ORDER BY gpr.updated_at DESC;
  `;

  db.query(sql, [location], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};



// // ✅ Create Return Request (fetch department & location from users table)
// exports.createReturnRequest = (req, res) => {
//     const { reference_gate_pass_id, return_remark, created_by } = req.body;
  
//     if (!reference_gate_pass_id || !return_remark || !created_by) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }
  
//     // 1️⃣ Get original gate pass info + the creator's department/location
//     const fetchSql = `
//       SELECT gpr.*, u.department AS original_department, u.location AS original_location
//       FROM gate_pass_requests gpr
//       JOIN users u ON gpr.created_by = u.id
//       WHERE gpr.gate_pass_id = ?
//         AND gpr.request_type = 'Returnable'
//         AND gpr.status = 'Approved'
//         AND gpr.delivery_status = 'Accepted'
//     `;
  
//     db.query(fetchSql, [reference_gate_pass_id], (err, results) => {
//       if (err) return res.status(500).json({ error: err.message });
//       if (results.length === 0) {
//         return res.status(404).json({ error: "Original gate pass not found or invalid" });
//       }
  
//       const original = results[0];
  
//       // 2️⃣ Insert new return request (destination = original creator's department/location)
//       const insertSql = `
//         INSERT INTO gate_pass_requests 
//         (request_type, is_return, reference_gate_pass_id, request_date, request_time, location,
//          purpose, additional_notes, status, return_status, return_remark, is_draft, is_printable,
//          delivery_status, receiver_name, destination_address, department, transport_mode, vehicle_no,
//          driver_name, remarks, created_by)
//         VALUES ('Returnable', 1, ?, CURDATE(), CURTIME(), ?, ?, ?, 'Approved', 'Pending', ?, 0, 0,
//         'Waiting', ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
  
//       const values = [
//         reference_gate_pass_id,
//         original.destination_address,      // Return starts from the delivered location
//         original.purpose,
//         original.additional_notes,
//         return_remark,
//         original.receiver_name,
//         original.original_location,        // Return destination = original creator's location
//         original.original_department,      // Department from users table
//         original.transport_mode,
//         original.vehicle_no,
//         original.driver_name,
//         original.remarks,
//         created_by
//       ];
  
//       db.query(insertSql, values, (insertErr, result) => {
//         if (insertErr) return res.status(500).json({ error: insertErr.message });
  
//         const returnGatePassId = result.insertId;
  
//         // 3️⃣ Copy materials from original request
//         const copyMaterialsSql = `
//           INSERT INTO gate_pass_materials (gate_pass_id, description, serial_number, qty, uom, returnable, return_date)
//           SELECT ?, description, serial_number, qty, uom, returnable, return_date 
//           FROM gate_pass_materials WHERE gate_pass_id = ?
//         `;
//         db.query(copyMaterialsSql, [returnGatePassId, reference_gate_pass_id], (matErr) => {
//           if (matErr) return res.status(500).json({ error: matErr.message });
  
//           // 4️⃣ Mark original as "Return Initiated"
//           db.query(
//             `UPDATE gate_pass_requests SET is_return = 1, return_status = 'R_started' WHERE gate_pass_id = ?`,
//             [reference_gate_pass_id],
//             (updateErr) => {
//               if (updateErr) return res.status(500).json({ error: updateErr.message });
//               res.json({ message: "Return request created successfully", returnGatePassId });
//             }
//           );
//         });
//       });
//     });
//   };

// ✅ Create Return Request with Item-wise Remarks
// exports.createReturnRequest = (req, res) => {
//   const { reference_gate_pass_id, created_by, materials, return_remark } = req.body;

//   if (!reference_gate_pass_id || !created_by || !materials || !Array.isArray(materials)) {
//       return res.status(400).json({ error: "Missing required fields or invalid materials array" });
//   }

//   // 1️⃣ Fetch original gate pass info + creator's department/location
//   const fetchSql = `
//       SELECT gpr.*, u.department AS original_department, u.location AS original_location
//       FROM gate_pass_requests gpr
//       JOIN users u ON gpr.created_by = u.id
//       WHERE gpr.gate_pass_id = ?
//         AND gpr.request_type = 'Returnable'
//         AND gpr.status = 'Approved'
//         AND gpr.delivery_status = 'Accepted'
//   `;

//   db.query(fetchSql, [reference_gate_pass_id], (err, results) => {
//       if (err) return res.status(500).json({ error: err.message });
//       if (results.length === 0) {
//           return res.status(404).json({ error: "Original gate pass not found or invalid" });
//       }

//       const original = results[0];

//       // 2️⃣ Insert new return request (parent record)
//       const insertSql = `
//           INSERT INTO gate_pass_requests 
//           (request_type, is_return, reference_gate_pass_id, request_date, request_time, location,
//            purpose, additional_notes, status, return_status, return_remark, is_draft, is_printable,
//            delivery_status, receiver_name, destination_address, department, transport_mode, vehicle_no,
//            driver_name, remarks, created_by)
//           VALUES ('Returnable', 1, ?, CURDATE(), CURTIME(), ?, ?, ?, 'Approved', 'Pending', ?, 0, 0,
//           'Waiting', ?, ?, ?, ?, ?, ?, ?, ?)
//       `;

//       const values = [
//           reference_gate_pass_id,
//           original.destination_address,
//           original.purpose,
//           original.additional_notes,
//           return_remark, // optional overall remark
//           original.receiver_name,
//           original.original_location,
//           original.original_department,
//           original.transport_mode,
//           original.vehicle_no,
//           original.driver_name,
//           original.remarks,
//           created_by
//       ];

//       db.query(insertSql, values, (insertErr, result) => {
//           if (insertErr) return res.status(500).json({ error: insertErr.message });

//           const returnGatePassId = result.insertId;

//           // 3️⃣ Insert materials with item-wise remarks
//           const matInsertSql = `
//               INSERT INTO gate_pass_materials 
//               (gate_pass_id, description, serial_number, qty, uom, returnable, return_date, return_remark)
//               VALUES ?
//           `;

//           const matValues = materials.map(mat => [
//               returnGatePassId,
//               mat.description,
//               mat.serial_number,
//               mat.qty,
//               mat.uom,
//               mat.returnable,
//               mat.return_date || null,
//               mat.return_remark || null
//           ]);

//           db.query(matInsertSql, [matValues], (matErr) => {
//               if (matErr) return res.status(500).json({ error: matErr.message });

//               // 4️⃣ Mark original as "Return Initiated"
//               db.query(
//                   `UPDATE gate_pass_requests 
//                    SET is_return = 1, return_status = 'R_started' 
//                    WHERE gate_pass_id = ?`,
//                   [reference_gate_pass_id],
//                   (updateErr) => {
//                       if (updateErr) return res.status(500).json({ error: updateErr.message });
//                       res.json({ message: "Return request with item-wise remarks created successfully", returnGatePassId });
//                   }
//               );
//           });
//       });
//   });
// };


// ✅ Create Return Request with Item-wise Remarks and Transport Details
exports.createReturnRequest = (req, res) => {
  const { 
    reference_gate_pass_id, 
    created_by, 
    materials, 
    return_remark,
    transport_mode,
    vehicle_no,
    driver_name,
    driver_contact
  } = req.body;

  // Validate required fields
  if (!reference_gate_pass_id || !created_by || !materials || !Array.isArray(materials)) {
    return res.status(400).json({ error: "Missing required fields or invalid materials array" });
  }

  // Validate transport details if transport mode is provided
  if (transport_mode && transport_mode !== 'None' && (!vehicle_no || !driver_name)) {
    return res.status(400).json({ error: "Vehicle number and driver name are required when transport mode is specified" });
  }

  // 1️⃣ Fetch original gate pass info + creator's department/location
  const fetchSql = `
    SELECT gpr.*, u.department AS original_department, u.location AS original_location
    FROM gate_pass_requests gpr
    JOIN users u ON gpr.created_by = u.id
    WHERE gpr.gate_pass_id = ?
      AND gpr.request_type = 'Returnable'
      AND gpr.status = 'Approved'
      AND gpr.delivery_status = 'Accepted'
  `;

  db.query(fetchSql, [reference_gate_pass_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: "Original gate pass not found or invalid" });
    }

    const original = results[0];

    // 2️⃣ Insert new return request (parent record) with transport details
    const insertSql = `
      INSERT INTO gate_pass_requests 
      (
        request_type, is_return, reference_gate_pass_id, 
        request_date, request_time, location,
        purpose, additional_notes, status, 
        return_status, return_remark, is_draft, 
        is_printable, delivery_status, receiver_name, 
        destination_address, department, transport_mode, 
        vehicle_no, driver_name, driver_contact,
        remarks, created_by
      )
      VALUES ('Returnable', 1, ?, CURDATE(), CURTIME(), ?, ?, ?, 'Approved','Pending', ?, 0, 0, 'Waiting', ?, ?, ?, ?, ?, ?, ?,?, ?)
    `;

    // Use provided transport details or fallback to original
    const transportDetails = {
      mode: transport_mode || original.transport_mode,
      vehicle: vehicle_no || original.vehicle_no,
      driver: driver_name || original.driver_name,
      contact: driver_contact || original.driver_contact
    };

    const values = [
      reference_gate_pass_id,
      original.destination_address,
      original.purpose,
      original.additional_notes,
      return_remark,
      original.receiver_name,
      original.original_location,
      original.original_department,
      transportDetails.mode,
      transportDetails.vehicle,
      transportDetails.driver,
      transportDetails.contact,
      original.remarks,
      created_by
    ];

    db.query(insertSql, values, (insertErr, result) => {
      if (insertErr) return res.status(500).json({ error: insertErr.message });

      const returnGatePassId = result.insertId;

      // 3️⃣ Insert materials with item-wise remarks
      const matInsertSql = `
        INSERT INTO gate_pass_materials 
        (gate_pass_id, description, serial_number, qty, uom, returnable, return_date, return_remark)
        VALUES ?
      `;

      const matValues = materials.map(mat => [
        returnGatePassId,
        mat.description,
        mat.serial_number,
        mat.qty,
        mat.uom,
        mat.returnable,
        mat.return_date || null,
        mat.return_remark || null
      ]);

      db.query(matInsertSql, [matValues], (matErr) => {
        if (matErr) return res.status(500).json({ error: matErr.message });

        // 4️⃣ Mark original as "Return Initiated"
        db.query(
          `UPDATE gate_pass_requests 
           SET is_return = 1, return_status = 'R_started' 
           WHERE gate_pass_id = ?`,
          [reference_gate_pass_id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });
            res.json({ 
              message: "Return request created successfully", 
              returnGatePassId,
              transportDetails: {
                mode: transportDetails.mode,
                vehicle: transportDetails.vehicle,
                driver: transportDetails.driver,
                contact: transportDetails.contact
              }
            });
          }
        );
      });
    });
  });
};



  

//✅ Get Return Requests (Approval for requester's location & department)
exports.getReturnRequests = (req, res) => {
  const { location, department } = req.query;

  if (!location || !department) {
    return res.status(400).json({ error: "Location and department are required" });
  }

  const sql = `
    SELECT 
      gpr.gate_pass_id,
      gpr.reference_gate_pass_id,
      gpr.return_status,
      gpr.return_remark,
      gpr.created_at,
      u.full_name AS requester_name,
      u.location AS requester_location,
      u.department AS requester_department
    FROM gate_pass_requests gpr
    LEFT JOIN users u ON gpr.created_by = u.id
    WHERE gpr.is_return = 1
      AND u.location = ?   
      AND u.department = ? 
      AND gpr.return_status='Pending'
    ORDER BY gpr.created_at DESC;
  `;
  db.query(sql, [location, department], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};



// ✅ Get All Return Requests (for requester's location & department)
exports.getAllReturnRequests = (req, res) => {
    const { location, department } = req.query;
  
    if (!location || !department) {
      return res.status(400).json({ error: "Location and department are required" });
    }
  
    const sql = `
      SELECT 
        gpr.gate_pass_id,
        gpr.reference_gate_pass_id,
        gpr.return_status,
        gpr.return_remark,
        gpr.created_at,
        gpr.request_date,
        gpr.destination_address,
        gpr.location,
        gpr.department,
        u.full_name AS requester_name,
        u.location AS requester_location,
        u.department AS requester_department
      FROM gate_pass_requests gpr
      LEFT JOIN users u ON gpr.created_by = u.id
      WHERE gpr.is_return = 1
        AND gpr.location = ?   
        AND gpr.department = ? 
      ORDER BY gpr.created_at DESC;
    `;
    
    db.query(sql, [location, department], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  };



// ✅ Approve Return Request - Fixed version
exports.approveReturnRequest = (req, res) => {
    const { approved_by } = req.body;
    const { id } = req.params;  // Changed from gate_pass_id to id to match route
  
    if (!id || !approved_by) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    const sql = `
      UPDATE gate_pass_requests
      SET return_status = 'Approved', 
          approved_by = ?, 
          delivery_status = 'Waiting'
      WHERE gate_pass_id = ? AND is_return = 1 AND return_status = 'Pending'
    `;
  
    db.query(sql, [approved_by, id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          error: "Return request not found, already approved, or not pending" 
        });
      }
      res.json({ message: "Return request approved successfully" });
    });
  };


  // ✅ Reject Return Request
exports.rejectReturnRequest = (req, res) => {
    const { rejected_by, rejection_reason } = req.body;
    const { id } = req.params;
  
    if (!id || !rejected_by || !rejection_reason) {
      return res.status(400).json({ error: "Missing required fields" });
    }
  
    const sql = `
      UPDATE gate_pass_requests
      SET return_status = 'Rejected', 
          rejected_by = ?, 
          rejection_reason = ?,
          rejected_at = NOW()
      WHERE gate_pass_id = ? AND is_return = 1 AND return_status = 'Pending'
    `;
  
    db.query(sql, [rejected_by, rejection_reason, id], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          error: "Return request not found, already processed, or not pending" 
        });
      }
      res.json({ message: "Return request rejected successfully" });
    });
  };

  // ✅ Get Pending Return Requests
exports.getPendingReturnRequests = (req, res) => {
    const { location, department } = req.query;
  
    if (!location || !department) {
      return res.status(400).json({ error: "Location and department are required" });
    }
  
    const sql = `
      SELECT 
        gpr.gate_pass_id,
        gpr.reference_gate_pass_id,
        gpr.return_status,
        gpr.return_remark,
        gpr.created_at,
        gpr.request_date,
        u.full_name AS requester_name
      FROM gate_pass_requests gpr
      LEFT JOIN users u ON gpr.created_by = u.id
      WHERE gpr.is_return = 1
        AND gpr.return_status = 'Pending'
        AND gpr.location = ?   
        AND gpr.department = ? 
      ORDER BY gpr.created_at DESC;
    `;
    
    db.query(sql, [location, department], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  };


    // ✅ Get Approved Return Requests
// exports.getApprovedReturnRequests = (req, res) => {
//   const { location, department } = req.query;

//   if (!location || !department) {
//     return res.status(400).json({ error: "Location and department are required" });
//   }

//   const sql = `
//     SELECT 
//       gpr.gate_pass_id,
//       gpr.reference_gate_pass_id,
//       gpr.return_status,
//       gpr.return_remark,
//       gpr.created_at,
//       gpr.request_date,
//       u.full_name AS requester_name
//     FROM gate_pass_requests gpr
//     LEFT JOIN users u ON gpr.created_by = u.id
//     WHERE gpr.is_return = 1
//       AND gpr.return_status = 'Approved'
//       AND gpr.location = ?   
//       AND gpr.department = ? 
//     ORDER BY gpr.created_at DESC;
//   `;
  
//   db.query(sql, [location, department], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };


// ✅ Get Approved Return Requests (Filtered by user's location & department)
exports.getApprovedReturnRequests = (req, res) => {
  const { location, department } = req.query;

  if (!location || !department) {
    return res.status(400).json({ error: "Location and department are required" });
  }

  const sql = `
    SELECT 
      gpr.gate_pass_id,
      gpr.reference_gate_pass_id,
      gpr.return_status,
      gpr.return_remark,
      gpr.created_at,
      gpr.request_date,
      u.full_name AS requester_name,
      approver.full_name AS approver_name,
      gpr.destination_address,
      gpr.department
    FROM gate_pass_requests gpr
    LEFT JOIN users u ON gpr.created_by = u.id
    LEFT JOIN users approver ON gpr.approved_by = approver.id
    WHERE gpr.is_return = 1
      AND gpr.return_status = 'Approved'
      AND u.location = ?   
      AND u.department = ? 
    ORDER BY gpr.created_at DESC;
  `;
  
  db.query(sql, [location, department], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};


    // ✅ Get Reject Return Requests
    exports.getRejectReturnRequests = (req, res) => {
      const { location, department } = req.query;
    
      if (!location || !department) {
        return res.status(400).json({ error: "Location and department are required" });
      }
    
      const sql = `
        SELECT 
          gpr.gate_pass_id,
          gpr.reference_gate_pass_id,
          gpr.return_status,
          gpr.return_remark,
          gpr.created_at,
          gpr.request_date,
          u.full_name AS requester_name
        FROM gate_pass_requests gpr
        LEFT JOIN users u ON gpr.created_by = u.id
        WHERE gpr.is_return = 1
          AND gpr.return_status = 'Rejected'
          AND gpr.location = ?   
          AND gpr.department = ? 
        ORDER BY gpr.created_at DESC;
      `;
      
      db.query(sql, [location, department], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      });
    };

// const db = require('../config/db');

// // ✅ Fetch Eligible Returnable Passes (after delivery accepted at destination)
// exports.getEligibleReturnPasses = (req, res) => {
//   const { location, department } = req.query;

//   if (!location || !department) {
//     return res.status(400).json({ error: "Location and department are required" });
//   }

//   const sql = `
//     SELECT 
//       gpr.gate_pass_id,
//       gpr.location AS original_location,
//       gpr.destination_address,
//       gpr.department AS original_department,
//       u.full_name AS requester_name
//     FROM gate_pass_requests gpr
//     LEFT JOIN users u ON gpr.created_by = u.id
//     WHERE gpr.request_type = 'Returnable'
//       AND gpr.status = 'Approved'
//       AND gpr.delivery_status = 'Accepted'
//       AND gpr.is_return = 0
//       AND gpr.destination_address = ?  
//     ORDER BY gpr.updated_at DESC;
//   `;

//   db.query(sql, [location], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };

// // ✅ Create Return Request
// exports.createReturnRequest = (req, res) => {
//   const { reference_gate_pass_id, return_remark, created_by } = req.body;

//   if (!reference_gate_pass_id || !return_remark || !created_by) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   const fetchSql = `
//     SELECT gpr.*, u.department AS original_department, u.location AS original_location
//     FROM gate_pass_requests gpr
//     JOIN users u ON gpr.created_by = u.id
//     WHERE gpr.gate_pass_id = ?
//       AND gpr.request_type = 'Returnable'
//       AND gpr.status = 'Approved'
//       AND gpr.delivery_status = 'Accepted'
//   `;

//   db.query(fetchSql, [reference_gate_pass_id], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (results.length === 0) {
//       return res.status(404).json({ error: "Original gate pass not found or invalid" });
//     }

//     const original = results[0];

//     const insertSql = `
//       INSERT INTO gate_pass_requests 
//       (request_type, is_return, reference_gate_pass_id, request_date, request_time, location,
//        purpose, additional_notes, status, return_status, return_remark, is_draft, is_printable,
//        delivery_status, receiver_name, destination_address, department, transport_mode, vehicle_no,
//        driver_name, remarks, created_by)
//       VALUES ('Returnable', 1, ?, CURDATE(), CURTIME(), ?, ?, ?, 'Pending', 'Pending', ?, 0, 0,
//       'Waiting', ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const values = [
//       reference_gate_pass_id,
//       original.destination_address,
//       original.purpose,
//       original.additional_notes,
//       return_remark,
//       original.receiver_name,
//       original.original_location,
//       original.original_department,
//       original.transport_mode,
//       original.vehicle_no,
//       original.driver_name,
//       original.remarks,
//       created_by
//     ];

//     db.query(insertSql, values, (insertErr, result) => {
//       if (insertErr) return res.status(500).json({ error: insertErr.message });

//       const returnGatePassId = result.insertId;

//       const copyMaterialsSql = `
//         INSERT INTO gate_pass_materials (gate_pass_id, description, serial_number, qty, uom, returnable, return_date)
//         SELECT ?, description, serial_number, qty, uom, returnable, return_date 
//         FROM gate_pass_materials WHERE gate_pass_id = ?
//       `;
//       db.query(copyMaterialsSql, [returnGatePassId, reference_gate_pass_id], (matErr) => {
//         if (matErr) return res.status(500).json({ error: matErr.message });

//         db.query(
//           `UPDATE gate_pass_requests SET is_return = 1, return_status = 'Pending' WHERE gate_pass_id = ?`,
//           [reference_gate_pass_id],
//           (updateErr) => {
//             if (updateErr) return res.status(500).json({ error: updateErr.message });
//             res.json({ message: "Return request created successfully", returnGatePassId });
//           }
//         );
//       });
//     });
//   });
// };

// // ✅ Get Return Requests (Pending for approver)
// exports.getReturnRequests = (req, res) => {
//   const { location, department } = req.query;

//   if (!location || !department) {
//     return res.status(400).json({ error: "Location and department are required" });
//   }

//   const sql = `
//     SELECT 
//       gpr.gate_pass_id,
//       gpr.reference_gate_pass_id,
//       gpr.return_status,
//       gpr.return_remark,
//       gpr.created_at,
//       u.full_name AS requester_name
//     FROM gate_pass_requests gpr
//     LEFT JOIN users u ON gpr.created_by = u.id
//     WHERE gpr.is_return = 1
//       AND u.location = ?   
//       AND u.department = ? 
//       AND gpr.return_status='Pending'
//     ORDER BY gpr.created_at DESC;
//   `;
//   db.query(sql, [location, department], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };

// // ✅ Get All Return Requests (Approver View)
// exports.getAllReturnRequests = (req, res) => {
//   const { location, department } = req.query;

//   if (!location || !department) {
//     return res.status(400).json({ error: "Location and department are required" });
//   }

//   const sql = `
//     SELECT 
//       gpr.gate_pass_id,
//       gpr.reference_gate_pass_id,
//       gpr.return_status,
//       gpr.return_remark,
//       gpr.created_at,
//       gpr.request_date,
//       gpr.destination_address,
//       gpr.location,
//       gpr.department,
//       u.full_name AS requester_name
//     FROM gate_pass_requests gpr
//     LEFT JOIN users u ON gpr.created_by = u.id
//     WHERE gpr.is_return = 1
//       AND gpr.location = ?   
//       AND gpr.department = ? 
//     ORDER BY gpr.created_at DESC;
//   `;
  
//   db.query(sql, [location, department], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };

// // ✅ Approve Return Request
// exports.approveReturnRequest = (req, res) => {
//   const { approved_by } = req.body;
//   const { id } = req.params;

//   if (!id || !approved_by) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   const sql = `
//     UPDATE gate_pass_requests
//     SET return_status = 'Approved', 
//         approved_by = ?, 
//         delivery_status = 'Waiting'
//     WHERE gate_pass_id = ? AND is_return = 1 AND return_status = 'Pending'
//   `;

//   db.query(sql, [approved_by, id], (err, result) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Return request not found, already approved, or not pending" });
//     }
//     res.json({ message: "Return request approved successfully" });
//   });
// };

// // ✅ Reject Return Request
// exports.rejectReturnRequest = (req, res) => {
//   const { rejected_by, rejection_reason } = req.body;
//   const { id } = req.params;

//   if (!id || !rejected_by || !rejection_reason) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }

//   const sql = `
//     UPDATE gate_pass_requests
//     SET return_status = 'Rejected', 
//         rejected_by = ?, 
//         rejection_reason = ?,
//         rejected_at = NOW()
//     WHERE gate_pass_id = ? AND is_return = 1 AND return_status = 'Pending'
//   `;

//   db.query(sql, [rejected_by, rejection_reason, id], (err, result) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Return request not found, already processed, or not pending" });
//     }
//     res.json({ message: "Return request rejected successfully" });
//   });
// };

// // ✅ Get Pending Return Requests (Approver View)
// exports.getPendingReturnRequests = (req, res) => {
//   const { location, department } = req.query;

//   if (!location || !department) {
//     return res.status(400).json({ error: "Location and department are required" });
//   }

//   const sql = `
//     SELECT 
//       gpr.gate_pass_id,
//       gpr.reference_gate_pass_id,
//       gpr.return_status,
//       gpr.return_remark,
//       gpr.created_at,
//       gpr.request_date,
//       u.full_name AS requester_name
//     FROM gate_pass_requests gpr
//     LEFT JOIN users u ON gpr.created_by = u.id
//     WHERE gpr.is_return = 1
//       AND gpr.return_status = 'Pending'
//       AND gpr.location = ?   
//       AND gpr.department = ? 
//     ORDER BY gpr.created_at DESC;
//   `;
  
//   db.query(sql, [location, department], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };

// // ================= NEW FUNCTIONS =================

// // ✅ Get My Return Requests
// exports.getMyReturnRequests = (req, res) => {
//   const { id } = req.query;
//   if (!id) return res.status(400).json({ error: "User ID is required" });

//   const sql = `
//     SELECT * FROM gate_pass_requests
//     WHERE is_return = 1
//       AND created_by = ?
//     ORDER BY created_at DESC;
//   `;
//   db.query(sql, [id], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };

// // ✅ Get My Pending Return Requests
// exports.getMyPendingReturnRequests = (req, res) => {
//   const { id } = req.query;
//   if (!id) return res.status(400).json({ error: "User ID is required" });

//   const sql = `
//     SELECT * FROM gate_pass_requests
//     WHERE is_return = 1
//       AND created_by = ?
//       AND return_status = 'Pending'
//     ORDER BY created_at DESC;
//   `;
//   db.query(sql, [id], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };

// // ✅ Get My Approved Return Requests
// exports.getMyApprovedReturnRequests = (req, res) => {
//   const { id } = req.query;
//   if (!id) return res.status(400).json({ error: "User ID is required" });

//   const sql = `
//     SELECT * FROM gate_pass_requests
//     WHERE is_return = 1
//       AND created_by = ?
//       AND return_status = 'Approved'
//     ORDER BY created_at DESC;
//   `;
//   db.query(sql, [id], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };

// // ✅ Get My Rejected Return Requests
// exports.getMyRejectedReturnRequests = (req, res) => {
//   const { id } = req.query;
//   if (!id) return res.status(400).json({ error: "User ID is required" });

//   const sql = `
//     SELECT * FROM gate_pass_requests
//     WHERE is_return = 1
//       AND created_by = ?
//       AND return_status = 'Rejected'
//     ORDER BY created_at DESC;
//   `;
//   db.query(sql, [user_id], (err, results) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(results);
//   });
// };

// // ✅ Get Full Return Request Details (with Materials)
// exports.getReturnRequestDetails = (req, res) => {
//   const { gate_pass_id } = req.params;
//   if (!gate_pass_id) return res.status(400).json({ error: "Gate pass ID is required" });

//   const requestSql = `
//     SELECT 
//       gpr.*,
//       u.full_name AS requester_name
//     FROM gate_pass_requests gpr
//     LEFT JOIN users u ON gpr.created_by = u.id
//     WHERE gpr.gate_pass_id = ?
//   `;

//   db.query(requestSql, [gate_pass_id], (err, requestResult) => {
//     if (err) return res.status(500).json({ error: err.message });
//     if (requestResult.length === 0) return res.status(404).json({ error: "Request not found" });

//     const requestData = requestResult[0];

//     const materialsSql = `
//       SELECT 
//         material_id,
//         description,
//         serial_number,
//         qty,
//         uom,
//         returnable,
//         return_date
//       FROM gate_pass_materials
//       WHERE gate_pass_id = ?
//     `;

//     db.query(materialsSql, [gate_pass_id], (matErr, materialsResult) => {
//       if (matErr) return res.status(500).json({ error: matErr.message });

//       res.json({
//         request: requestData,
//         materials: materialsResult
//       });
//     });
//   });
// };


