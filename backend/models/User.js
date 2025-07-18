module.exports = {
    id: 'INT AUTO_INCREMENT PRIMARY KEY',
    username: 'VARCHAR(50) NOT NULL UNIQUE',
    password: 'VARCHAR(255) NOT NULL',
    role: "ENUM('Admin', 'Security', 'Employee', 'HOD') NOT NULL",
    location: 'VARCHAR(255) NOT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
};
