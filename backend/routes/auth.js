const express = require('express');
const { register, login, logout, getProfile, getCsrfToken, getSocketToken } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../validators/validation');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);
router.get('/csrf', getCsrfToken);
router.get('/socket-token', auth, getSocketToken);

module.exports = router;