const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const {
  getPasses,
  addGatepass,
  updateGatepass,
  deleteGatepass,
  getPassSummary,
  approveGatepass,
  rejectGatepass,
  getMyRequests,
  getDeliverablePasses,
  acceptDelivery,
  rejectDelivery
} = require('../controllers/passController');

// Main routes
router.get('/', getPasses);
router.post('/', upload.single('document'), addGatepass); // ✅ uses multer
router.put('/:id', updateGatepass);
router.delete('/:id', deleteGatepass);

// Approval screen
router.get('/summary', getPassSummary);
router.put('/:id/approve', approveGatepass);
router.put('/:id/reject', rejectGatepass);

// My requests
router.get('/my/:userId', getMyRequests);

// Delivery routes
router.get('/deliveries', getDeliverablePasses);
router.put('/:id/accept', acceptDelivery);
router.put('/:id/issue', rejectDelivery);

module.exports = router;
