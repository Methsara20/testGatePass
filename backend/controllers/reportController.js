const db = require('../config/db');
const ExcelJS = require('exceljs');  // For Excel export

// Utility: Build dynamic filters
const buildFilters = (query) => {
    const filters = [];
    const values = [];

    if (query.start_date && query.end_date) {
        filters.push("gpr.created_at BETWEEN ? AND ?");
        values.push(query.start_date, query.end_date);
    }
    if (query.status) {
        filters.push("gpr.status = ?");
        values.push(query.status);
    }
    if (query.department) {
        filters.push("gpr.department = ?");
        values.push(query.department);
    }
    if (query.from_location) {
        filters.push("gpr.location = ?");
        values.push(query.from_location);
    }
    if (query.to_location) {
        filters.push("gpr.destination_address = ?");
        values.push(query.to_location);
    }

    return { whereClause: filters.length ? "WHERE " + filters.join(" AND ") : "", values };
};

// Helper: Export data to Excel
const exportToExcel = async (res, reportName, columns, data) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(reportName);

    sheet.columns = columns;
    data.forEach(row => sheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${reportName}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
};


exports.getGatePassSummary = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);

    const query = `
        SELECT 
            gpr.gate_pass_id,
            gpr.created_by,
            req_user.full_name AS requester_name,  
            gpr.department,
            gpr.location AS from_location,
            gpr.destination_address AS to_location,
            gpr.receiver_name,
            gpr.approved_by,
            appr_user.full_name AS approved_by_name,  
            gpr.status,
            gpr.created_at
        FROM gate_pass_requests gpr
        LEFT JOIN users req_user ON gpr.created_by = req_user.id
        LEFT JOIN users appr_user ON gpr.approved_by = appr_user.id
        ${whereClause}
        ORDER BY gpr.created_at DESC;
    `;

    db.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};


exports.exportGatePassSummary = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);

    const query = `
        SELECT 
            gpr.gate_pass_id,
            req_user.full_name AS requester_name,
            gpr.department,
            gpr.location AS from_location,
            gpr.destination_address AS to_location,
            gpr.receiver_name,
            appr_user.full_name AS approved_by_name,
            gpr.status,
            gpr.created_at
        FROM gate_pass_requests gpr
        LEFT JOIN users req_user ON gpr.created_by = req_user.id
        LEFT JOIN users appr_user ON gpr.approved_by = appr_user.id
        ${whereClause}
        ORDER BY gpr.created_at DESC;
    `;

    db.query(query, values, async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        await exportToExcel(res, 'Gate_Pass_Summary', [
            { header: 'Gate Pass ID', key: 'gate_pass_id' },
            { header: 'Requester', key: 'requester_name' },
            { header: 'Department', key: 'department' },
            { header: 'From Location', key: 'from_location' },
            { header: 'To Location', key: 'to_location' },
            { header: 'Receiver', key: 'receiver_name' },
            { header: 'Approved By', key: 'approved_by_name' },
            { header: 'Status', key: 'status' },
            { header: 'Date', key: 'created_at' }
        ], results);
    });
};



exports.getOverdueMaterials = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);
    const query = `
        SELECT gpr.gate_pass_id, gm.description AS material_name, gm.qty,
               gpr.created_by AS issuer, gpr.receiver_name,
               gm.return_date, DATEDIFF(CURDATE(), gm.return_date) AS days_overdue
        FROM gate_pass_requests gpr
        JOIN gate_pass_materials gm ON gpr.gate_pass_id = gm.gate_pass_id
        ${whereClause}
        AND gm.return_date < CURDATE()
        AND (gpr.delivery_status != 'Accepted' OR gpr.delivery_status IS NULL)
        ORDER BY gm.return_date ASC;
    `;
    db.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.exportOverdueMaterials = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);
    const query = `
        SELECT gpr.gate_pass_id, gm.description AS material_name, gm.qty,
               gpr.created_by AS issuer, gpr.receiver_name,
               gm.return_date, DATEDIFF(CURDATE(), gm.return_date) AS days_overdue
        FROM gate_pass_requests gpr
        JOIN gate_pass_materials gm ON gpr.gate_pass_id = gm.gate_pass_id
        ${whereClause}
        AND gm.return_date < CURDATE()
        AND (gpr.delivery_status != 'Accepted' OR gpr.delivery_status IS NULL)
        ORDER BY gm.return_date ASC;
    `;
    db.query(query, values, async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        await exportToExcel(res, 'Overdue_Materials', [
            { header: 'Gate Pass ID', key: 'gate_pass_id' },
            { header: 'Material Name', key: 'material_name' },
            { header: 'Quantity', key: 'qty' },
            { header: 'Issuer', key: 'issuer' },
            { header: 'Receiver', key: 'receiver_name' },
            { header: 'Due Date', key: 'return_date' },
            { header: 'Days Overdue', key: 'days_overdue' }
        ], results);
    });
};


// exports.getApprovedVsRejected = (req, res) => {
//     const { whereClause, values } = buildFilters(req.query);

