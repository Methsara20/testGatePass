// routes/cancelApprovalRoutes.js
const express = require('express');
const router = express.Router();
const { getCancellableApprovals, getCancelledApprovals, cancelApproval } = require('../controllers/cancelApprovalController');

// Fetch waiting (approved & cancellable) requests
router.get('/cancellable', getCancellableApprovals);
router.get('/cancelled', getCancelledApprovals);
router.put('/cancel', cancelApproval);

module.exports = router;
