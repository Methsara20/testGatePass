const express = require('express');
const router = express.Router();
const { getPasses, addGatepass, updateGatepass, deleteGatepass } = require('../controllers/passController');

router.get('/', getPasses);
router.post('/', addGatepass);
router.put('/:id', updateGatepass);
router.delete('/:id', deleteGatepass);


module.exports = router;
