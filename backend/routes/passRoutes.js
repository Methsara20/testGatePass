const express = require('express');
const router = express.Router();
const { getPasses, addGatepass, updateGatepass, deleteGatepass, getPassSummary, approveGatepass, rejectGatepass, getMyRequests } = require('../controllers/passController');

router.get('/', getPasses);
router.post('/', addGatepass);
router.put('/:id', updateGatepass);
router.delete('/:id', deleteGatepass);

//New routes for Approval screen
router.get('/summary', getPassSummary);
router.put('/:id/approve', approveGatepass);
router.put('/:id/reject', rejectGatepass);

router.get('/my/:userId', getMyRequests);


module.exports = router;
