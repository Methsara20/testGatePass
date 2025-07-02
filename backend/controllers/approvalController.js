const db = require('../config/db');

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