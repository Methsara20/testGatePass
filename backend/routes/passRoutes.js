const express = require('express');
const router = express.Router();
const { getPasses, addGatepass, updateGatepass, deleteGatepass, getPassSummary, approveGatepass, rejectGatepass, getMyRequests, getDeliverablePasses, acceptDelivery, rejectDelivery } = require('../controllers/passController');

router.get('/', getPasses);
router.post('/', addGatepass);
router.put('/:id', updateGatepass);
router.delete('/:id', deleteGatepass);

//New routes for Approval screen
router.get('/summary', getPassSummary);
router.put('/:id/approve', approveGatepass);
router.put('/:id/reject', rejectGatepass);

//For Get the current user's requests
router.get('/my/:userId', getMyRequests);

//Gate-pass accept routes
router.get('/deliveries', getDeliverablePasses);
router.put('/:id/accept', acceptDelivery); 
router.put('/:id/issue',  rejectDelivery);


module.exports = router;