//     const countQuery = `
//         SELECT status, COUNT(*) AS count
//         FROM gate_pass_requests gpr
//         ${whereClause}
//         GROUP BY status;
//     `;
//     const detailQuery = `
//         SELECT gpr.gate_pass_id, gpr.created_by AS requester, gpr.department,
//                gpr.location AS from_location, gpr.destination_address AS to_location,
//                gpr.receiver_name, gpr.status, gpr.created_at
//         FROM gate_pass_requests gpr
//         ${whereClause}
//         ORDER BY gpr.created_at DESC;
//     `;
//     db.query(countQuery, values, (err, counts) => {
//         if (err) return res.status(500).json({ error: err.message });
//         db.query(detailQuery, values, (err2, details) => {
//             if (err2) return res.status(500).json({ error: err2.message });
//             res.json({ counts, details });
//         });
//     });
// };

// exports.exportApprovedVsRejected = (req, res) => {
//     const { whereClause, values } = buildFilters(req.query);
//     const query = `
//         SELECT gpr.gate_pass_id, gpr.created_by AS requester, gpr.department,
//                gpr.location AS from_location, gpr.destination_address AS to_location,
//                gpr.receiver_name, gpr.status, gpr.created_at
//         FROM gate_pass_requests gpr
//         ${whereClause}
//         ORDER BY gpr.created_at DESC;
//     `;
//     db.query(query, values, async (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         await exportToExcel(res, 'Approved_vs_Rejected', [
//             { header: 'Gate Pass ID', key: 'gate_pass_id' },
//             { header: 'Requester', key: 'requester' },
//             { header: 'Department', key: 'department' },
//             { header: 'From Location', key: 'from_location' },
//             { header: 'To Location', key: 'to_location' },
//             { header: 'Receiver', key: 'receiver_name' },
//             { header: 'Status', key: 'status' },
//             { header: 'Date', key: 'created_at' }
//         ], results);
//     });
// };


exports.getApprovedVsRejected = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);

    const countQuery = `
        SELECT status, COUNT(*) AS count
        FROM gate_pass_requests gpr
        ${whereClause}
        GROUP BY status;
    `;

    const detailQuery = `
        SELECT 
            gpr.gate_pass_id,
            gpr.created_by AS requester_id,
            requester.full_name AS requester_name,
            gpr.approved_by AS approved_by_id,
            approver.full_name AS approved_by_name,
            gpr.department,
            gpr.location AS from_location,
            gpr.destination_address AS to_location,
            gpr.receiver_name,
            gpr.status,
            gpr.created_at
        FROM gate_pass_requests gpr
        LEFT JOIN users requester ON gpr.created_by = requester.id
        LEFT JOIN users approver ON gpr.approved_by = approver.id
        ${whereClause}
        ORDER BY gpr.created_at DESC;
    `;

    db.query(countQuery, values, (err, counts) => {
        if (err) return res.status(500).json({ error: err.message });
        db.query(detailQuery, values, (err2, details) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ counts, details });
        });
    });
};


exports.exportApprovedVsRejected = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);

    const query = `
        SELECT 
            gpr.gate_pass_id,
            gpr.created_by AS requester_id,
            requester.full_name AS requester_name,
            gpr.approved_by AS approved_by_id,
            approver.full_name AS approved_by_name,
            gpr.department,
            gpr.location AS from_location,
            gpr.destination_address AS to_location,
            gpr.receiver_name,
            gpr.status,
            gpr.created_at
        FROM gate_pass_requests gpr
        LEFT JOIN users requester ON gpr.created_by = requester.id
        LEFT JOIN users approver ON gpr.approved_by = approver.id
        ${whereClause}
        ORDER BY gpr.created_at DESC;
    `;

    db.query(query, values, async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        await exportToExcel(res, 'Approved_vs_Rejected', [
            { header: 'Gate Pass ID', key: 'gate_pass_id' },
            { header: 'Requester ID', key: 'requester_id' },
            { header: 'Requester Name', key: 'requester_name' },
            { header: 'Approved By ID', key: 'approved_by_id' },
            { header: 'Approved By Name', key: 'approved_by_name' },
            { header: 'Department', key: 'department' },
            { header: 'From Location', key: 'from_location' },
            { header: 'To Location', key: 'to_location' },
            { header: 'Receiver', key: 'receiver_name' },
            { header: 'Status', key: 'status' },
            { header: 'Date', key: 'created_at' }
        ], results);
    });
};



// // ✅ Fetch Audit Logs (JSON API with JOINs)
// exports.getAuditLog = (req, res) => {
//     const { start_date, end_date } = req.query;
//     const query = `
//         SELECT 
//             al.timestamp, 
//             al.user_name, 
//             al.action, 
//             al.gate_pass_id,
//             gpr.status AS gate_pass_status,
//             gpr.department,
//             gpr.location AS from_location,
//             gpr.destination_address AS to_location,
//             u.email AS user_email
//         FROM audit_logs al
//         LEFT JOIN gate_pass_requests gpr ON al.gate_pass_id = gpr.gate_pass_id
//         LEFT JOIN users u ON al.user_id = u.id
//         WHERE al.timestamp BETWEEN ? AND ?
//         ORDER BY al.timestamp DESC;
//     `;
//     db.query(query, [start_date, end_date], (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         res.json(results);
//     });
// };

