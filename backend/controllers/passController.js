const db = require('../config/db');
const PDFDocument = require('pdfkit');
const fs = require('fs');


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
      department, 
      transport_mode,
      vehicle_no,
      driver_name,
      remarks,
      created_by,
      approved_by,
      accepted_by
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
        delivery_comment, receiver_name, destination_address, department, transport_mode,
        vehicle_no, driver_name, remarks, created_by, approved_by, accepted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; 

    const values = [
      request_type, request_date, request_time, location, purpose,
      additional_notes, status, is_draft, is_printable, delivery_status,
      delivery_comment, receiver_name, destination_address, department, transport_mode,
      vehicle_no, driver_name, remarks, created_by, approved_by, accepted_by
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
          item.serial_number,
          item.qty,
          item.uom,
          item.returnable ? 1 : 0, 
          item.returnable ? (item.return_date || null) : null
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




// Updated updateGatepass function
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
    department,
    transport_mode,
    vehicle_no,
    driver_name,
    remarks,
    created_by,
    approved_by,
    accepted_by
  } = req.body;

  // Parse materials from request body (similar to addGatepass)
  let materials = [];
  if (req.body.materials) {
    try {
      materials = JSON.parse(req.body.materials);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid materials format' });
    }
  }

  console.log('Updating gate pass ID:', id);
  console.log('Materials to update:', materials);

  const query = `
    UPDATE gate_pass_requests
    SET request_type = ?, request_date = ?, request_time = ?, location = ?,
        purpose = ?, additional_notes = ?, status = ?, is_draft = ?, is_printable = ?,
        delivery_status = ?, delivery_comment = ?, receiver_name = ?,
        destination_address = ?, department = ?, transport_mode = ?, vehicle_no = ?,
        driver_name = ?, remarks = ?, created_by = ?, approved_by = ?, accepted_by = ?
    WHERE gate_pass_id = ?`;

  db.query(query, [
    request_type, request_date, request_time, location,
    purpose, additional_notes, status, is_draft, is_printable,
    delivery_status, delivery_comment, receiver_name,
    destination_address, department, transport_mode, vehicle_no,
    driver_name, remarks, created_by, approved_by,accepted_by, id
  ], (err, result) => {
    if (err) {
      console.error('Error updating gate pass:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Gate Pass not found' });
    }

    console.log('Gate pass updated, now updating materials...');

    // Handle materials update
    if (Array.isArray(materials)) {
      // First, delete existing materials for this gate pass
      const deleteMaterialsQuery = 'DELETE FROM gate_pass_materials WHERE gate_pass_id = ?';
      
      db.query(deleteMaterialsQuery, [id], (deleteErr) => {
        if (deleteErr) {
          console.error('Error deleting existing materials:', deleteErr);
          return res.status(500).json({ error: deleteErr.message });
        }

        console.log('Existing materials deleted, inserting new materials...');

        // Insert new materials if any exist
        if (materials.length > 0) {
          const insertMaterialQuery = `
            INSERT INTO gate_pass_materials (
              gate_pass_id, description, serial_number, qty, uom, returnable, return_date
            ) VALUES ?`;

          const materialValues = materials.map(item => [
            id,
            item.description || '',
            item.serial_number || item.serialNumber || '',
            item.quantity || item.qty || 0,
            item.uom || '',
            item.returnable ? 1 : 0,
            item.returnable ? (item.return_date || null) : null
          ]);

          console.log('Inserting material values:', materialValues);

          db.query(insertMaterialQuery, [materialValues], (matErr) => {
            if (matErr) {
              console.error('Error inserting materials:', matErr);
              return res.status(500).json({ error: matErr.message });
            }
            
            console.log('Materials updated successfully');
            res.json({ message: 'Gate Pass and materials updated successfully' });
          });
        } else {
          // No materials to insert, just return success
          console.log('No materials to insert, update complete');
          res.json({ message: 'Gate Pass updated successfully (no materials)' });
        }
      });
    } else {
      // No materials provided, just return success for gate pass update
      console.log('No materials provided, gate pass update complete');
      res.json({ message: 'Gate Pass updated successfully' });
    }
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
  const { location, department } = req.query;
  
  if (!location || !department) {
    return res.status(400).json({ error: "Location and Department are required" });
  }
  
  const sql = `
    SELECT gpr.*
    FROM gate_pass_requests gpr
    JOIN users u ON gpr.created_by = u.id
    WHERE u.location = ? 
      AND u.department = ?
    ORDER BY gpr.gate_pass_id DESC
  `;
  
  db.query(sql, [location, department], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    res.json({
      Pending: rows.filter(r => r.status === 'Pending'),
      Approved: rows.filter(r => r.status === 'Approved'),
      Rejected: rows.filter(r => r.status === 'Rejected'),
    });
  });
};





