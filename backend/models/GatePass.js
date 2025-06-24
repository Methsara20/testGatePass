module.exports = {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    request_type: "ENUM('Employee') NOT NULL",
    item_name: 'VARCHAR(255)',
    quantity: 'INT',
    description: 'TEXT',
    location: 'VARCHAR(255) NOT NULL',
    purpose: 'TEXT NOT NULL',
    status: "ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending'",
};