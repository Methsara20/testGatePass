const db = require('../config/db');
const transporter = require('../utils/email');
const { generateToken } = require("../utils/token");
const emailTemplate = require("../utils/emailTemplate");

exports.getApprovals = (req, res) => {
    db.query('SELECT * FROM approvals', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.addApproval = (req, res) => {
    const { gate_pass_id, approved_by, status, remarks } = req.body;

    const addApprovalQuery = `
        INSERT INTO approvals (gate_pass_id, approved_by, status, remarks)
        VALUES (?, ?, ?, ?)
    `;

    const updateGatePassStatusQuery = `
        UPDATE gate_pass_requests
        SET status = ?, approved_by = ?
        WHERE gate_pass_id = ?
    `;

    // Add approval
    db.query(addApprovalQuery, [gate_pass_id, approved_by, status, remarks], (err, approvalResult) => {
        if (err) return res.status(500).json({ error: err.message });

        // Update the gate_pass_requests status based on approval status
        db.query(updateGatePassStatusQuery, [status, gate_pass_id], (err, gatePassResult) => {
            if (err) return res.status(500).json({ error: err.message });

            if (gatePassResult.affectedRows === 0) {
                return res.status(404).json({ message: 'Gate pass not found for the provided gate_pass_id' });
            }

            res.status(201).json({ 
                message: 'Approval added and Gate pass status updated successfully', 
                approvalId: approvalResult.insertId 
            });
        });
    });
};



exports.updateApproval = (req, res) => {
    const { id } = req.params; // Extract the `id` of the approval to be updated
    const { gate_pass_id, approved_by, status, remarks } = req.body; // Fields to update

    const updateApprovalQuery = `
        UPDATE approvals
        SET gate_pass_id = ?, approved_by = ?, status = ?, remarks = ?
        WHERE approval_id = ?
    `;

    const updateGatePassStatusQuery = `
        UPDATE gate_pass_requests
        SET status = ?, approved_by = ?
        WHERE gate_pass_id = ?
    `;

    // Update the approval
    db.query(updateApprovalQuery, [gate_pass_id, approved_by, status, remarks, id], (err, approvalResult) => {
        if (err) return res.status(500).json({ error: err.message });

        if (approvalResult.affectedRows === 0) {
            return res.status(404).json({ message: 'Approval not found' });
        }

        // Update the gate pass status based on the approval status
        db.query(updateGatePassStatusQuery, [status, gate_pass_id], (err, gatePassResult) => {
            if (err) return res.status(500).json({ error: err.message });

            if (gatePassResult.affectedRows === 0) {
                return res.status(404).json({ message: 'Gate pass not found for the provided gate_pass_id' });
            }

            res.json({ message: 'Approval and Gate pass status updated successfully' });
        });
    });
};



exports.deleteApproval = (req, res) => {
    const { id } = req.params; // Extract `id` from URL parameters

    const query = `
        DELETE FROM approvals
        WHERE approval_id = ?
    `;
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Approval not found' });
        }
        res.json({ message: 'Approval deleted successfully' });
    });
};

exports.sendApprovalEmail = (req, res) => {
    const { gate_pass_id } = req.body;

    // 1. Get gate pass + requester with their location and department
    const getGatePassQuery = `
        SELECT g.gate_pass_id, g.destination_address, g.department, g.purpose,
               u.full_name AS requester_name, 
               u.department AS requester_department,
               u.location AS requester_location
        FROM gate_pass_requests g
        JOIN users u ON g.created_by = u.id
        WHERE g.gate_pass_id = ?
    `;

    db.query(getGatePassQuery, [gate_pass_id], (err, gatePassResults) => {
        if (err) return res.status(500).json({ error: err.message });

        if (gatePassResults.length === 0) {
            return res.status(404).json({ message: 'Gate pass not found' });
        }

        const gatePass = gatePassResults[0];

        // 2. Find HOD or Admin based on requester's location and department
        const getApproverQuery = `
            SELECT email, full_name, role
            FROM users
            WHERE (role = 'HOD' OR role = 'Admin')
              AND department = ?
              AND location = ?
              AND status = 'active'
            ORDER BY FIELD(role, 'HOD', 'Admin')
            LIMIT 1
        `;

        db.query(getApproverQuery, [gatePass.requester_department, gatePass.requester_location], (err, approverResults) => {
            if (err) return res.status(500).json({ error: err.message });

            if (approverResults.length === 0) {
                return res.status(404).json({ 
                    message: 'No active HOD or Admin found for this location and department',
                    requesterLocation: gatePass.requester_location,
                    requesterDepartment: gatePass.requester_department
                });
            }

            const approver = approverResults[0];

            // 3. Generate token
            const token = generateToken();
            const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            const updateTokenQuery = `
                UPDATE gate_pass_requests
                SET approval_token = ?, token_expiry = ?
                WHERE gate_pass_id = ?
            `;

            db.query(updateTokenQuery, [token, expiry, gate_pass_id], (err, updateResult) => {
                if (err) return res.status(500).json({ error: err.message });

                if (updateResult.affectedRows === 0) {
                    return res.status(404).json({ message: 'Failed to update gate pass with token' });
                }

                // 4. Send email
                const loginLink = `${process.env.APP_URL || 'http://localhost:5173'}/login`;

                const mailOptions = {
                    from: '"Gate Pass System" <no-reply@company.com>',
                    to: approver.email,
                    subject: 'New Gate Pass Request – Approval Required',
                    html: emailTemplate({
                        hodName: approver.full_name,
                        gatePassNo: gatePass.gate_pass_id,
                        requester: gatePass.requester_name,
                        destination_address: gatePass.destination_address,
                        department: gatePass.department,
                        purpose: gatePass.purpose,
                        submittedDate: new Date().toLocaleString(),
                        loginLink
                    })
                };

                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        return res.status(500).json({ 
                            error: 'Failed to send email', 
                            details: err.message 
                        });
                    }

                    res.status(200).json({ 
                        message: 'Approval email sent successfully',
                        emailSent: true,
                        recipient: approver.email,
                        recipientRole: approver.role,
                        requesterLocation: gatePass.requester_location,
                        requesterDepartment: gatePass.requester_department
                    });
                });
            });
        });
    });
};