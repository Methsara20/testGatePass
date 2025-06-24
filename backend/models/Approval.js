module.exports = {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    gate_pass_id: 'INT NOT NULL',
    approved_by: 'INT NOT NULL',
    status: "ENUM('Approved', 'Rejected') NOT NULL",
    remarks: 'TEXT',
    approved_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
};