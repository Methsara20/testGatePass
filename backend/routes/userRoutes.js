const express = require('express');
const router = express.Router();
const { getUsers, addUser, updateUser, deleteUser, loginUser, getUserById, updatePassword } = require('../controllers/userController');


router.get('/', getUsers);
router.post('/', addUser);
router.post('/login', loginUser); // Endpoint for user login
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.get('/:id', getUserById);
router.put("/:id/password", updatePassword);

module.exports = router;
