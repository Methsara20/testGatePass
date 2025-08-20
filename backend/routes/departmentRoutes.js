const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

router.get('/', departmentController.getAllDepartments);
router.post('/', departmentController.addDepartment);
router.delete('/:id', departmentController.deleteDepartment);
router.put('/:id', departmentController.updateDepartment);

module.exports = router;
