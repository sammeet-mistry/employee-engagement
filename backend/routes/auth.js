const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../validators/validation');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/profile', auth, getProfile);

module.exports = router;