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