// Updated approveGatepass function
exports.approveGatepass = (req, res) => {
  const { id } = req.params;
  const { approved_by } = req.body; // Get approver ID from request body

  // Validate input
  if (!approved_by) {
    return res.status(400).json({ error: 'Approver ID is required' });
  }

  db.query(
    'UPDATE gate_pass_requests SET status = "Approved", approved_by = ?, is_printable = true WHERE gate_pass_id = ?',
    [approved_by, id],
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Gate pass not found' });
      }
      res.json({ message: 'Request approved successfully' });
    }
  );
};


// Reject gate pass
exports.rejectGatepass = (req, res) => {
  const { id } = req.params;
  const { rejected_by } = req.body; // Get rejector ID from request body

  // Validate input
  if (!rejected_by) {
    return res.status(400).json({ error: 'Rejector ID is required' });
  }

  db.query(
    'UPDATE gate_pass_requests SET status = "Rejected", approved_by = ? WHERE gate_pass_id = ?',
    [rejected_by, id],
    (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Gate pass not found' });
      }
      res.json({ message: 'Request rejected successfully' });
    }
  );
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
      Cancelled: rows.filter(r => r.status === 'Cancelled'),
    });
  });
};






// Get deliverable passes filtered by user's location and delivery status
exports.getDeliverablePasses = (req, res) => {
  const { location, department, delivery_status } = req.query; // Pass location, department, and delivery status from frontend

  if (!location || !department) {
    return res.status(400).json({ error: "User location and department are required" });
  }

  // Default to 'Waiting' if no delivery_status is passed (Pending tab)
  const statusFilter = delivery_status || "Waiting";

  const sql = `
    SELECT * 
    FROM gate_pass_requests 
    WHERE status = "Approved"
      AND delivery_status = ? 
      AND destination_address = ? 
      AND department = ?
    ORDER BY gate_pass_id DESC
  `;

  db.query(sql, [statusFilter, location, department], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};




// Accept delivery
exports.acceptDelivery = (req, res) => {
  const { id } = req.params;
  const { accepted_by } = req.body;

  db.query(
    'UPDATE gate_pass_requests SET delivery_status = "Accepted", accepted_by = ?, delivery_comment = NULL WHERE gate_pass_id = ?',
    [accepted_by, id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Gate-pass marked as Accepted with accepted_by user' });
    }
  );
};


// Reject delivery with comment
exports.rejectDelivery = (req, res) => {
  const { id } = req.params;
  const { comment, accepted_by } = req.body;

  db.query(
    'UPDATE gate_pass_requests SET delivery_status = "Issue", delivery_comment = ?, accepted_by = ? WHERE gate_pass_id = ?',
    [comment || '', accepted_by, id],
    err => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Delivery marked as Issue with rejected_by user' });
    }
  );
};