// // ✅ Export Audit Logs (Excel)
// exports.exportAuditLog = (req, res) => {
//     const { start_date, end_date } = req.query;
//     const query = `
//         SELECT 
//             al.timestamp, 
//             al.user_name, 
//             al.action, 
//             al.gate_pass_id,
//             gpr.status AS gate_pass_status,
//             gpr.department,
//             gpr.location AS from_location,
//             gpr.destination_address AS to_location,
//             u.email AS user_email
//         FROM audit_logs al
//         LEFT JOIN gate_pass_requests gpr ON al.gate_pass_id = gpr.gate_pass_id
//         LEFT JOIN users u ON al.user_id = u.id
//         WHERE al.timestamp BETWEEN ? AND ?
//         ORDER BY al.timestamp DESC;
//     `;
//     db.query(query, [start_date, end_date], async (err, results) => {
//         if (err) return res.status(500).json({ error: err.message });
//         await exportToExcel(res, 'Audit_Log', [
//             { header: 'Timestamp', key: 'timestamp' },
//             { header: 'User', key: 'user_name' },
//             { header: 'Email', key: 'user_email' },
//             { header: 'Action', key: 'action' },
//             { header: 'Gate Pass ID', key: 'gate_pass_id' },
//             { header: 'Status', key: 'gate_pass_status' },
//             { header: 'Department', key: 'department' },
//             { header: 'From Location', key: 'from_location' },
//             { header: 'To Location', key: 'to_location' }
//         ], results);
//     });
// };



exports.getMaterialMovement = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);
    const query = `
        SELECT 
            gpr.gate_pass_id,
            u.full_name AS requester_name,
            gm.description AS material_name,
            gm.qty,
            gpr.receiver_name AS receiver,
            gpr.created_at AS out_date,
            gm.return_date AS in_date
        FROM gate_pass_materials gm
        JOIN gate_pass_requests gpr ON gm.gate_pass_id = gpr.gate_pass_id
        LEFT JOIN users u ON gpr.created_by = u.id
        ${whereClause}
        ORDER BY gpr.created_at DESC;
    `;
    db.query(query, values, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};


exports.exportMaterialMovement = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);
    const query = `
        SELECT 
            gpr.gate_pass_id,
            u.full_name AS requester_name,
            gm.description AS material_name,
            gm.qty,
            gpr.receiver_name AS receiver,
            gpr.created_at AS out_date,
            gm.return_date AS in_date
        FROM gate_pass_materials gm
        JOIN gate_pass_requests gpr ON gm.gate_pass_id = gpr.gate_pass_id
        LEFT JOIN users u ON gpr.created_by = u.id
        ${whereClause}
        ORDER BY gpr.created_at DESC;
    `;
    db.query(query, values, async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        await exportToExcel(res, 'Material_Movement', [
            { header: 'Gate Pass ID', key: 'gate_pass_id' },   
            { header: 'Requester', key: 'requester_name' },    
            { header: 'Material Name', key: 'material_name' },
            { header: 'Quantity', key: 'qty' },
            { header: 'Receiver', key: 'receiver' },
            { header: 'Out Date', key: 'out_date' },
            { header: 'In Date', key: 'in_date' }
        ], results);
    });
};




exports.getAcceptanceReport = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);

    const conditionClause = whereClause 
        ? `${whereClause} AND gpr.delivery_status = 'Accepted'`
        : `WHERE gpr.delivery_status = 'Accepted'`;

    const query = `
        SELECT gpr.gate_pass_id, 
               gpr.created_by AS requester,
               gpr.receiver_name AS receiver, 
               gpr.approved_by AS accepted_by,
               gpr.updated_at AS accepted_date
        FROM gate_pass_requests gpr
        ${conditionClause}
        ORDER BY gpr.updated_at DESC;
    `;

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};





exports.exportAcceptanceReport = (req, res) => {
    const { whereClause, values } = buildFilters(req.query);
    const query = `
        SELECT gpr.gate_pass_id, gpr.created_by AS requester,
               gpr.receiver_name AS receiver, gpr.approved_by AS accepted_by,
               gpr.updated_at AS accepted_date
        FROM gate_pass_requests gpr
        ${whereClause}
        AND gpr.delivery_status = 'Accepted'
        ORDER BY gpr.updated_at DESC;
    `;
    db.query(query, values, async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        await exportToExcel(res, 'Acceptance_Report', [
            { header: 'Gate Pass ID', key: 'gate_pass_id' },
            { header: 'Requester', key: 'requester' },
            { header: 'Receiver', key: 'receiver' },
            { header: 'Accepted By', key: 'accepted_by' },
            { header: 'Accepted Date', key: 'accepted_date' }
        ], results);
    });
};
