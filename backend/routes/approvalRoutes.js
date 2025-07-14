const express = require('express');
const router = express.Router();
const { getApprovals, addApproval, updateApproval, deleteApproval, } = require('../controllers/approvalController');

router.get('/', getApprovals);
router.post('/', addApproval);
router.put('/:id', updateApproval);
router.delete('/:id', deleteApproval);



module.exports = router;