exports.getGatepassWithMaterialsById = (req, res) => {
  const id = req.params.id;

  const query = `
    SELECT 
      gpr.*,
      u1.full_name AS requester_name,
      u1.email AS requester_email,
      u1.department AS requester_role,
      u1.phone_number AS requester_phone,
      u1.location AS requester_location,
      u2.full_name AS approver_name
    FROM gate_pass_requests gpr
    LEFT JOIN users u1 ON gpr.created_by = u1.id
    LEFT JOIN users u2 ON gpr.approved_by = u2.id
    WHERE gpr.gate_pass_id = ?`;

  db.query(query, [id], (err, gatePassRows) => {
    if (err) {
      console.error('Error fetching gate pass:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (gatePassRows.length === 0) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    const gatePass = gatePassRows[0];

    // Fetch materials
    db.query('SELECT * FROM gate_pass_materials WHERE gate_pass_id = ?', [id], (err, materialRows) => {
      if (err) {
        console.error('Error fetching materials:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      gatePass.materials = materialRows;
      res.json(gatePass);
    });
  });
};

function generatePDFContent(doc, gatePass) {
  try {
    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    // Header - Title
    doc.fontSize(18).font('Helvetica-Bold').text('MATERIAL GATE PASS', { align: 'center' });
    doc.moveDown(0.5);
    
    // Print status (Original/Duplicate)
    const printStatus = (gatePass.print_count && gatePass.print_count > 0) ? 'DUPLICATE' : 'ORIGINAL';
    doc.fontSize(12).font('Helvetica-Bold').fillColor('red').text(printStatus, { align: 'center' });
    doc.fillColor('black');
    doc.moveDown(0.5);
    
    // Gate Pass Number and Date
    doc.fontSize(10).font('Helvetica');
    doc.text(`Gate Pass No: GP-2025-${String(gatePass.gate_pass_id).padStart(5, '0')}`, { align: 'center' });
    doc.text(`Date Issued: ${new Date(gatePass.created_at).toISOString().split('T')[0]}`, { align: 'center' });
    doc.moveDown(1);

    // Requester Information Section
    drawSectionHeader(doc, 'Requester Information', margin);
    const requesterTable = [
      ['Name', gatePass.requester_name || 'N/A', 'Employee ID', gatePass.created_by || 'N/A'],
      ['Department', gatePass.department || gatePass.requester_role || 'N/A', 'From Location', gatePass.location || 'N/A'],
      ['Emergency Contact', gatePass.requester_phone || 'N/A', '', '']
    ];
    drawInfoTable(doc, requesterTable, margin, contentWidth);
    doc.moveDown(1);

    // Gate Pass Details Section
    drawSectionHeader(doc, 'Gate Pass Details', margin);
    const gatePassTable = [
      ['Gate Pass Type', gatePass.request_type || 'N/A', 'Required Dispatch Date', gatePass.request_date || 'N/A'],
      ['Purpose / Reason', gatePass.purpose || 'N/A', '', '']
    ];
    drawInfoTable(doc, gatePassTable, margin, contentWidth);
    doc.moveDown(1);

    // Material Details Section
    drawSectionHeader(doc, 'Material Details', margin);
    drawMaterialTable(doc, gatePass.materials || [], margin, contentWidth);
    doc.moveDown(1);

    // Destination & Transport Section
    drawSectionHeader(doc, 'Destination & Transport', margin);
    const destTable = [
      ['To Location (External)', gatePass.destination_address || 'N/A', 'Transport Mode', gatePass.transport_mode || 'N/A'],
      ['Address', gatePass.destination_address || 'N/A', '', ''],
      ['Driver Name', gatePass.driver_name || 'N/A', 'Vehicle No.', gatePass.vehicle_no || 'N/A'],
      ['Remarks', gatePass.remarks || 'N/A', '', '']
    ];
    drawInfoTable(doc, destTable, margin, contentWidth);
    doc.moveDown(1);

    // Approval Details Section
    drawSectionHeader(doc, 'Approval Details', margin);
    const approvalDate = gatePass.updated_at ? new Date(gatePass.updated_at).toLocaleString() : 'N/A';
    const approvalTable = [
      ['Approved By', gatePass.approver_name || 'N/A', 'Approval Date', approvalDate]
    ];
    drawInfoTable(doc, approvalTable, margin, contentWidth);
    doc.moveDown(1);

    // Security Section
    drawSectionHeader(doc, 'For Security Use Only', margin);
    drawSecurityTable(doc, margin, contentWidth);
    
   // Footer - positioned at current position but right-aligned
   const footerText = 'This document is system generated after approval. Security section must be filled before dispatch.';
   const currentY = doc.y;
   const footerX = pageWidth - margin - 250; // Position from right edge
   
   doc.fontSize(8).font('Helvetica-Oblique')
      .text(footerText, footerX, currentY, { 
        align: 'right', 
        width: 250 
      });

  } catch (error) {
    console.error('Error generating PDF content:', error);
    doc.text('Error generating PDF content');
  }
}

function drawSectionHeader(doc, title, margin) {
  doc.fontSize(12).font('Helvetica-Bold').fillColor('blue').text(title, margin, doc.y, { 
    underline: true,
    continued: false
  });
  doc.fillColor('black');
  doc.moveDown(0.5);
}

function drawInfoTable(doc, rows, startX, tableWidth) {
  const startY = doc.y;
  const rowHeight = 20;
  const colWidth = tableWidth / 4;
  
  rows.forEach((row, rowIndex) => {
    const y = startY + (rowIndex * rowHeight);
    
    // Draw row border
    doc.rect(startX, y, tableWidth, rowHeight).stroke();
    
    // Draw column separators
    for (let i = 1; i < 4; i++) {
      const x = startX + (i * colWidth);
      doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
    }
    
    // Add text content
    row.forEach((cell, colIndex) => {
      const x = startX + (colIndex * colWidth) + 5;
      const cellY = y + 5;
      
      if (colIndex % 2 === 0) {
        // Header cells (bold)
        doc.fontSize(9).font('Helvetica-Bold').text(cell, x, cellY, { 
          width: colWidth - 10, 
          height: rowHeight - 10 
        });
      } else {
        // Data cells (normal)
        doc.fontSize(9).font('Helvetica').text(cell, x, cellY, { 
          width: colWidth - 10, 
          height: rowHeight - 10 
        });
      }
    });
  });
  
  doc.y = startY + (rows.length * rowHeight);
}

function drawMaterialTable(doc, materials, startX, tableWidth) {
  const startY = doc.y;
  const rowHeight = 20;
  const headers = ['Description', 'Serial No. / Item Code', 'Qty', 'UOM', 'Returnable', 'Return Date'];
  const colWidths = [120, 80, 40, 40, 60, 70]; // Adjusted widths
  
  // Draw header
  let currentX = startX;
  headers.forEach((header, index) => {
    doc.rect(currentX, startY, colWidths[index], rowHeight).stroke();
    doc.fontSize(9).font('Helvetica-Bold').text(header, currentX + 3, startY + 5, {
      width: colWidths[index] - 6,
      height: rowHeight - 10
    });
    currentX += colWidths[index];
  });
  
  // Draw material rows
  if (materials && materials.length > 0) {
    materials.forEach((material, rowIndex) => {
      const y = startY + ((rowIndex + 1) * rowHeight);
      currentX = startX;
      
      const rowData = [
        material.description || 'N/A',
        material.serial_number || 'N/A',
        material.qty?.toString() || '0',
        material.uom || 'Unit',
        material.returnable ? 'Yes' : 'No',
        material.returnable ? (material.return_date || 'N/A') : 'N/A'
      ];
      
      rowData.forEach((cell, colIndex) => {
        doc.rect(currentX, y, colWidths[colIndex], rowHeight).stroke();
        doc.fontSize(8).font('Helvetica').text(cell, currentX + 3, y + 5, {
          width: colWidths[colIndex] - 6,
          height: rowHeight - 10
        });
        currentX += colWidths[colIndex];
      });
    });
    doc.y = startY + ((materials.length + 1) * rowHeight);
  } else {
    // No materials row
    const y = startY + rowHeight;
    doc.rect(startX, y, tableWidth, rowHeight).stroke();
    doc.fontSize(9).font('Helvetica').text('No materials listed', startX + 5, y + 5);
    doc.y = y + rowHeight;
  }
}

function drawSecurityTable(doc, startX, tableWidth) {
  const startY = doc.y;
  const rowHeight = 25;
  const colWidth = tableWidth / 4;
  
  const securityData = [
    ['Guard on Duty (Name, Signature & Badge ID)', 'Date / Time Out', 'Security Stamp', 'Supporting Document'],
    ['Signature: \n\n______________', 'Date: \n\n______________', 'Security Stamp: \n\n______________', 'Serial No(s): \n\n______________'],
    ['Name: \n\n______________', 'Time: \n\n______________', '', 'Others (please specify): \n\n______________'],
    ['Badge ID / No: \n\n______________', 'AM/PM \nGate No: \n\n______________', '', 'Packing Slip Ref No: \n\n______________']
  ];
  
  securityData.forEach((row, rowIndex) => {
    const y = startY + (rowIndex * rowHeight);
    
    // Draw row border
    doc.rect(startX, y, tableWidth, rowHeight).stroke();
    
    // Draw column separators
    for (let i = 1; i < 4; i++) {
      const x = startX + (i * colWidth);
      doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke();
    }
    
    // Add text content
    row.forEach((cell, colIndex) => {
      const x = startX + (colIndex * colWidth) + 3;
      const cellY = y + 3;
      
      const fontSize = rowIndex === 0 ? 8 : 7;
      const font = rowIndex === 0 ? 'Helvetica-Bold' : 'Helvetica';
      
      doc.fontSize(fontSize).font(font).text(cell, x, cellY, { 
        width: colWidth - 6, 
        height: rowHeight - 6 
      });
    });
  });
  
  doc.y = startY + (securityData.length * rowHeight);
}

// Updated main PDF generation function
exports.generateGatePassPDF = (req, res) => {
  const { id } = req.params;
  
  // First check if gate pass is approved
  db.query('SELECT status, print_count FROM gate_pass_requests WHERE gate_pass_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Gate Pass not found' });
    }
    
    const gatePass = results[0];
    
    if (gatePass.status !== 'Approved') {
      return res.status(403).json({ message: 'Only approved gate passes can be printed' });
    }
    
    // Get full gate pass details with materials
    const query = `
      SELECT 
        gpr.*,
        u1.full_name AS requester_name,
        u1.email AS requester_email,
        u1.department AS requester_role,
        u1.phone_number AS requester_phone,
        u1.location AS requester_location,
        u2.full_name AS approver_name
      FROM gate_pass_requests gpr
      LEFT JOIN users u1 ON gpr.created_by = u1.id
      LEFT JOIN users u2 ON gpr.approved_by = u2.id
      WHERE gpr.gate_pass_id = ?`;

    db.query(query, [id], (err, gatePassRows) => {
      if (err) {
        console.error('Error fetching gate pass:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (gatePassRows.length === 0) {
        return res.status(404).json({ message: 'Gate pass not found' });
      }

      const gatePassData = gatePassRows[0];

      // Fetch materials
      db.query('SELECT * FROM gate_pass_materials WHERE gate_pass_id = ?', [id], (err, materialRows) => {
        if (err) {
          console.error('Error fetching materials:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        gatePassData.materials = materialRows;
        
        try {
          // Set response headers with custom filename
          const filename = `gate_pass_${id}.pdf`;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
          res.setHeader('Cache-Control', 'no-cache');
          
          // Create PDF document
          const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4'
          });
          
          // Handle PDF errors
          doc.on('error', (err) => {
            console.error('PDF generation error:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Failed to generate PDF' });
            }
          });
          
          // Pipe PDF to response
          doc.pipe(res);
          
          // Add content to PDF using the new custom format
          generatePDFContent(doc, gatePassData);
          
          // Finalize PDF
          doc.end();
          
          // Update print count
          db.query('UPDATE gate_pass_requests SET print_count = COALESCE(print_count, 0) + 1 WHERE gate_pass_id = ?', [id], (err) => {
            if (err) console.error('Failed to update print count:', err);
          });
          
        } catch (err) {
          console.error('PDF processing error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'PDF generation failed' });
          }
        }
      });
    });
  });
};