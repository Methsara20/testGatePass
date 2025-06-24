const express = require('express');
const router = express.Router();
const { getApprovals } = require('../controllers/approvalController');

router.get('/', getApprovals);

module.exports = router;
