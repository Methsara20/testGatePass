
const express = require('express');
const router = express.Router();
const {
  getEligibleReturnPasses,
  createReturnRequest,
  getReturnRequests, // Make sure this exists
  getAllReturnRequests,
  rejectReturnRequest,
  getPendingReturnRequests,
  approveReturnRequest,
  getApprovedReturnRequests,
  getRejectReturnRequests
} = require('../controllers/returnGatePassController');

// Ensure all these routes exist
router.get('/eligible', getEligibleReturnPasses);
router.post('/create', createReturnRequest);
router.get('/list', getReturnRequests); // This was previously commented out
router.get('/all', getAllReturnRequests);
router.get('/pending', getPendingReturnRequests);
router.put('/:id/approve-return', approveReturnRequest);
router.put('/:id/reject-return', rejectReturnRequest);
router.get('/return-approve', getApprovedReturnRequests);
router.get('/return-reject', getRejectReturnRequests);

module.exports = router;


// const express = require('express');
// const router = express.Router();
// const {
//   getEligibleReturnPasses,
//   createReturnRequest,
//   getReturnRequests,
//   getAllReturnRequests,
//   rejectReturnRequest,
//   getPendingReturnRequests,
//   approveReturnRequest,
//   getMyReturnRequests,            // ✅ NEW
//   getMyPendingReturnRequests,     // ✅ NEW
//   getMyApprovedReturnRequests,    // ✅ NEW
//   getMyRejectedReturnRequests,    // ✅ NEW
//   getReturnRequestDetails         // ✅ NEW
// } = require('../controllers/returnGatePassController');

// // Existing routes
// router.get('/eligible', getEligibleReturnPasses);
// router.post('/create', createReturnRequest);
// router.get('/list', getReturnRequests);
// router.get('/all', getAllReturnRequests);
// router.get('/pending', getPendingReturnRequests);
// router.put('/:id/approve-return', approveReturnRequest);
// router.put('/:id/reject', rejectReturnRequest);

// // ✅ New routes for logged-in user's own return requests
// router.get('/my', getMyReturnRequests);
// router.get('/my/pending', getMyPendingReturnRequests);
// router.get('/my/approved', getMyApprovedReturnRequests);
// router.get('/my/rejected', getMyRejectedReturnRequests);

// // ✅ New route for full details with materials
// router.get('/details/:gate_pass_id', getReturnRequestDetails);

// module.exports = router;
