const express = require('express');
const cors = require('cors');
const dotenv = require('./config/dotenv');
const userRoutes = require('./routes/userRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const passRoutes = require('./routes/passRoutes');
const { errorHandler } = require('./utils/errorHandler');
const { logger } = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/passes', passRoutes);

// Error handler
app.use(errorHandler);

const PORT = dotenv.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
