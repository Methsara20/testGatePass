const express = require('express');
const router = express.Router();
const { getPasses } = require('../controllers/passController');

router.get('/', getPasses);

module.exports = router;
