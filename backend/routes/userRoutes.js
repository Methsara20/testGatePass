const express = require('express');
const router = express.Router();
const { getUsers, addUser, updateUser, deleteUser, loginUser } = require('../controllers/userController');


router.get('/', getUsers);
router.post('/', addUser);
router.post('/login', loginUser); // Endpoint for user login
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
module.exports = router;
