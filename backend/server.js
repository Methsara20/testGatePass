const express = require('express');
const cors = require('cors');
const dotenv = require('./config/dotenv');
const userRoutes = require('./routes/userRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const passRoutes = require('./routes/passRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const locationRoutes = require('./routes/locationRoutes'); 
const departmentRoutes = require('./routes/departmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const cancelApprovalRoutes = require('./routes/cancelApprovalRoutes');
const returnGatePassRoutes = require('./routes/returnGatePassRoutes');
const notificationsRoutes = require("./routes/notificationsRoutes");
const { errorHandler } = require('./utils/errorHandler');
const { logger } = require('./utils/logger');


const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',         
    'http://192.168.10.144:5173',    
    'http://192.168.x.x:5173'        
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(logger);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/passes', passRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/departments', departmentRoutes); 
app.use('/api/reports', reportRoutes);
app.use('/api/cancel-approval', cancelApprovalRoutes);
app.use('/api/return-gatepass', returnGatePassRoutes);
app.use("/api/notifications", notificationsRoutes);


// Error handler
app.use(errorHandler);

const PORT = dotenv.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Accessible from:
  - Local: http://localhost:${PORT}
  - Network: http://${getNetworkIp()}:${PORT}`);
});

// Helper to get network IP (optional)
function getNetworkIp() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}